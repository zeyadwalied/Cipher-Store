import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !["OWNER", "MANAGER"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params

    // Delete related entities first to prevent foreign key constraints
    await prisma.orderItem.deleteMany({ where: { orderId: id } })
    await prisma.chat.deleteMany({ where: { orderId: id } })
    
    // Finally delete the order
    await prisma.order.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Delete order error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
