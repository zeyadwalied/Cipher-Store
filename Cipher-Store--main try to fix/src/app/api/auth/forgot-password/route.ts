import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import nodemailer from "nodemailer"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: Request) {
  try {
    // Rate limiting: 3 requests per 15 minutes per IP
    const ip = getClientIp(req)
    const { limited, retryAfterMs } = rateLimit(`forgotpw:${ip}`, { maxAttempts: 3, windowMs: 60 * 60 * 1000 })
    if (limited) {
      return NextResponse.json(
        { error: "Too many reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs || 0) / 1000)) } }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    } // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Don't reveal if user exists — always return success
      return NextResponse.json({ success: true })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save to DB
    await (prisma as any).passwordReset.create({
      data: { email, code, expiresAt }
    })

    // Send email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"Cipher Store" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Password Reset Code — Cipher Store",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0f; border: 1px solid #27272a; border-radius: 16px;">
            <h1 style="color: #a855f7; font-size: 24px; margin-bottom: 8px;">🔐 Password Reset</h1>
            <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px;">Use this verification code to reset your password. It expires in <strong style="color:white;">10 minutes</strong>.</p>
            <div style="background: #141417; border: 2px solid #a855f7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00f5ff; font-family: monospace;">${code}</span>
            </div>
            <p style="color: #71717a; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #27272a; margin: 20px 0;" />
            <p style="color: #52525b; font-size: 11px; text-align: center;">Cipher Store — Premium Gaming Digital Goods</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
