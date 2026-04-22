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

    // Discord log removed

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

      // Discord log removed

      return new NextResponse("All deleted", { status: 200 })
    }

    if (stockId === "all_unused") {
      await prisma.stockItem.deleteMany({
        where: { productId: id, isUsed: false }
      })

      // Discord log removed

      return new NextResponse("All unused deleted", { status: 200 })
    }

    // Handle single deletion (allow used items as well)
    await prisma.stockItem.delete({
      where: { id: stockId, productId: id }
    })

    // Discord log removed

    return new NextResponse("Deleted successfully", { status: 200 })
  } catch (error) {
    console.error("Delete stock error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
