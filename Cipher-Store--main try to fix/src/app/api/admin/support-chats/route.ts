import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

import { getVerifiedUser, AdminRole } from "@/lib/admin-check"

async function verifySupportAdmin() {
  return await getVerifiedUser(["OWNER", "MANAGER", "SUPPORT"])
}

export async function GET() {
  const user = await verifySupportAdmin()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const chats = await prisma.chat.findMany({
      where: { type: "SUPPORT" },
      include: {
        buyer: { select: { id: true, name: true, email: true, image: true } },
        seller: { select: { id: true, name: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json(chats)
  } catch (error) {
    console.error("Fetch support chats error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  const user = await verifySupportAdmin()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  try {
    const { chatId, action } = await req.json()
    if (!chatId || !action) return new NextResponse("Bad Request", { status: 400 })

    if (action === "TAKE") {
      const chat = await prisma.chat.update({
        where: { id: chatId },
        data: { sellerId: user.id },
        include: { buyer: { select: { email: true } } }
      })

      try {
        const { sendDiscordLog } = await import("@/lib/discord");
        await sendDiscordLog("support", {
          title: "🙋 Support Chat Claimed",
          color: 0xa855f7, // Purple for admin
          fields: [
            { name: "Admin", value: user.email || "Unknown", inline: true },
            { name: "Customer", value: chat.buyer?.email || "Unknown", inline: true },
            { name: "Chat ID", value: chatId, inline: true }
          ]
        })
      } catch (e) {}

      return NextResponse.json(chat)
    }

    if (action === "RESOLVE") {
      const chat = await prisma.chat.update({
        where: { id: chatId },
        data: { status: "SUCCESS" } as any,
        include: { buyer: { select: { email: true } } }
      })

      try {
        const { sendDiscordLog } = await import("@/lib/discord");
        await sendDiscordLog("support", {
          title: "✅ Support Chat Resolved",
          color: 0x00ff00, // Green
          fields: [
            { name: "Admin", value: user.email || "Unknown", inline: true },
            { name: "Customer", value: chat.buyer?.email || "Unknown", inline: true },
            { name: "Chat ID", value: chatId, inline: true }
          ]
        })
      } catch (e) {}

      return NextResponse.json(chat)
    }

    return new NextResponse("Invalid action", { status: 400 })
  } catch (error) {
    console.error("Update support chat error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
