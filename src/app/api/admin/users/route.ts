import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcrypt"

export const dynamic = "force-dynamic"

import { getVerifiedUser } from "@/lib/admin-check"

export async function POST(req: Request) {
  try {
    const requester = await getVerifiedUser(["OWNER"])
    if (!requester) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name, email, password, role } = body

    if (!name || !email || !password || !role) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new NextResponse("Email already exists", { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as any,
      }
    })

    // Discord logging removed

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } })

  } catch (error) {
    console.error("Manual User Creation error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
