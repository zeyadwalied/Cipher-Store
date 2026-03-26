import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session || !["OWNER", "MANAGER"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    let whereClause: any = {}
    if (type === "ORDER" || type === "SUPPORT") {
      whereClause.type = type
    }
    whereClause.status = { not: "DELETED" }

    await prisma.chat.updateMany({
      where: whereClause,
      data: { status: 'DELETED' }
    })

    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    console.error("Delete all chats error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
