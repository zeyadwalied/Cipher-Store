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

    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        parentId: true
      }
    })

    const descendantIds: string[] = []
    const queue = [category.id]

    while (queue.length > 0) {
      const currentId = queue.shift()
      if (!currentId) continue

      const childIds = allCategories
        .filter((item) => item.parentId === currentId)
        .map((item) => item.id)

      descendantIds.push(...childIds)
      queue.push(...childIds)
    }

    const categoryIds = [category.id, ...descendantIds]

    const [products, activeDiscounts] = await Promise.all([
      prisma.product.findMany({
        where: {
          categoryId: {
            in: categoryIds
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.discount.findMany({ where: { isActive: true } })
    ])

    return { category, products, activeDiscounts }
  },
  [`category-page-${idOrSlug}`],
  { tags: ["categories", "products", "discounts", `category-${idOrSlug}`] }
)()
