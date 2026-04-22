import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { revalidateTag } from "next/cache"

export const dynamic = "force-dynamic"

import { getVerifiedUser } from "@/lib/admin-check"

export async function GET() {
  const requester = await getVerifiedUser(['DEV', 'OWNER', 'MANAGER'])
  if (!requester) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const discounts = await (prisma as any).discount.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(discounts)
  } catch (error) {
    console.error("Failed to fetch discounts:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(req: Request) {
  const requester = await getVerifiedUser(['DEV', 'OWNER', 'MANAGER'])
  if (!requester) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const data = await req.json()
    const {
      name, type, value, isPercentage,
      targetProductId, targetCategoryId,
      excludedProductIds, excludedCategoryIds,
      mixedConditionType, mixedProductId, mixedCategoryId
    } = data

    if (!name || !type || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const discount = await (prisma as any).discount.create({
      data: {
        name,
        type,
        value: Number(value),
        isPercentage: Boolean(isPercentage),
        targetProductId: targetProductId || null,
        targetCategoryId: targetCategoryId || null,
        excludedProductIds: excludedProductIds ? JSON.stringify(excludedProductIds) : null,
        excludedCategoryIds: excludedCategoryIds ? JSON.stringify(excludedCategoryIds) : null,
        mixedConditionType: mixedConditionType || null,
        mixedProductId: mixedProductId || null,
        mixedCategoryId: mixedCategoryId || null
      }
    })

    revalidateTag('discounts', 'max')
    revalidateTag('products', 'max')
    return NextResponse.json(discount)
  } catch (error) {
    console.error("Failed to create discount:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
