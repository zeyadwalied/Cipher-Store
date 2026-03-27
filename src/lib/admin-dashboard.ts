import prisma from "@/lib/prisma"

export async function getDashboardStatsForUser(role: string, userId: string) {
  const stats: Record<string, unknown> = {}

  if (role === "DEV" || role === "MANAGER" || role === "OWNER") {
    const [totalRevenueAgg, totalOrders, totalProducts, totalUsers] = await Promise.all([
      prisma.order.aggregate({
        where: { status: { in: ["PAID", "COMPLETED"] } },
        _sum: { total: true }
      }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count()
    ])

    stats.overall = {
      revenue: totalRevenueAgg._sum.total || 0,
      orders: totalOrders,
      products: totalProducts,
      users: totalUsers
    }
  }

  const [sellerOrderItems, sellerProductsCount, recentSales] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        product: { sellerId: userId },
        order: { status: { in: ["PAID", "COMPLETED"] } }
      },
      include: { product: true }
    }),
    prisma.product.count({
      where: { sellerId: userId }
    }),
    prisma.orderItem.findMany({
      where: {
        product: { sellerId: userId },
      },
      include: { order: true, product: true },
      orderBy: { order: { createdAt: "desc" } },
      take: 5
    })
  ])

  const sellerRevenue = sellerOrderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const uniqueOrderIds = new Set(sellerOrderItems.map(item => item.orderId))

  stats.personal = {
    revenue: sellerRevenue,
    orders: uniqueOrderIds.size,
    products: sellerProductsCount
  }

  stats.recentSales = recentSales.map(item => ({
    id: item.id,
    productName: item.product.name,
    amount: item.price * item.quantity,
    date: item.order.createdAt,
    status: item.order.status
  }))

  return stats
}

export async function getMaintenanceModeValue() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "global" } })
  return settings?.isMaintenanceMode || false
}
