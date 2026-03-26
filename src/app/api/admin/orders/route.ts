import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

import { getVerifiedUser } from "@/lib/admin-check"

export async function DELETE() {
  try {
    const requester = await getVerifiedUser(["DEV", "OWNER", "MANAGER"])
    if (!requester) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Delete related entities first to prevent foreign key constraints
    await prisma.orderItem.deleteMany({})
    await prisma.chat.deleteMany({ where: { orderId: { not: null } } })

    // Finally delete all orders
    await prisma.order.deleteMany({})

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
