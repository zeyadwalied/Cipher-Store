import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// DELETE a specific message in the chat
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string, msgId: string }> }
) {
    try {
        const { id, msgId } = await params
        const session = await auth()
        if (!session || !["OWNER", "MANAGER"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Verify the order exists
        const order = await prisma.order.findUnique({
            where: { id },
            include: { chat: true }
        })

        if (!order) return new NextResponse("Order not found", { status: 404 })
        if (!order.chat) return new NextResponse("Chat not found", { status: 404 })

        // Verify the message belongs to this chat
        const message = await prisma.message.findUnique({
            where: { id: msgId }
        })

        if (!message || message.chatId !== order.chat.id) {
            return new NextResponse("Message not found", { status: 404 })
        }

        // Delete the message
        await prisma.message.delete({
            where: { id: msgId }
        })

        // Optionally update the chat updatedAt
        await prisma.chat.update({
            where: { id: order.chat.id },
            data: { updatedAt: new Date() }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete chat message error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
