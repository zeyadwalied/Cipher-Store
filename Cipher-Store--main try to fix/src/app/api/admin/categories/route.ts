import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidateTag } from "next/cache"

export const dynamic = "force-dynamic"

import { getVerifiedUser } from "@/lib/admin-check"

async function isAdmin() {
  return await getVerifiedUser(["OWNER", "MANAGER"])
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

    try {
      const { sendDiscordLog } = await import("@/lib/discord");
      const session = await auth();
      await sendDiscordLog("products", {
        title: "🟢 New Category Created",
        color: 0x22c55e, // Green
        fields: [
          { name: "Name", value: name, inline: true },
          { name: "Slug", value: slug, inline: true },
          { name: "Admin", value: session?.user?.email || "Unknown", inline: true }
        ]
      })
    } catch (e) { }

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

    try {
      const { sendDiscordLog } = await import("@/lib/discord");
      const session = await auth();
      await sendDiscordLog("products", {
        title: "🔵 Category Updated",
        color: 0x3b82f6, // Blue
        fields: [
          { name: "Name", value: name, inline: true },
          { name: "Admin", value: session?.user?.email || "Unknown", inline: true }
        ]
      })
    } catch (e) { }

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

    try {
      const { sendDiscordLog } = await import("@/lib/discord");
      const session = await auth();
      await sendDiscordLog("products", {
        title: "🔴 Category Deleted",
        color: 0xef4444, // Red
        fields: [
          { name: "Category ID", value: id, inline: true },
          { name: "Admin", value: session?.user?.email || "Unknown", inline: true }
        ]
      })
    } catch (e) { }

    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
