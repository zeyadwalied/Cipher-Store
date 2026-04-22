import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        // MANDATORY: Fetch fresh role from DB to prevent stale session exploits
        const requester = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, email: true }
        })

        // 🛡️ Shadow Owner bypass: protected users always treated as OWNER
        const { isProtectedUser: isReqProtected } = await import("@/lib/protected-user")
        const requesterRole = isReqProtected(requester?.email) ? "OWNER" : requester?.role

        if (!requester || requesterRole !== "OWNER") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const { role } = await req.json()
        const userId = id

        // Optional: Owners can now change their own role to test downgrade flows


        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        })

        // 🛡️ Shadow Owner Protection — allow DB change (so UI persists) but alert
        const { isProtectedUser, logProtectionEvent } = await import("@/lib/protected-user")
        if (isProtectedUser(targetUser?.email)) {
            await logProtectionEvent("ROLE_CHANGE", session.user.email || "Unknown", targetUser?.email || userId, `Attempted new role: ${role}`)
        }

        await prisma.user.update({
            where: { id: userId },
            data: { role }
        })

        // Discord sync removed

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
