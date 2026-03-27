import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { sendDiscordLog } from "@/lib/discord"
import prisma from "@/lib/prisma"
import { getAdminProductsData } from "@/lib/admin-products"

export const dynamic = "force-dynamic"

import { getVerifiedUser } from "@/lib/admin-check"
import { sanitizeName } from "@/lib/sanitize"

// Check allowed roles for product management using DB-level verification
async function getAuth() {
  return await getVerifiedUser(["DEV", "OWNER", "MANAGER", "SELLER"])
}

export async function GET() {
  const user = await getAuth()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { products, categories } = await getAdminProductsData(user.role, user.id)

  return NextResponse.json({ products, categories })
}

const generateSlug = (name: string) => {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-\u0600-\u06FF]/g, '').replace(/\-\-+/g, '-')
}

export async function POST(req: Request) {
  const user = await getAuth()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const { name, description, price, image, categoryId, stockQuantity, deliveryType } = await req.json()

    // Ensure category exists or create a default one
    let targetCategoryId = categoryId
    if (!targetCategoryId) {
      let defaultCat = await prisma.category.findFirst()
      if (!defaultCat) {
        defaultCat = await prisma.category.create({ data: { name: "General", description: "Default category" } })
      }
      targetCategoryId = defaultCat.id
    }

    const sq = stockQuantity === "" || stockQuantity === null ? null : parseInt(stockQuantity)

    const slug = generateSlug(name)
    const product = await prisma.product.create({
      data: {
        name: sanitizeName(name),
        slug,
        description: description ? sanitizeName(description) : "",
        price: parseFloat(price),
        image,
        categoryId: targetCategoryId,
        deliveryType: deliveryType || "MANUAL",
        stockQuantity: sq,
        sellerId: user.id // Assign seller
      } as any
    })

    revalidateTag('products', 'max')
    revalidateTag('categories', 'max') // Home page categorisation might change

    try {
      await sendDiscordLog("products", {
        title: "🟢 New Product Created",
        color: 0x22c55e, // Green
        fields: [
          { name: "Product Name", value: product.name, inline: true },
          { name: "Price", value: `$${product.price}`, inline: true },
          { name: "Admin", value: user.email || "Unknown", inline: true }
        ]
      })
    } catch (e) { }

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error("Create product error:", error?.message, error)
    if (error) {
      try {
        await sendDiscordLog("errors", {
          title: "❌ API Error: /api/admin/products (POST)",
          color: 0xff0000,
          description: error?.message || String(error)
        })
      } catch (e) { }
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const user = await getAuth()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const { id, name, description, price, image, categoryId, stockQuantity, deliveryType } = await req.json()
    if (!id) return new NextResponse("Missing ID", { status: 400 })

    let targetCategoryId = categoryId
    if (!targetCategoryId) {
      let defaultCat = await prisma.category.findFirst()
      if (!defaultCat) {
        defaultCat = await prisma.category.create({ data: { name: "General", description: "Default category" } })
      }
      targetCategoryId = defaultCat.id
    }

    const sq = stockQuantity === "" || stockQuantity === null ? null : parseInt(stockQuantity)

    const existingProduct = await prisma.product.findUnique({ where: { id } })
    if (!existingProduct) return new NextResponse("Not Found", { status: 404 })

    // Check seller permissions
    if (user.role === "SELLER" && existingProduct.sellerId !== user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const slug = generateSlug(name)
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: sanitizeName(name),
        slug,
        description: description ? sanitizeName(description) : "",
        price: parseFloat(price),
        image,
        categoryId: targetCategoryId,
        deliveryType: deliveryType || "MANUAL",
        stockQuantity: sq
      } as any
    })

    revalidateTag('products', 'max')
    revalidateTag(`product-${id}`, 'max')
    revalidateTag('categories', 'max')

    try {
      await sendDiscordLog("products", {
        title: "🔵 Product Updated",
        color: 0x3b82f6, // Blue
        fields: [
          { name: "Product Name", value: product.name, inline: true },
          { name: "Price", value: `$${product.price}`, inline: true },
          { name: "Admin", value: user.email || "Unknown", inline: true }
        ]
      })
    } catch (e) { }

    return NextResponse.json(product, { status: 200 })
  } catch (error: any) {
    console.error("Update product error:", error?.message, error)
    try {
      await sendDiscordLog("errors", {
        title: "❌ API Error: /api/admin/products (PUT)",
        color: 0xff0000,
        description: error?.message || String(error)
      })
    } catch (e) { }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const user = await getAuth()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return new NextResponse("Missing ID", { status: 400 })

    const existingProduct = await prisma.product.findUnique({ where: { id } })
    if (!existingProduct) return new NextResponse("Not Found", { status: 404 })

    if (user.role === "SELLER" && existingProduct.sellerId !== user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Delete related order items to prevent foreign key constraint errors
    await prisma.orderItem.deleteMany({ where: { productId: id } })

    await prisma.product.delete({ where: { id } })
    revalidateTag('products', 'max')
    revalidateTag(`product-${id}`, 'max')
    revalidateTag('categories', 'max')

    try {
      await sendDiscordLog("products", {
        title: "🔴 Product Deleted",
        color: 0xef4444, // Red
        fields: [
          { name: "Product ID", value: id, inline: true },
          { name: "Name", value: existingProduct.name, inline: true },
          { name: "Admin", value: user.email || "Unknown", inline: true }
        ]
      })
    } catch (e) { }

    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
