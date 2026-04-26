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

    const formData = await req.formData()
    const senderPhoneNumber = formData.get("senderPhoneNumber") as string
    const receiptImage = formData.get("receiptImage") as File

    if (!senderPhoneNumber || !receiptImage) {
      return new NextResponse("Missing fields (phone or image)", { status: 400 })
    }

    let receiptImageUrl = ""

    // In local development, bypass Catbox completely since it hangs frequently.
    if (process.env.NODE_ENV === "development") {
      const { Buffer } = await import("buffer")
      const { writeFile, mkdir } = await import("fs/promises")
      const path = await import("path")
      
      const fileBytes = await receiptImage.arrayBuffer()
      const buffer = Buffer.from(fileBytes)
      const filename = `${Date.now()}-${receiptImage.name || 'receipt.png'}`
      
      const uploadDir = path.join(process.cwd(), "public", "uploads")
      await mkdir(uploadDir, { recursive: true }).catch(() => {})
      
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      
      receiptImageUrl = `/uploads/${filename}`
    } else {
      // Production uses Catbox.moe
      const catboxForm = new FormData()
      catboxForm.append("reqtype", "fileupload")
      
      const fileBytes = await receiptImage.arrayBuffer()
      const fileBlob = new Blob([fileBytes], { type: receiptImage.type || "image/png" })
      catboxForm.append("fileToUpload", fileBlob, receiptImage.name || 'receipt.png')

      const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: catboxForm,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload receipt: ${response.statusText}`)
      }

      receiptImageUrl = await response.text()

      if (!receiptImageUrl.startsWith("http")) {
        throw new Error("Invalid response from image host")
      }
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
