import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import nodemailer from "nodemailer"
import { sendDiscordLog } from "@/lib/discord"

// Helper to configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Easily configurable to other services via SMTP
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || !["OWNER", "MANAGER"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { status } = await req.json()
    if (!status) return new NextResponse("Status required", { status: 400 })

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            stockItems: true
          }
        }
      }
    })

    if (!order) return new NextResponse("Order not found", { status: 404 })

    // Update the actual order status
    await prisma.order.update({
      where: { id },
      data: { status, confirmationSource: 'WEBSITE' }
    })

    const statusTitle = "⚙️ Order Status Updated";
    const statusColor = 0xa855f7; // Purple

    try {
      await sendDiscordLog("admin", {
        title: statusTitle,
        color: statusColor,
        fields: [
          { name: "Order ID", value: id, inline: true },
          { name: "Customer", value: order.user?.email || "Unknown", inline: true },
          { name: "New Status", value: status, inline: true },
          { name: "Admin", value: session.user?.email || "Unknown", inline: true }
        ]
      })
    } catch (e) {}

    // If changing to COMPLETED, dispatch the email
    if (status === "COMPLETED" && order.user?.email) {
      let itemsHtml = ""
      let emailText = `Hello ${order.user?.name || 'Customer'},\n\nYour order #${order.id} has been fully confirmed and processed. Here are the details:\n\n`

      order.items.forEach(item => {
        itemsHtml += `<div class="item-box">`
        itemsHtml += `<div class="item-title">► ${item.product.name} (x${item.quantity})</div>`
        emailText += `--- ${item.product.name} (x${item.quantity}) ---\n`
        
        if (item.product.deliveryType === "AUTOMATIC" && item.stockItems.length > 0) {
          item.stockItems.forEach((si, index) => {
            itemsHtml += `<div class="item-data"><span class="data-label">KEY_${index + 1}:</span> ${si.data}</div>`
            emailText += `Key ${index + 1}: ${si.data}\n`
          })
        } else {
          itemsHtml += `<div class="item-manual">STATUS: AWAITING_MANUAL_TRANSFER - CHECK_COMMS</div>`
          emailText += `This product is delivered manually. Please check your messages/chat on the website.\n`
        }
        itemsHtml += `</div>`
        emailText += `\n`
      })
      emailText += `\nThank you for shopping with Cipher Store!\n`

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Completed</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            background-color: #030712;
            color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #0a0a0c;
            border: 1px solid #00f5ff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 245, 255, 0.2);
          }
          .header {
            background-color: #010205;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 2px solid #a855f7;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
            background-color: #0a0a0c;
            background-image: linear-gradient(#0a0a0c, #111114);
          }
          h1 {
            font-size: 22px;
            margin-bottom: 20px;
            color: #00f5ff;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            color: #b0b0b0;
            margin-bottom: 30px;
            font-family: Arial, sans-serif;
          }
          .items-container {
            text-align: left;
            margin: 30px 0;
          }
          .item-box {
            background-color: #000000;
            border: 1px solid #a855f7;
            border-left: 4px solid #a855f7;
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 15px;
          }
          .item-title {
            color: #00f5ff;
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 16px;
            border-bottom: 1px dashed #333;
            padding-bottom: 10px;
          }
          .item-data {
            color: #ffffff;
            font-size: 15px;
            margin-bottom: 8px;
            background: #111;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #222;
          }
          .data-label {
            color: #a855f7;
            font-size: 12px;
            margin-right: 8px;
          }
          .item-manual {
            color: #f59e0b;
            font-size: 14px;
          }
          .footer {
            padding: 20px;
            background-color: #010205;
            text-align: center;
            font-size: 11px;
            color: #4b5563;
            border-top: 1px dashed #333;
            font-family: Arial, sans-serif;
          }
          .warning {
            color: #00f5ff;
            font-size: 12px;
            margin-top: 20px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
          </div>
          <div class="content">
            <h1>Transaction Complete</h1>
            <p>Greetings ${order.user?.name || 'Operative'},<br><br>Your transaction <strong>#${order.id}</strong> has been successfully processed by the Cipher Store mainframe. Below are the decrypted assets for your acquisition.</p>
            
            <div class="items-container">
              ${itemsHtml}
            </div>
            
            <p>If you encounter any anomalies, please contact support.</p>
            <div class="warning">/// END OF TRANSMISSION ///</div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Cipher Store. ALL SYSTEMS NOMINAL.<br>
            Automated system message. Do not reply to this transmission.
          </div>
        </div>
      </body>
      </html>
      `

      try {
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          await transporter.sendMail({
            from: `"Cipher Store" <${process.env.SMTP_USER}>`,
            to: order.user?.email,
            subject: `[SECURE DELIVERY] Order #${order.id} Completed - Cipher Store`,
            text: emailText,
            html: htmlContent
          })
          console.log(`Successfully sent email to ${order.user?.email}`)
        } else {
          console.warn("Email skipped: SMTP credentials not configured in .env")
        }
      } catch (mailError) {
        console.error("Failed to send email out:", mailError)
      }
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error("Change order status error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
