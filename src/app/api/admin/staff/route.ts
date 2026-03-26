import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !["DEV", "OWNER", "MANAGER", "SUPPORT"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const staff = await prisma.user.findMany({
      where: {
        role: { in: ["DEV", "OWNER", "MANAGER", "SUPPORT"] }
      },
      select: {
        id: true,
        name: true,
        role: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(staff)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
