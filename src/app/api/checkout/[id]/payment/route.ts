import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

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

    // Convert the image to a Base64 data URL (Vercel is a read-only filesystem)
    const bytes = await receiptImage.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const receiptImageUrl = `data:${receiptImage.type};base64,${base64}`

    await prisma.order.update({
      where: { id },
      data: { senderPhoneNumber, receiptImageUrl } as any
    })

    try {
      const { sendDiscordLog } = await import("@/lib/discord");
      await sendDiscordLog("payments", {
        title: "💳 Payment Proof Uploaded",
        color: 0x00ff00, // Green
        fields: [
          { name: "Order ID", value: id, inline: true },
          { name: "Customer", value: session.user?.email || "Unknown", inline: true },
          { name: "Phone", value: senderPhoneNumber, inline: true }
        ]
      })
    } catch (e) { }

    return NextResponse.json({ success: true, receiptImageUrl })
  } catch (error: any) {
    console.error("Payment upload error:", error)
    return new NextResponse(`Internal server error: ${error.message}`, { status: 500 })
  }
}
