import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST: Verify the code
export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email and code are required" },
        { status: 400 }
      )
    }

    // Find the verification record
    const verification = await (prisma as any).emailVerification.findFirst({
      where: {
        email,
        code,
      },
      orderBy: { createdAt: "desc" }
    })

    if (!verification) {
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date() > new Date(verification.expiresAt)) {
      return NextResponse.json(
        { message: "Verification code has expired. Please request a new one." },
        { status: 410 }
      )
    }

    // Check if user already exists (legacy case)
    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      // Just mark as verified
      await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() }
      })
    } else {
      // First user becomes OWNER
      const usersCount = await prisma.user.count()
      const role = usersCount === 0 ? "OWNER" : "USER"

      // Create new user from pending details
      await prisma.user.create({
        data: {
          name: verification.name || "User",
          email: verification.email,
          password: verification.password,
          role,
          emailVerified: new Date()
        }
      })

      // Discord log removed
    }

    // Clean up used verification codes
    await (prisma as any).emailVerification.deleteMany({
      where: { email }
    })

    return NextResponse.json({ message: "Email verified and account created successfully!" })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT: Resend verification code
export async function PUT(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user is currently pending
    const pendingUser = await (prisma as any).emailVerification.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" }
    })

    if (pendingUser) {
      // Generate new code
      const code = generateCode()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      // Delete old codes
      await (prisma as any).emailVerification.deleteMany({
        where: { email }
      })

      // Store new code, PRESERVING name and password
      await (prisma as any).emailVerification.create({
        data: {
          email,
          name: pendingUser.name,
          password: pendingUser.password,
          code,
          expiresAt,
        }
      })

      // Send email
      await sendVerificationEmail(email, code)

      return NextResponse.json({ message: "New verification code sent!" })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 400 }
      )
    }

    // Generate new code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Delete old codes
    await (prisma as any).emailVerification.deleteMany({
      where: { email }
    })

    // Store new code
    await (prisma as any).emailVerification.create({
      data: {
        email,
        code,
        expiresAt,
      }
    })

    // Send email
    await sendVerificationEmail(email, code)

    return NextResponse.json({ message: "New verification code sent!" })
  } catch (error) {
    console.error("Resend error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
