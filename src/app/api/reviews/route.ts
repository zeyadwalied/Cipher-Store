import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// GET /api/reviews
// - ?productId=xxx -> reviews for a specific product
// - ?eligible=true -> products the logged-in user can still review
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const eligibleOnly = searchParams.get("eligible") === "true"

    if (eligibleOnly) {
      const session = await auth()
      const userId = session?.user?.id
      if (!userId) return new NextResponse("Unauthorized", { status: 401 })

      const [completedItems, reviewedProducts] = await Promise.all([
        prisma.orderItem.findMany({
          where: {
            order: {
              userId,
              status: "COMPLETED"
            }
          },
          select: {
            productId: true,
            product: { select: { id: true, name: true } }
          }
        }),
        prisma.review.findMany({
          where: { userId },
          select: { productId: true }
        })
      ])

      const reviewedIds = new Set(reviewedProducts.map((r) => r.productId))
      const seen = new Set<string>()

      const eligibleProducts = completedItems
        .map((item) => item.product)
        .filter((product) => {
          if (!product) return false
          if (reviewedIds.has(product.id)) return false
          if (seen.has(product.id)) return false
          seen.add(product.id)
          return true
        })

      return NextResponse.json(eligibleProducts)
    }

    const productId = searchParams.get("productId") || undefined
    const includeProduct = searchParams.get("includeProduct") === "true"

    const rawLimit = Number(searchParams.get("limit") ?? "10")
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), 30)
      : 10

    const rawMinRating = Number(searchParams.get("minRating") ?? "")
    const minRating = Number.isFinite(rawMinRating)
      ? Math.min(Math.max(Math.trunc(rawMinRating), 1), 5)
      : undefined

    const whereClause: {
      productId?: string
      rating?: { gte: number }
    } = {}

    if (productId) whereClause.productId = productId
    if (typeof minRating === "number") whereClause.rating = { gte: minRating }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: includeProduct
        ? {
            user: { select: { name: true, image: true } },
            product: { select: { id: true, name: true } }
          }
        : {
            user: { select: { name: true, image: true } }
          },
      orderBy: { createdAt: "desc" },
      take: limit
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error("Fetch reviews error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// POST /api/reviews
export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return new NextResponse("Unauthorized", { status: 401 })

    const body = await req.json()
    const productId = typeof body?.productId === "string" ? body.productId : ""
    const rating = Number(body?.rating)
    const comment = typeof body?.comment === "string" ? body.comment.trim() : ""

    if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return new NextResponse("Invalid input", { status: 400 })
    }

    if (comment.length > 1200) {
      return new NextResponse("Comment is too long (max 1200 chars).", { status: 400 })
    }

    // User can review only purchased + completed products
    const hasBought = await prisma.order.findFirst({
      where: {
        userId,
        status: "COMPLETED",
        items: {
          some: { productId }
        }
      },
      select: { id: true }
    })

    if (!hasBought) {
      return new NextResponse("You can only review products you have purchased and completed.", { status: 403 })
    }

    const existingReview = await prisma.review.findFirst({
      where: { userId, productId },
      select: { id: true }
    })

    if (existingReview) {
      return new NextResponse("You have already reviewed this product.", { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        comment: comment || null
      },
      include: {
        user: { select: { name: true, image: true, email: true } },
        product: { select: { id: true, name: true } }
      }
    })

    revalidateTag("reviews", "max")
    revalidateTag(`product-${productId}`, "max")

    // Discord logging removed

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error("Post review error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
