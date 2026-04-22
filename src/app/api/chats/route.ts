import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { getOrCreateOngoingSupportChat } from "@/lib/support-chat"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const userId = session.user.id
    const userRole = session.user.role

    let whereClause: any = {}

    if (userRole === "OWNER" || userRole === "MANAGER") {
      whereClause = {}
    } else if (userRole === "SUPPORT") {
      whereClause = { type: "SUPPORT" }
    } else if (userRole === "SELLER") {
      whereClause = {
        OR: [
          { sellerId: userId },
          { buyerId: userId },
        ]
      }
    } else {
      whereClause = { buyerId: userId }
    }

    const chats = await prisma.chat.findMany({
      where: whereClause,
      include: {
        buyer: { select: { name: true, image: true, email: true } },
        seller: { select: { name: true, image: true, email: true } },
        order: { select: { id: true, total: true, status: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(chats)
  } catch (error) {
    console.error("List chats error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { type } = await req.json()

    if (type === "SUPPORT") {
      const { chatId } = await getOrCreateOngoingSupportChat({
        buyerId: session.user.id,
        initialMessage: {
          senderId: session.user.id,
          content: "Hello, I need some help.",
        },
      })

      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          buyer: { select: { name: true, image: true, email: true } },
          seller: { select: { name: true, image: true, email: true } },
          order: { select: { id: true, total: true, status: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      })

      if (!chat) return new NextResponse("Not Found", { status: 404 })

      // Bot sync removed

      return NextResponse.json(chat)
    }

    return new NextResponse("Invalid chat type to create manually", { status: 400 })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
