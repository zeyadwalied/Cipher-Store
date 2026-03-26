import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { isSiteInMaintenanceMode } from "@/lib/maintenance"
import { createOrderTicket } from "@/lib/discord-ticket"
import { calculateDiscount } from "@/lib/discountEngine"
import { sendDiscordLog } from "@/lib/discord"
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

    if (await isSiteInMaintenanceMode() && session.user.role !== "OWNER") {
      return new NextResponse("System under maintenance", { status: 503 })
    }

    const { items, paymentMethod } = await req.json()

    if (!items || items.length === 0) {
      return new NextResponse("Empty cart", { status: 400 })
    }

    // Verify products, verify stock, and calculate total
    let total = 0
    const enhancedItems: { productId: string; quantity: number; price: number; stockItemsToReserve: string[], requiresStockDecrement: boolean }[] = []

    const activeDiscounts = await (prisma as any).discount.findMany({ where: { isActive: true } })

    // We will find the seller ID from the first product to assign to the chat
    let firstSellerId = null

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id }
      })
      if (!product) {
        return new NextResponse(`Product ${item.id} not found`, { status: 400 })
      }
      if (!firstSellerId && product.sellerId) {
        firstSellerId = product.sellerId
      }

      const { finalPrice } = calculateDiscount(product, activeDiscounts)
      total += finalPrice * item.quantity

      let stockItemsToReserve: string[] = []

      // Stock Verification logic -> Check BOTH Automatic and stockQuantity

      // 1. If it's AUTOMATIC, ensure we have enough StockItems
      if (product.deliveryType === "AUTOMATIC") {
        const availableStock = await prisma.stockItem.findMany({
          where: { productId: product.id, isUsed: false },
          take: item.quantity
        })

        if (availableStock.length < item.quantity) {
          return new NextResponse(`Not enough stock for ${product.name}. Only ${availableStock.length} left.`, { status: 400 })
        }

        stockItemsToReserve = availableStock.map(s => s.id)
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
          userId: session.user.id,
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
          buyerId: session.user.id,
          sellerId: finalSellerId,
        }
      })

      // Initial message in the chat
      await tx.message.create({
        data: {
          chatId: chat.id,
          senderId: session.user.id,
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

    // Create Discord ticket channel INSTANTLY via REST API (no bot polling needed!)
    try {
      // Get product names for the embed
      const orderWithItems = await prisma.order.findUnique({
        where: { id: result.order.id },
        include: { items: { include: { product: { select: { name: true } } } } }
      });
      const ticketItems = orderWithItems?.items.map(i => ({
        name: i.product.name,
        quantity: i.quantity
      })) || [];

      const channelId = await createOrderTicket({
        orderId: result.order.id,
        customerName: session.user.name || 'Customer',
        customerEmail: session.user.email || 'Unknown',
        total: result.order.total,
        paymentMethod: paymentMethod || 'VODAFONE_CASH',
        items: ticketItems,
      });

      // Save the channel ID to both Order and Chat so bot can manage it later
      if (channelId) {
        await prisma.order.update({ where: { id: result.order.id }, data: { discordChannelId: channelId } });
        await prisma.chat.update({ where: { id: result.chat.id }, data: { discordChannelId: channelId } });
      }
    } catch (ticketErr) {
      console.error('Discord ticket creation failed (non-blocking):', ticketErr);
    }

    // Log the order to Discord
    try {
      await sendDiscordLog("orders", {
        title: "🛒 New Order Created",
        color: 0x00f5ff, // Cyan
        fields: [
          { name: "Order ID", value: result.order.id, inline: true },
          { name: "Customer", value: session.user.email || "Unknown", inline: true },
          { name: "Amount", value: `$${result.order.total.toFixed(2)}`, inline: true },
          { name: "Method", value: methodStr, inline: true }
        ]
      });

      // Log if a discount was applied
      const wasDiscounted = enhancedItems.some(ei => {
        const originalItem = items.find((i: any) => i.id === ei.productId);
        return originalItem && ei.price < originalItem.price;
      });

      if (wasDiscounted) {
        await sendDiscordLog("discounts", {
          title: "🏷️ Discount Applied in Order",
          color: 0x0ea5e9,
          fields: [
            { name: "Order ID", value: result.order.id, inline: true },
            { name: "Customer", value: session.user.email || "Unknown", inline: true }
          ]
        })
      }
    } catch (err) {
      console.error("Failed to log order to discord", err)
    }

    return NextResponse.json({ url: redirectUrl })
  } catch (error: any) {
    console.error("Checkout error:", error)
    try {
      await sendDiscordLog("errors", {
        title: "❌ API Error: /api/checkout",
        color: 0xff0000,
        description: error.message || String(error)
      })
    } catch (e) { }
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
