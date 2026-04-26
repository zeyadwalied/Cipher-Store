import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { isSiteInMaintenanceMode } from "@/lib/maintenance"
import { calculateDiscount } from "@/lib/discountEngine"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Rate limit: 5 checkout attempts per 5 minutes per IP
    const ip = getClientIp(req)
    const { limited, retryAfterMs } = rateLimit(`checkout:${ip}`, { maxAttempts: 5, windowMs: 5 * 60 * 1000 })
    if (limited) {
      return NextResponse.json(
        { message: "Too many checkout attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs || 0) / 1000)) } }
      )
    }

    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { message: "Your account could not be found. Please sign in again." },
        { status: 401 }
      )
    }

    if (await isSiteInMaintenanceMode() && currentUser.role !== "OWNER") {
      return new NextResponse("System under maintenance", { status: 503 })
    }

    const { items, paymentMethod } = await req.json()

    if (!items || items.length === 0) {
      return new NextResponse("Empty cart", { status: 400 })
    }

    // Verify products, verify stock, and calculate total
    // 1. Fetch all products in one batch query to prevent sequential N+1 slowdowns
    const productIds = items.map((i: any) => i.id)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    // Create a map for fast lookup
    const productsMap = new Map(products.map(p => [p.id, p]))

    // 2. Fetch all required automatic stock items in one batch query
    const automaticProductIds = products.filter(p => p.deliveryType === "AUTOMATIC").map(p => p.id)
    const allAvailableStock = await prisma.stockItem.findMany({
      where: { productId: { in: automaticProductIds }, isUsed: false }
    })

    // Group available stock by product
    const stockByProduct: Record<string, any[]> = {}
    for (const stock of allAvailableStock) {
      if (!stockByProduct[stock.productId]) stockByProduct[stock.productId] = []
      stockByProduct[stock.productId].push(stock)
    }

    let total = 0
    const enhancedItems: { productId: string; quantity: number; price: number; stockItemsToReserve: string[], requiresStockDecrement: boolean }[] = []

    const activeDiscounts = await (prisma as any).discount.findMany({ where: { isActive: true } })

    let firstSellerId = null

    for (const item of items) {
      const product = productsMap.get(item.id)
      if (!product) {
        return new NextResponse(`عذراً، المنتج لم يعد متوفراً في المتجر. يرجى إزالة المنتجات الغير متوفرة من السلة والمحاولة مرة أخرى أو تحديث الصفحة.`, { status: 400 })
      }
      if (!firstSellerId && product.sellerId) {
        firstSellerId = product.sellerId
      }

      const { finalPrice } = calculateDiscount(product, activeDiscounts)
      total += finalPrice * item.quantity

      let stockItemsToReserve: string[] = []

      // 1. If it's AUTOMATIC, ensure we have enough StockItems
      if (product.deliveryType === "AUTOMATIC") {
        const availableStock = stockByProduct[product.id] || []

        if (availableStock.length < item.quantity) {
          return new NextResponse(`Not enough stock for ${product.name}. Only ${availableStock.length} left.`, { status: 400 })
        }

        // Consume stock from the in-memory array to reserve it
        const reservedList = availableStock.splice(0, item.quantity)
        stockItemsToReserve = reservedList.map((s: any) => s.id)
      }

      // 2. If it has a stockQuantity limit (integer), ensure we have enough units
      if ((product as any).stockQuantity !== null) {
        if ((product as any).stockQuantity < item.quantity) {
          return new NextResponse(`Not enough units for ${product.name}. Only ${(product as any).stockQuantity} left.`, { status: 400 })
        }
      }

      enhancedItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: finalPrice,
        stockItemsToReserve,
        requiresStockDecrement: (product as any).stockQuantity !== null
      })
    }

    // Create order and chat in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: currentUser.id,
          total,
          paymentMethod: paymentMethod || "VODAFONE_CASH",
          status: "PENDING",
        }
      })

      // Create OrderItems and explicitly attach reserved stock items
      for (const item of enhancedItems) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }
        })

        if (item.stockItemsToReserve.length > 0) {
          // Lock the stock items so they can't be purchased by anyone else
          await tx.stockItem.updateMany({
            where: { id: { in: item.stockItemsToReserve } },
            data: { isUsed: true, orderItemId: orderItem.id }
          })
        }

        // Decrement the physical stock count if it has a limit set
        if (item.requiresStockDecrement) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } } as any
          })
        }
      }

      // Try to find the site owner if no specific seller is found for the products
      let finalSellerId = firstSellerId
      if (!finalSellerId) {
        const owner = await tx.user.findFirst({ where: { role: "OWNER" } })
        if (owner) finalSellerId = owner.id
      }

      const chat = await tx.chat.create({
        data: {
          type: "ORDER",
          orderId: order.id,
          buyerId: currentUser.id,
          sellerId: finalSellerId,
        }
      })

      // Initial message in the chat
      await tx.message.create({
        data: {
          chatId: chat.id,
          senderId: currentUser.id,
          content: `Hello, I just placed order #${order.id}.`
        }
      })

      return { order, chat }
    })

    const methodStr = paymentMethod || "VODAFONE_CASH"
    let redirectUrl = `/order-confirmation/${result.order.id}`

    // Redirect local manual payments to the proof upload page
    if (["VODAFONE_CASH", "VODAFONE", "INSTAPAY", "PAYPAL"].includes(methodStr.toUpperCase())) {
      redirectUrl = `/checkout/payment/${result.order.id}`
    }
    return NextResponse.json({ url: redirectUrl })
  } catch (error: any) {
    console.error("Checkout error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
