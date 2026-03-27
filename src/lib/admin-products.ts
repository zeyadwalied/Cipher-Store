import prisma from "@/lib/prisma"

export async function getAdminProductsData(role: string, userId: string) {
  const where = role === "SELLER" ? { sellerId: userId } : {}

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.category.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" }
      ]
    })
  ])

  return { products, categories }
}
