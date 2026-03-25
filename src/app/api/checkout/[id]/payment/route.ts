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

    // Prepare a FormData object for Discord
    const discordFormData = new FormData()
    const originalFileName = receiptImage.name || 'receipt.png'
    const fileName = `receipt_${id}_${Date.now()}_${originalFileName}`
    
    // Discord requires files[0], files[1], etc.
    discordFormData.append("files[0]", receiptImage, fileName)

    const embedPayload = {
      // Must include attachments array to link the file properly
      attachments: [
        {
          id: 0,
          filename: fileName
        }
      ],
      embeds: [
        {
          title: "💳 Payment Proof Uploaded",
          color: 0x00ff00, // Green
          fields: [
            { name: "Order ID", value: id, inline: true },
            { name: "Customer", value: session.user?.email || "Unknown", inline: true },
            { name: "Phone", value: senderPhoneNumber, inline: true }
          ],
          image: {
            url: `attachment://${fileName}`
          }
        }
      ]
    }

    discordFormData.append("payload_json", JSON.stringify(embedPayload))

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
    const receiptImageUrl = discordMessage.attachments[0]?.url

    if (!receiptImageUrl) {
      throw new Error("Discord API responded but did not return an attachment URL")
    }

    // Save the Discord CDN URL to the database
    await prisma.order.update({
      where: { id },
      data: { senderPhoneNumber, receiptImageUrl } as any
    })

    return NextResponse.json({ success: true, receiptImageUrl })
  } catch (error: any) {
    console.error("Payment upload error:", error)
    return new NextResponse(`Internal server error: ${error.message}`, { status: 500 })
  }
}
