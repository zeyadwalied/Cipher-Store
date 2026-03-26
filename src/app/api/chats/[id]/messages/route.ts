import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { triggerBotSync } from "@/lib/bot-sync"


export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, role: true } },
        seller: { select: { id: true, name: true, role: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
        order: { select: { id: true, status: true, confirmationSource: true, confirmedByName: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, role: true, image: true } } }
        }
      }
    })

    if (!chat) return new NextResponse("Not Found", { status: 404 })

    // Verify access – Owners see everything, others only if participants
    const role = session.user.role
    const isParticipant = chat.buyerId === session.user.id || chat.assignedToId === session.user.id
    const isOwnerOrManager = role === "OWNER" || role === "MANAGER"

    if (chat.status.startsWith('CLOSED_')) {
      // If closed, only the buyer or Owner/Manager can see the history
      if (session.user.id !== chat.buyerId && !isOwnerOrManager) {
        return new NextResponse("Forbidden - Ticket Closed", { status: 403 })
      }
    } else if (!isParticipant && !isOwnerOrManager) {
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

    const { id } = await params;
    const { content } = await req.json()

    if (!content) return new NextResponse("Content is required", { status: 400 })

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!chat) return new NextResponse("Not Found", { status: 404 })

    if (chat.status.startsWith('CLOSED_')) {
      return new NextResponse("Forbidden - Ticket is closed", { status: 403 })
    }

    // Verify write-access – ONLY directly assigned staff or the buyer can write
    const isParticipant = chat.buyerId === session.user.id || chat.assignedToId === session.user.id

    if (!isParticipant) {
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
      const { sendDiscordLog } = await import("@/lib/discord");
      const participantInfo = chat.buyerId === session.user.id ? "User Message" : "Staff Response";
      await sendDiscordLog("chat", {
        title: `💬 New ${participantInfo} in Chat #${id}`,
        color: chat.buyerId === session.user.id ? 0x00f5ff : 0xa855f7,
        fields: [
          { name: "Sender", value: session.user?.email || "Unknown", inline: true },
          { name: "Role", value: session.user?.role || "USER", inline: true },
          { name: "Message", value: content, inline: false }
        ]
      })
    } catch (e) { }

    await prisma.chat.update({
      where: { id },
      data: { updatedAt: new Date() }
    })

    // Wake up Discord Bot instantly
    await triggerBotSync();

    return NextResponse.json(message)
  } catch (error) {
    console.error("Post message error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
