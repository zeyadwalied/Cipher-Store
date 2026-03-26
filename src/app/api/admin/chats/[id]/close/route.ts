import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { triggerBotSync } from "@/lib/bot-sync"

export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !["OWNER", "MANAGER"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params

    const chat = await prisma.chat.update({
      where: { id },
      data: { status: 'CLOSED_BY_WEB' }
    })

    await triggerBotSync();

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Close chat error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
