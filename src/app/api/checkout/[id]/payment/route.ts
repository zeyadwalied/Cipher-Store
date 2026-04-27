import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { isSiteInMaintenanceMode } from "@/lib/maintenance"

// Discord webhook removed
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    if (await isSiteInMaintenanceMode() && session.user.role !== "OWNER") {
      return new NextResponse("System under maintenance", { status: 503 })
    }

    // Verify order ownership
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order || order.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const senderPhoneNumber = body.senderPhoneNumber
    const receiptImageUrl = body.receiptImageUrl

    if (!senderPhoneNumber || !receiptImageUrl) {
      return new NextResponse("Missing fields (phone or image url)", { status: 400 })
    }

    // Save the Receipt URL to the database
    await prisma.order.update({
      where: { id },
      data: { senderPhoneNumber, receiptImageUrl } as any
    })

    // Drop the receipt into the Chat so it syncs to the specific Discord Ticket
    const chat = await prisma.chat.findFirst({ where: { orderId: id } });
    if (chat) {
      await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: session.user.id,
          content: `🧾 **Buyer uploaded Payment Receipt**\nPhone: ${senderPhoneNumber}\n[View Receipt](${receiptImageUrl})`,
        }
      });
    }

    // Discord logging removed

    // Bot sync removed

    return NextResponse.json({ success: true, receiptImageUrl })
  } catch (error: any) {
    console.error("Payment upload error:", error)
    return new NextResponse(`Internal server error: ${error.message}`, { status: 500 })
  }
}
