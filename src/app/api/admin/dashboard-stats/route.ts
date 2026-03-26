import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getVerifiedUser } from "@/lib/admin-check"

export async function GET() {
  try {
    const requester = await getVerifiedUser(["DEV", "SELLER", "MANAGER", "OWNER"])
    if (!requester) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const role = requester.role
    const userId = requester.id

    const stats: Record<string, unknown> = {}

    // OVERALL STATS for MANAGER or OWNER
    if (role === "DEV" || role === "MANAGER" || role === "OWNER") {
      const totalRevenueAgg = await prisma.order.aggregate({
        where: { status: { in: ["PAID", "COMPLETED"] } },
        _sum: { total: true }
      })

      const totalOrders = await prisma.order.count()
      const totalProducts = await prisma.product.count()
      const totalUsers = await prisma.user.count()

      stats.overall = {
        revenue: totalRevenueAgg._sum.total || 0,
        orders: totalOrders,
        products: totalProducts,
        users: totalUsers
      }
    }

    // SELLER SPECIFIC STATS
    // Calculate the revenue generated SPECIFICALLY from products owned by this seller
    const sellerOrderItems = await prisma.orderItem.findMany({
      where: {
        product: { sellerId: userId },
        order: { status: { in: ["PAID", "COMPLETED"] } }
      },
      include: { product: true }
    })

    const sellerRevenue = sellerOrderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

    // Number of unique orders that contained at least one of their products
    const uniqueOrderIds = new Set(sellerOrderItems.map(item => item.orderId))
    const sellerOrdersCount = uniqueOrderIds.size

    const sellerProductsCount = await prisma.product.count({
      where: { sellerId: userId }
    })

    stats.personal = {
      revenue: sellerRevenue,
      orders: sellerOrdersCount,
      products: sellerProductsCount
    }

    // Top Selling Products Context (Last 5)
    const recentSales = await prisma.orderItem.findMany({
      where: {
        product: { sellerId: userId },
      },
      include: { order: true, product: true },
      orderBy: { order: { createdAt: 'desc' } },
      take: 5
    })

    stats.recentSales = recentSales.map(item => ({
      id: item.id,
      productName: item.product.name,
      amount: item.price * item.quantity,
      date: item.order.createdAt,
      status: item.order.status
    }))

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
