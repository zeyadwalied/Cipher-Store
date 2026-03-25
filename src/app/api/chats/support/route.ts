import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Find an ONGOING support chat for this user
    let chat = await prisma.chat.findFirst({
      where: {
        buyerId: session.user.id,
        type: "SUPPORT",
        status: "ONGOING"
      } as any,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { name: true, role: true } } }
        },
        seller: { select: { name: true } },
        buyer: { select: { name: true } }
      }
    })

    // If none exists, create one
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          type: "SUPPORT",
          buyerId: session.user.id,
          status: "ONGOING"
        } as any,
        include: {
          messages: true,
          seller: { select: { name: true } },
          buyer: { select: { name: true, email: true } }
        }
      }) as any

      if (chat) {
        try {
          const { sendDiscordLog } = await import("@/lib/discord");
          await sendDiscordLog("support", {
            title: "🆘 New Support Request",
            color: 0xff0055, // Hot Pink/Red for support
            fields: [
              { name: "Customer", value: (chat as any).buyer?.email || session.user.email || "Unknown", inline: true },
              { name: "Chat ID", value: (chat as any).id, inline: true }
            ]
          })
        } catch (e) { }
      }
    }

    return NextResponse.json(chat as any)
  } catch (error) {
    console.error("Support chat error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
