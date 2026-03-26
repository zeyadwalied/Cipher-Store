import { MetadataRoute } from 'next'
import prisma from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cipherstore.online'

    // Fetch all categories
    const categories = await prisma.category.findMany({
        select: { id: true, slug: true, updatedAt: true }
    })

    // Fetch all products
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

    return [...staticEntries, ...categoryEntries, ...productEntries]
}
