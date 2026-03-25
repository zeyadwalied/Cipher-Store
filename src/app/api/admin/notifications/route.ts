import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

// Returns count of PENDING orders and recent ones for the bell notification
export async function GET() {
  try {
    const session = await auth()
    if (!session || !["OWNER", "MANAGER"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const pending = await prisma.order.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        items: { 
          take: 1,
          include: { product: { select: { name: true } } }
        }
      }
    })

    return NextResponse.json({ count: pending.length, orders: pending })
  } catch (error) {
    console.error("Notifications error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
