import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendVerificationEmail } from "@/lib/email"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { sanitizeName, validateEmail, validatePassword } from "@/lib/sanitize"

export const dynamic = "force-dynamic"

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 registrations per 15 minutes per IP
    const ip = getClientIp(req)
    const { limited, retryAfterMs } = rateLimit(`register:${ip}`, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
    })
    if (limited) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs || 0) / 1000)) } }
      )
    }

    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Input validation
    if (!validateEmail(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      return NextResponse.json({ message: passwordCheck.message }, { status: 400 })
    }

    const sanitizedName = sanitizeName(name)
    if (!sanitizedName) {
      return NextResponse.json({ message: "Invalid name" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate verification code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any previous verification codes for this email
    await (prisma as any).emailVerification.deleteMany({
      where: { email }
    })

    // Store the pending user data and verification code
    await (prisma as any).emailVerification.create({
      data: {
        email,
        name: sanitizedName,
        password: hashedPassword,
        code,
        expiresAt,
      }
    })

    // Send verification email
    const emailResult = await sendVerificationEmail(email, code)

    if (!emailResult.success) {
      console.error("Failed to send verification email.")
    }

    return NextResponse.json(
      {
        message: "Registration pending. Please check your email to verify your account.",
        requiresVerification: true,
        email
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
