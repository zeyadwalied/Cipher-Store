import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Since Vercel has a read-only filesystem, we store images as Base64 data URLs
// in a simple "Media" approach using the existing product image field or as standalone entries.

// GET — list all uploaded images (stored in products as image field)
export async function GET() {
  try {
    const session = await auth()
    if (!session || !["OWNER", "MANAGER", "SELLER"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get all products that have images
    const products = await prisma.product.findMany({
      where: { image: { not: null } },
      select: { id: true, name: true, image: true },
      orderBy: { updatedAt: "desc" }
    })

    const images = products
      .filter((p: any) => p.image)
      .map((p: any) => ({
        name: p.name,
        url: p.image,
        productId: p.id,
      }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Media GET error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST — upload a new image (converts to Base64 data URL)
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !["OWNER", "MANAGER", "SELLER"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      return new NextResponse("Only image files allowed", { status: 400 })
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return new NextResponse("File too large (max 20MB)", { status: 400 })
    }

    // Convert to Base64 data URL (no filesystem needed)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({ url: dataUrl, name: file.name }, { status: 201 })
  } catch (error) {
    console.error("Media upload error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// DELETE — no-op since we no longer store files on disk
export async function DELETE() {
  return new NextResponse("OK", { status: 200 })
}
