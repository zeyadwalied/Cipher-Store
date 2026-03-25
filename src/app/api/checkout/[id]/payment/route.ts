import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

const PAYMENT_WEBHOOK_URL = "https://discord.com/api/webhooks/1485459046541820017/qI8gsSHFQJ0e4YR4IPtoYyMVFDKxEGVE0748avgqSR2NAFk-KnLpzK-sk9BkuN_FTCEG"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    // Verify order ownership
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order || order.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const senderPhoneNumber = formData.get("senderPhoneNumber") as string
    const receiptImage = formData.get("receiptImage") as File

    if (!senderPhoneNumber || !receiptImage) {
      return new NextResponse("Missing fields (phone or image)", { status: 400 })
    }

    const originalFileName = receiptImage.name || 'receipt.png'
    const fileName = `receipt_${id}_${Date.now()}_${originalFileName}`

    const fileBytes = await receiptImage.arrayBuffer()
    const buffer = Buffer.from(fileBytes)

    // Dynamically importing discord.js to utilize its flawless multipart boundary formatting
    // which avoids standard fetch FormData serialization bugs in Vercel Serverless.
    const { WebhookClient, AttachmentBuilder } = await import("discord.js")
    const webhookClient = new WebhookClient({ url: PAYMENT_WEBHOOK_URL })
    
    const attachment = new AttachmentBuilder(buffer, { name: fileName })

    let receiptImageUrl: string
    try {
      const discordMessage = await webhookClient.send({
        content: `🧾 Receipt Upload for Order **${id}**`,
        files: [attachment]
      })
      
      receiptImageUrl = (discordMessage as any).attachments?.[0]?.url
      if (!receiptImageUrl) {
        throw new Error("Discord returned success but no attachment URL found")
      }
    } catch (e: any) {
      console.error("Failed to upload receipt to Discord via discord.js:", e)
      throw new Error(`Failed to upload receipt: ${e.message || e}`)
    }

    // Save the Discord CDN URL to the database
    await prisma.order.update({
      where: { id },
      data: { senderPhoneNumber, receiptImageUrl } as any
    })

    // Log the event to Discord using the standard logger
    try {
      const { sendDiscordLog } = await import("@/lib/discord");
      await sendDiscordLog("payments", {
        title: "💳 Payment Proof Uploaded",
        color: 0x00ff00, // Green
        fields: [
          { name: "Order ID", value: id, inline: true },
          { name: "Customer", value: session.user?.email || "Unknown", inline: true },
          { name: "Phone", value: senderPhoneNumber, inline: true }
        ],
        image: {
          url: receiptImageUrl
        }
      })
    } catch (e) { }

    return NextResponse.json({ success: true, receiptImageUrl })
  } catch (error: any) {
    console.error("Payment upload error:", error)
    return new NextResponse(`Internal server error: ${error.message}`, { status: 500 })
  }
}
