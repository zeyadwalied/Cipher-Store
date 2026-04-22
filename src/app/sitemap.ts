import { MetadataRoute } from 'next'
import prisma from "@/lib/prisma"
import { getSiteUrl } from "@/lib/site-url"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getSiteUrl()

    const staticEntries: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/support`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/register`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        }
    ]

    // Wrap DB calls in try-catch so build doesn't crash if DB is unreachable
    try {
        const categories = await prisma.category.findMany({
            select: { id: true, slug: true, updatedAt: true }
        })
        const products = await prisma.product.findMany({
            select: { id: true, slug: true, updatedAt: true }
        })

        const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
            url: `${baseUrl}/category/${cat.slug || cat.id}`,
            lastModified: cat.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.8,
        }))
        const productEntries: MetadataRoute.Sitemap = products.map((prod) => ({
            url: `${baseUrl}/product/${prod.slug || prod.id}`,
            lastModified: prod.updatedAt,
            changeFrequency: 'daily',
            priority: 0.9,
        }))

        return [...staticEntries, ...categoryEntries, ...productEntries]
    } catch {
        // DB unreachable at build time — return static entries only
        return staticEntries
    }
}
