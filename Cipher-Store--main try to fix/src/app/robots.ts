import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    // Let's assume the production URL is an environment variable or a known absolute URL
    // If not defined, fallback to localhost for development
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cipherstore.online'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/cart/', '/checkout/', '/settings/', '/dashboard/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
