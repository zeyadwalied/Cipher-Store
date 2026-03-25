import { unstable_cache } from "next/cache"
import prisma from "./prisma"

/**
 * Data Access Layer (DAL) for cached database queries.
 * Uses Next.js unstable_cache to store results and revalidate on demand.
 */

// ─── Product select shape (reusable) ───
const productSelectForList = {
    id: true,
    name: true,
    slug: true,
    price: true,
    image: true,
    stockQuantity: true,
    categoryId: true,
    deliveryType: true,
    description: true
} as const

/**
 * Fetch and cache all categories (lightweight — NO base64 images).
 * Images are excluded from cache because categories store base64 data
 * that easily blows past the 2MB cache limit.
 * Tag: 'categories'
 */
export const getCachedCategoriesLight = unstable_cache(
    async () => {
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                parentId: true,
                // imageUrl and backgroundImageUrl are EXCLUDED to stay under 2MB
                children: {
                    orderBy: [
                        { sortOrder: 'asc' },
                        { createdAt: 'desc' }
                    ],
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        products: {
                            take: 12,
                            orderBy: { createdAt: 'desc' },
                            select: productSelectForList
                        }
                    }
                },
                products: {
                    take: 12,
                    orderBy: { createdAt: 'desc' },
                    select: productSelectForList
                }
            },
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'desc' }
            ]
        })

        // Truncate descriptions for display
        return categories.map(cat => ({
            ...cat,
            description: cat.description ? cat.description.substring(0, 200) : null,
            products: cat.products.map(p => ({
                ...p,
                description: p.description ? p.description.substring(0, 160) : ""
            })),
            children: cat.children.map(child => ({
                ...child,
                description: child.description ? child.description.substring(0, 200) : null,
                products: child.products.map(p => ({
                    ...p,
                    description: p.description ? p.description.substring(0, 160) : ""
                }))
            }))
        }))
    },
    ['categories-light'],
    { tags: ['categories', 'products'] }
)

/**
 * Fetch category images separately (NOT cached, because they're base64 blobs).
 * Returns a Map of categoryId -> { imageUrl, backgroundImageUrl }
 */
export async function getCategoryImages(): Promise<Map<string, { imageUrl: string | null, backgroundImageUrl: string | null }>> {
    const cats = await prisma.category.findMany({
        select: { id: true, imageUrl: true, backgroundImageUrl: true }
    })
    const map = new Map<string, { imageUrl: string | null, backgroundImageUrl: string | null }>()
    for (const c of cats) {
        map.set(c.id, { imageUrl: c.imageUrl, backgroundImageUrl: c.backgroundImageUrl })
    }
    return map
}

/**
 * Full categories data: merges cached lightweight data + fresh images.
 * This is the main function to call from pages.
 */
export async function getCachedCategories() {
    const [categories, imageMap] = await Promise.all([
        getCachedCategoriesLight(),
        getCategoryImages()
    ])

    // Merge images back into the cached structure
    return categories.map(cat => {
        const imgs = imageMap.get(cat.id)
        return {
            ...cat,
            imageUrl: imgs?.imageUrl ?? null,
            backgroundImageUrl: imgs?.backgroundImageUrl ?? null,
            children: cat.children.map(child => {
                const childImgs = imageMap.get(child.id)
                return {
                    ...child,
                    imageUrl: childImgs?.imageUrl ?? null,
                    backgroundImageUrl: childImgs?.backgroundImageUrl ?? null,
                }
            })
        }
    })
}

/**
 * Fetch and cache a single product by ID or Slug.
 * Tag: `product-${id}`
 */
export const getCachedProduct = (idOrSlug: string) => unstable_cache(
    async () => {
        return await prisma.product.findFirst({
            where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                image: true,
                categoryId: true,
                stockQuantity: true,
                deliveryType: true,
                createdAt: true,
                updatedAt: true,
                reviews: {
                    include: { user: { select: { name: true, image: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
    },
    [`product-${idOrSlug}`],
    { tags: ['products', `product-${idOrSlug}`] }
)()

/**
 * Fetch and cache active discounts.
 * Tag: 'discounts'
 */
export const getCachedDiscounts = unstable_cache(
    async () => {
        return await (prisma as any).discount.findMany({ where: { isActive: true } })
    },
    ['active-discounts'],
    { tags: ['discounts'] }
)

/**
 * Fetch and cache latest high-rated reviews.
 * Tag: 'reviews'
 */
export const getCachedLatestReviews = unstable_cache(
    async () => {
        return await prisma.review.findMany({
            where: { rating: { gte: 4 } },
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
            take: 3
        })
    },
    ['latest-reviews'],
    { tags: ['reviews'] }
)

/**
 * Fetch actual available stock for automatic delivery products.
 */
export const getProductStockCount = async (productId: string) => {
    return await prisma.stockItem.count({
        where: { productId, isUsed: false }
    })
}
