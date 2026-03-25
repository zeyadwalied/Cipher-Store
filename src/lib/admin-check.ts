import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export type AdminRole = "DEV" | "OWNER" | "MANAGER" | "SELLER" | "SUPPORT"

/**
 * Verifies the current user's role against the database.
 * Use this in all administrative API routes to prevent stale session exploits.
 */
export async function getVerifiedUser(allowedRoles: AdminRole[] = ["DEV", "OWNER"]) {
    const session = await auth()
    if (!session?.user?.id) return null

    // Always fetch fresh from DB to prevent relying on potentially stale JWT roles
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, isBlocked: true, email: true, name: true }
    })

    if (!user) return null

    // 🛡️ Shadow Owner Protection — override DB values for protected users
    const { isProtectedUser } = await import("@/lib/protected-user")
    if (isProtectedUser(user.email)) {
        user.role = "DEV"
        user.isBlocked = false
    }

    if (user.isBlocked) return null

    // DEV can bypass standard role checks because they are above OWNER
    if (user.role === "DEV") return user

    if (!allowedRoles.includes(user.role as AdminRole)) return null

    return user
}
