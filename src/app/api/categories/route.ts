import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sanitizeImageUrlForList } from "@/lib/image-url"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
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

    return NextResponse.json(
      categories.map((cat) => ({
        ...cat,
        imageUrl: sanitizeImageUrlForList(cat.imageUrl),
        children: cat.children.map((child) => ({
          ...child,
          imageUrl: sanitizeImageUrlForList(child.imageUrl)
        }))
      }))
    )
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
