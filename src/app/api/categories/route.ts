import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sanitizeImageUrlForNav } from "@/lib/image-url"
import { unstable_cache } from "next/cache"

const getCachedNavCategories = unstable_cache(
  async () => {
    return await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        imageUrl: true,
        children: { select: { id: true, name: true, slug: true, imageUrl: true } }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })
  },
  ['navbar-categories'],
  { tags: ['categories'] }
)

export async function GET() {
  try {
    const categories = await getCachedNavCategories();

    return NextResponse.json(
      categories.map((cat) => ({
        ...cat,
        imageUrl: sanitizeImageUrlForNav(cat.imageUrl),
        children: cat.children.map((child) => ({
          ...child,
          imageUrl: sanitizeImageUrlForNav(child.imageUrl)
        }))
      }))
    )
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
