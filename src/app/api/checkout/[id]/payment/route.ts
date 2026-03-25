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

    // Convert the File object to a strict Blob with a MIME type. Next.js/undici
    // can drop MIME types when forwarding raw File instances over FormData without this.
    const fileBytes = await receiptImage.arrayBuffer()
    const fileBlob = new Blob([fileBytes], { type: receiptImage.type || "image/png" })

    // Prepare a FormData object for Discord. We will keep it simple to ensure Discord accepts the attachment.
    const discordFormData = new FormData()
    discordFormData.append("file", fileBlob, fileName)
    discordFormData.append("content", `🧾 Receipt Upload for Order **${id}**`)

    // Send the Discord webhook with ?wait=true to receive the message back (containing the attachment URL)
    const discordResponse = await fetch(`${PAYMENT_WEBHOOK_URL}?wait=true`, {
      method: "POST",
      body: discordFormData
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error("Failed to upload receipt to Discord:", errorText)
      throw new Error(`Failed to upload receipt: ${errorText}`)
    }

    const discordMessage = await discordResponse.json()
    const receiptImageUrl = discordMessage.attachments?.[0]?.url

    if (!receiptImageUrl) {
      throw new Error("Discord API responded but did not return an attachment URL")
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
