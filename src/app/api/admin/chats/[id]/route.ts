import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !["OWNER", "MANAGER"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params

    // Soft delete chat so the Discord bot can pick it up and delete the channel
    await prisma.chat.update({
      where: { id },
      data: { status: 'DELETED' }
    })

    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    console.error("Delete chat error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
