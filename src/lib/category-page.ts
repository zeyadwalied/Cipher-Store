import { unstable_cache } from "next/cache"
import prisma from "@/lib/prisma"

export const getCachedCategoryPageData = (idOrSlug: string) => unstable_cache(
  async () => {
    const category = await prisma.category.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
    })

    if (!category) {
      return null
    }

    const [products, activeDiscounts] = await Promise.all([
      prisma.product.findMany({
        where: { categoryId: category.id },
        orderBy: { createdAt: "desc" }
      }),
      (prisma as any).discount.findMany({ where: { isActive: true } })
    ])

    return { category, products, activeDiscounts }
  },
  [`category-page-${idOrSlug}`],
  { tags: ["categories", "products", "discounts", `category-${idOrSlug}`] }
)()
