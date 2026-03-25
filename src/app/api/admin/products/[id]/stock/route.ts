import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// Ensure user has permission to manage this product's stock
async function verifyPermission(productId: string, session: any) {
  if (!session?.user) return false
  const role = session.user.role
  if (role === "OWNER" || role === "MANAGER") return true // Admins bypass

  if (role === "SELLER") {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    return product?.sellerId === session.user.id
  }
  return false
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    const hasPermission = await verifyPermission(id, session)
    if (!hasPermission) return new NextResponse("Unauthorized", { status: 401 })

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, deliveryType: true, sellerId: true }
    })

    if (!product) return new NextResponse("Product not found", { status: 404 })

    const stock = await prisma.stockItem.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ product, stock })
  } catch (error) {
    console.error("Fetch stock error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    const hasPermission = await verifyPermission(id, session)
    if (!hasPermission) return new NextResponse("Unauthorized", { status: 401 })

    const { data } = await req.json()
    if (!data) return new NextResponse("Data required", { status: 400 })

    const newStock = await prisma.stockItem.create({
      data: {
        productId: id,
        data: data
      }
    })

    try {
      const { sendDiscordLog } = await import("@/lib/discord");
      const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
      await sendDiscordLog("products", {
        title: "🟢 New Code Added",
        color: 0x22c55e, // Green
        fields: [
          { name: "Product", value: product?.name || id, inline: true },
          { name: "Code Snippet", value: data.substring(0, 50) + (data.length > 50 ? "..." : ""), inline: false },
          { name: "Admin", value: session?.user?.email || "Unknown", inline: true }
        ]
      })
    } catch (e) { }

    return NextResponse.json(newStock)
  } catch (error) {
    console.error("Add stock error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    const hasPermission = await verifyPermission(id, session)
    if (!hasPermission) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(req.url)
    const stockId = searchParams.get("stockId")
    if (!stockId) return new NextResponse("Stock ID required", { status: 400 })

    // Handle bulk deletion
    if (stockId === "all") {
      await prisma.stockItem.deleteMany({
        where: { productId: id }
      })

      try {
        const { sendDiscordLog } = await import("@/lib/discord");
        const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
        await sendDiscordLog("products", {
          title: "🔴 ALL Codes Deleted",
          color: 0xef4444, // Red
          fields: [
            { name: "Product", value: product?.name || id, inline: true },
            { name: "Action", value: "Bulk Delete ALL", inline: true },
            { name: "Admin", value: session?.user?.email || "Unknown", inline: true }
          ]
        })
      } catch (e) { }

      return new NextResponse("All deleted", { status: 200 })
    }

    if (stockId === "all_unused") {
      await prisma.stockItem.deleteMany({
        where: { productId: id, isUsed: false }
      })

      try {
        const { sendDiscordLog } = await import("@/lib/discord");
        const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
        await sendDiscordLog("products", {
          title: "🔴 ALL Unused Codes Deleted",
          color: 0xef4444, // Red
          fields: [
            { name: "Product", value: product?.name || id, inline: true },
            { name: "Action", value: "Bulk Delete Unused", inline: true },
            { name: "Admin", value: session?.user?.email || "Unknown", inline: true }
          ]
        })
      } catch (e) { }

      return new NextResponse("All unused deleted", { status: 200 })
    }

    // Handle single deletion (allow used items as well)
    await prisma.stockItem.delete({
      where: { id: stockId, productId: id }
    })

    try {
      const { sendDiscordLog } = await import("@/lib/discord");
      const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
      await sendDiscordLog("products", {
        title: "🔴 Code Deleted",
        color: 0xef4444, // Red
        fields: [
          { name: "Product", value: product?.name || id, inline: true },
          { name: "Stock ID", value: stockId, inline: true },
          { name: "Admin", value: session?.user?.email || "Unknown", inline: true }
        ]
      })
    } catch (e) { }

    return new NextResponse("Deleted successfully", { status: 200 })
  } catch (error) {
    console.error("Delete stock error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
