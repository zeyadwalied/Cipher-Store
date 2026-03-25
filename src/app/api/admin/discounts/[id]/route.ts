import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidateTag } from "next/cache"

export const dynamic = "force-dynamic"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || !['OWNER', 'MANAGER'].includes(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    await (prisma as any).discount.delete({ where: { id } })
    revalidateTag('discounts', 'max')
    revalidateTag('products', 'max')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete discount:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || !['OWNER', 'MANAGER'].includes(session.user.role)) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const data = await req.json()

    const updateData: any = { ...data }

    if (data.value !== undefined) {
      updateData.value = Number(data.value)
    }
    if (data.excludedProductIds !== undefined) {
      updateData.excludedProductIds = data.excludedProductIds ? JSON.stringify(data.excludedProductIds) : null
    }
    if (data.excludedCategoryIds !== undefined) {
      updateData.excludedCategoryIds = data.excludedCategoryIds ? JSON.stringify(data.excludedCategoryIds) : null
    }

    const discount = await (prisma as any).discount.update({
      where: { id },
      data: updateData
    })
    revalidateTag('discounts', 'max')
    revalidateTag('products', 'max')
    return NextResponse.json(discount)
  } catch (error) {
    console.error("Failed to update discount:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
