import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// Get reviews for a specific product
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10

    let whereClause = {}
    if (productId) {
      whereClause = { productId }
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, image: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error("Fetch reviews error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Post a new review
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { productId, rating, comment } = await req.json()

    if (!productId || !rating || rating < 1 || rating > 5) {
      return new NextResponse("Invalid input", { status: 400 })
    }

    // Verify user actually bought this product and the order is COMPLETED
    const hasBought = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        items: {
          some: { productId }
        }
      }
    })

    if (!hasBought) {
      return new NextResponse("You can only review products you have purchased and completed.", { status: 403 })
    }

    // Check if user already reviewed
    const existingReview = await prisma.review.findFirst({
      where: { userId: session.user.id, productId }
    })

    if (existingReview) {
      return new NextResponse("You have already reviewed this product.", { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        comment
      },
      include: {
        user: { select: { name: true, image: true, email: true } },
        product: { select: { name: true } }
      }
    })

    try {
      const { sendDiscordLog } = await import("@/lib/discord");
      await sendDiscordLog("reviews", {
        title: `🟢 New Review: ${review.product.name}`,
        color: 0x22c55e, // Green
        fields: [
          { name: "User", value: review.user?.email || review.user?.name || "Unknown", inline: true },
          { name: "Rating", value: "⭐".repeat(review.rating), inline: true },
          { name: "Comment", value: comment || "No comment provided", inline: false }
        ]
      })
    } catch (e) { }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error("Post review error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
