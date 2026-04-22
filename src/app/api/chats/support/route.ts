import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { getOrCreateOngoingSupportChat } from "@/lib/support-chat"

export const dynamic = "force-dynamic"

async function loadSupportChat(chatId: string) {
  return prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, role: true } } },
      },
      seller: { select: { name: true } },
      buyer: { select: { name: true, email: true } },
    },
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { chatId, created } = await getOrCreateOngoingSupportChat({
      buyerId: session.user.id,
    })

    const chat = await loadSupportChat(chatId)

    if (!chat) {
      return new NextResponse("Not Found", { status: 404 })
    }

    if (created) {
      // Discord logging and bot sync removed
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Support chat error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const initialMessage = typeof body?.initialMessage === "string" ? body.initialMessage.trim() : ""

    const { chatId, created } = await getOrCreateOngoingSupportChat({
      buyerId: session.user.id,
      initialMessage: initialMessage
        ? {
            senderId: session.user.id,
            content: initialMessage,
          }
        : undefined,
    })

    const chat = await loadSupportChat(chatId)

    if (!chat) {
      return new NextResponse("Not Found", { status: 404 })
    }

    if (created || initialMessage) {
      // Discord actions removed
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Support chat post error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
