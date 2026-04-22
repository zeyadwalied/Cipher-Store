import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// GET the chat and its messages for an order
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session || !["OWNER", "MANAGER", "SUPPORT"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                chat: {
                    include: {
                        buyer: true,
                        messages: {
                            orderBy: { createdAt: "asc" }
                        }
                    }
                }
            }
        })

        if (!order) return new NextResponse("Order not found", { status: 404 })

        // If there's no chat, we can create one dynamically as a fallback
        let chat = order.chat
        if (!chat) {
            chat = await prisma.chat.create({
                data: {
                    type: "ORDER",
                    orderId: order.id,
                    buyerId: order.userId,
                },
                include: {
                    buyer: true,
                    messages: true,
                }
            })
        }

        return NextResponse.json(chat)
    } catch (error) {
        console.error("Fetch order chat error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

// POST a new message from the admin
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session || !["OWNER", "MANAGER", "SUPPORT"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { content } = await req.json()
        if (!content) return new NextResponse("Content is required", { status: 400 })

        const order = await prisma.order.findUnique({
            where: { id },
            include: { chat: true }
        })

        if (!order) return new NextResponse("Order not found", { status: 404 })

        let chat = order.chat
        if (!chat) {
            chat = await prisma.chat.create({
                data: {
                    type: "ORDER",
                    orderId: order.id,
                    buyerId: order.userId,
                }
            })
        }

        const message = await prisma.message.create({
            data: {
                chatId: chat.id,
                senderId: session.user.id,
                content,
            },
            include: {
                sender: {
                    select: { name: true, role: true }
                }
            }
        })

        // Discord sync removed

        // Update chat updatedAt
        await prisma.chat.update({
            where: { id: chat.id },
            data: { updatedAt: new Date() }
        })

        return NextResponse.json(message)
    } catch (error) {
        console.error("Send order chat message error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
