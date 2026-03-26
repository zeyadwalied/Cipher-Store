import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { triggerBotSync } from "@/lib/bot-sync"
import { getOrCreateOngoingSupportChat } from "@/lib/support-chat"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { chatId, created } = await getOrCreateOngoingSupportChat({
      buyerId: session.user.id,
    })

    const chat = await prisma.chat.findUnique({
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

    if (!chat) {
      return new NextResponse("Not Found", { status: 404 })
    }

    if (created) {
      try {
        const { sendDiscordLog } = await import("@/lib/discord")
        await sendDiscordLog("support", {
          title: "New Support Request",
          color: 0xff0055,
          fields: [
            { name: "Customer", value: chat.buyer?.email || session.user.email || "Unknown", inline: true },
            { name: "Chat ID", value: chat.id, inline: true },
          ],
        })
      } catch {}

      await triggerBotSync()
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Support chat error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
