import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import nodemailer from "nodemailer"

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// POST: Send an email alert to the user regarding their order chat
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || !["OWNER", "MANAGER", "SUPPORT"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!order || !order.user || !order.user.email) {
      return new NextResponse("Order or user email not found", { status: 404 })
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Action Required</title>
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
        .action-box {
          background-color: #000000;
          border: 1px solid #a855f7;
          border-radius: 4px;
          padding: 25px;
          margin: 30px 0;
          display: inline-block;
        }
        .action-text {
          font-size: 18px;
          font-weight: bold;
          color: #00f5ff;
          text-transform: uppercase;
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
          color: #ff0055;
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
          <h1>Action Required</h1>
          <p>Greetings ${order.user.name || 'Operative'},<br><br>The Cipher Store support terminal has sent you a secure message regarding your transaction <strong>#${order.id}</strong>. We need your response to proceed with the asset transfer.</p>
          
          <div class="action-box">
            <div class="action-text">PLEASE LOGIN TO YOUR ACCOUNT AND CHECK YOUR MESSAGES</div>
          </div>
          
          <p>Failure to respond may delay your acquisition.</p>
          <div class="warning">/// SECURE TRANSMISSION ///</div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Cipher Store. ALL SYSTEMS NOMINAL.<br>
          Automated system message. Do not reply to this transmission.
        </div>
      </div>
    </body>
    </html>
    `

    const emailText = `Hello ${order.user.name || 'Customer'},\n\nWe have sent you a message regarding your order #${order.id}. Please log in to your Cipher Store account and check your Messages to reply.\n\nThank you!`

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {

      await transporter.sendMail({
        from: `"Cipher Store Support" <${process.env.SMTP_USER}>`,
        to: order.user.email,
        subject: `[ACTION REQUIRED] Message regarding Order #${order.id} - Cipher Store`,
        text: emailText,
        html: htmlContent
      })
      return NextResponse.json({ success: true })
    } else {
      return new NextResponse("SMTP Not Configured", { status: 500 })
    }
  } catch (error) {
    console.error("Send alert email error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
