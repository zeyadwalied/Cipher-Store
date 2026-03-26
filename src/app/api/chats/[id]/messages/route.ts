import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { triggerBotSync } from "@/lib/bot-sync"

const isPrivilegedStaff = (role: string) =>
  role === "DEV" || role === "OWNER" || role === "MANAGER"

const isChatParticipant = (chat: { buyerId: string | null; sellerId: string | null; assignedToId: string | null }, userId: string) =>
  chat.buyerId === userId || chat.sellerId === userId || chat.assignedToId === userId

const canReadChat = (
  chat: { type: string; status: string; buyerId: string | null; sellerId: string | null; assignedToId: string | null },
  userId: string,
  role: string
) => {
  if (isPrivilegedStaff(role)) return true

  const isParticipant = isChatParticipant(chat, userId)
  if (isParticipant) return true

  if (!chat.status.startsWith("CLOSED_") && role === "SUPPORT" && chat.type === "SUPPORT") {
    return true
  }

  return false
}

const canWriteChat = (
  chat: { buyerId: string | null; sellerId: string | null; assignedToId: string | null },
  userId: string,
  role: string
) => {
  if (isPrivilegedStaff(role)) return true
  return isChatParticipant(chat, userId)
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await params

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, role: true } },
        seller: { select: { id: true, name: true, role: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
        order: { select: { id: true, status: true, confirmationSource: true, confirmedByName: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, name: true, role: true, image: true } } }
        }
      }
    })

    if (!chat) return new NextResponse("Not Found", { status: 404 })

    if (!canReadChat(chat, session.user.id, session.user.role)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Get messages error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await params
    const { content } = await req.json()

    if (!content) return new NextResponse("Content is required", { status: 400 })

    const chat = await prisma.chat.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        status: true,
        buyerId: true,
        sellerId: true,
        assignedToId: true
      }
    })

    if (!chat) return new NextResponse("Not Found", { status: 404 })

    if (chat.status.startsWith("CLOSED_")) {
      return new NextResponse("Forbidden - Ticket is closed", { status: 403 })
    }

    if (!canWriteChat(chat, session.user.id, session.user.role)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        chatId: id,
        senderId: session.user.id,
        content
      },
      include: { sender: { select: { id: true, name: true, role: true, image: true } } }
    })

    try {
      const { sendDiscordLog } = await import("@/lib/discord")
      const participantInfo = chat.buyerId === session.user.id ? "User Message" : "Staff Response"
      await sendDiscordLog("chat", {
        title: `New ${participantInfo} in Chat #${id}`,
        color: chat.buyerId === session.user.id ? 0x00f5ff : 0xa855f7,
        fields: [
          { name: "Sender", value: session.user?.email || "Unknown", inline: true },
          { name: "Role", value: session.user?.role || "USER", inline: true },
          { name: "Message", value: content, inline: false }
        ]
      })
    } catch {}

    await prisma.chat.update({
      where: { id },
      data: { updatedAt: new Date() }
    })

    await triggerBotSync()

    return NextResponse.json(message)
  } catch (error) {
    console.error("Post message error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
