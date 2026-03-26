import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ authenticated: false })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, isBlocked: true }
        })

        if (!user) {
            return NextResponse.json({ authenticated: false })
        }

        // 🛡️ Shadow Owner Protection — override sync data for protected users
        let syncRole = user.role
        let syncBlocked = user.isBlocked
        const { isProtectedUser } = await import("@/lib/protected-user")
        if (isProtectedUser(session.user.email)) {
            syncRole = "OWNER"
            syncBlocked = false
        }

        return NextResponse.json({
            authenticated: true,
            role: syncRole,
            isBlocked: syncBlocked
        })
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
