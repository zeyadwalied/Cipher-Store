import { unstable_cache } from "next/cache"
import prisma from "@/lib/prisma"

export const getCachedCategoryPageData = (idOrSlug: string) => unstable_cache(
  async () => {
    const decodedIdOrSlug = (() => {
      try {
        return decodeURIComponent(idOrSlug)
      } catch {
        return idOrSlug
      }
    })()

    const lookupValues = Array.from(new Set([idOrSlug, decodedIdOrSlug]))

    const category = await prisma.category.findFirst({
      where: {
        OR: lookupValues.flatMap((value) => [{ id: value }, { slug: value }])
      }
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

    const [products, activeDiscounts, childCategories] = await Promise.all([
      prisma.product.findMany({
        where: {
          categoryId: {
            in: categoryIds
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.discount.findMany({ where: { isActive: true } }),
      prisma.category.findMany({
        where: {
          parentId: category.id
        },
        select: {
          id: true,
          name: true,
          slug: true
        },
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" }
        ]
      })
    ])

    return { category, products, activeDiscounts, childCategories }
  },
  [`category-page-${idOrSlug}`],
  { tags: ["categories", "products", "discounts", `category-${idOrSlug}`] }
)()
