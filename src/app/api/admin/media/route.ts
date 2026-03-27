import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { optimizeImageBufferToDataUrl } from "@/lib/image-optimizer"

export const dynamic = "force-dynamic"

// Since Vercel has a read-only filesystem, we store images as Base64 data URLs.
// New uploads are optimized first to reduce payload size.

// GET - list all uploaded images (stored in products as image field)
export async function GET() {
  try {
    const session = await auth()
    if (!session || !["OWNER", "MANAGER", "SELLER"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const products = await prisma.product.findMany({
      where: { image: { not: null } },
      select: { id: true, name: true, image: true },
      orderBy: { updatedAt: "desc" }
    })

    const images = products
      .filter((p): p is { id: string; name: string; image: string } => typeof p.image === "string")
      .map((p) => ({
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

// POST - upload a new image (auto-optimizes to WebP/AVIF then stores as data URL)
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

    if (!file.type.startsWith("image/")) {
      return new NextResponse("Only image files allowed", { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return new NextResponse("File too large (max 20MB)", { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const optimized = await optimizeImageBufferToDataUrl(buffer)

    return NextResponse.json(
      { url: optimized.dataUrl, name: file.name, mimeType: optimized.mimeType, bytes: optimized.bytes },
      { status: 201 }
    )
  } catch (error) {
    console.error("Media upload error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// DELETE - no-op since we no longer store files on disk
export async function DELETE() {
  return new NextResponse("OK", { status: 200 })
}
