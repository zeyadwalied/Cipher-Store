import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

import { getVerifiedUser } from "@/lib/admin-check"

export async function PUT(
  req: Request
) {
  try {
    const requester = await getVerifiedUser(["DEV", "OWNER", "SUPPORT", "MANAGER"])
    if (!requester) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id, type, assignedToId } = await req.json()
    const chatId = id

    await prisma.chat.update({
      where: { id: chatId },
      data: { 
        type: type || undefined,
        assignedToId: assignedToId || null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
