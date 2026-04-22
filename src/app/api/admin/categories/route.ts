import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidateTag } from "next/cache"

export const dynamic = "force-dynamic"

import { getVerifiedUser } from "@/lib/admin-check"

async function isAdmin() {
  return await getVerifiedUser(["DEV", "OWNER", "MANAGER"])
}

export async function GET() {
  if (!await isAdmin()) return new NextResponse("Unauthorized", { status: 401 })
  const categories = await prisma.category.findMany({
    include: {
      parent: { select: { name: true } },
      children: true
    },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' }
    ]
  })
  return NextResponse.json(categories)
}

const generateSlug = (name: string) => {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-\u0600-\u06FF]/g, '').replace(/\-\-+/g, '-')
}

export async function POST(req: Request) {
  if (!await isAdmin()) return new NextResponse("Unauthorized", { status: 401 })
  try {
    const { name, description, imageUrl, backgroundImageUrl, parentId, isAutomaticOnly } = await req.json()
    const slug = generateSlug(name)
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        backgroundImageUrl,
        parentId: parentId || null,
        isAutomaticOnly: !!isAutomaticOnly
      }
    })
    revalidateTag('categories', 'max')

    // Discord log removed

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category or slug already exists" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  if (!await isAdmin()) return new NextResponse("Unauthorized", { status: 401 })
  try {
    const { id, name, description, imageUrl, backgroundImageUrl, parentId, isAutomaticOnly } = await req.json()
    if (!id) return new NextResponse("Missing ID", { status: 400 })

    const slug = generateSlug(name)
    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        imageUrl,
        backgroundImageUrl,
        parentId: parentId || null,
        isAutomaticOnly: !!isAutomaticOnly
      }
    })
    revalidateTag('categories', 'max')
    revalidateTag('products', 'max')

    // Discord log removed

    return NextResponse.json(category, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category or slug already exists" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!await isAdmin()) return new NextResponse("Unauthorized", { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return new NextResponse("Missing ID", { status: 400 })

    await prisma.category.delete({ where: { id } })
    revalidateTag('categories', 'max')
    revalidateTag('products', 'max')

    // Discord log removed

    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
