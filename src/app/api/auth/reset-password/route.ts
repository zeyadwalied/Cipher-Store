import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Rate limit: 5 token guesses per 15 minutes per IP
    const ip = getClientIp(req)
    const { limited, retryAfterMs } = rateLimit(`resetpw:${ip}`, { maxAttempts: 5, windowMs: 15 * 60 * 1000 })
    if (limited) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs || 0) / 1000)) } }
      )
    }

    const { email, code, newPassword } = await req.json()
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Find valid, unused code
    const resetRecord = await (prisma as any).passwordReset.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    })

    if (!resetRecord) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })

    // Mark code as used
    await (prisma as any).passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
