import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getVerifiedUser } from "@/lib/admin-check"

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getVerifiedUser()

        if (!user || !['OWNER', 'MANAGER'].includes(user.role)) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id: userId } = await params

        // Prevent users from deleting themselves
        if (userId === user?.id) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            )
        }

        // Only OWNER can delete other OWNERs
        if (user?.role !== "OWNER") {
            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true }
            })
            if (targetUser?.role === "OWNER") {
                return NextResponse.json(
                    { error: "Only an OWNER can delete another OWNER" },
                    { status: 403 }
                )
            }
        }

        // 1. Find user's email first outside the transaction
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
        })

        if (!userToDelete) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // 🛡️ Shadow Owner Protection
        const { isProtectedUser, logProtectionEvent } = await import("@/lib/protected-user")
        if (isProtectedUser(userToDelete.email)) {
            await logProtectionEvent("DELETE", user.email || "Unknown", userToDelete.email || userId)
            return NextResponse.json({ message: "User deleted successfully" }) // Fake success
        }

        // 2. Perform the cascading deletion in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete reviews
            await tx.review.deleteMany({ where: { userId } })

            // Nullify messages sender
            await tx.message.updateMany({ where: { senderId: userId }, data: { senderId: null as any } })

            // Delete chats where user is the buyer
            await tx.chat.deleteMany({ where: { buyerId: userId } })

            // Nullify chats where user is seller or assigned support
            await tx.chat.updateMany({ where: { sellerId: userId }, data: { sellerId: null as any } })
            await tx.chat.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null as any } })

            // Nullify orders
            await tx.order.updateMany({ where: { userId }, data: { userId: null as any } })

            // Nullify products seller
            await tx.product.updateMany({ where: { sellerId: userId }, data: { sellerId: null as any } })

            // Delete associated email verifications and password resets
            if (userToDelete.email) {
                try {
                    await (tx as any).emailVerification.deleteMany({ where: { email: userToDelete.email } })
                    await (tx as any).passwordReset.deleteMany({ where: { email: userToDelete.email } })
                } catch (e) { }  // Ignore if models don't exist
            }

            // Finally delete the user
            await tx.user.delete({ where: { id: userId } })
        })

        return NextResponse.json({ message: "User deleted successfully" })
    } catch (error: any) {
        console.error("[USER_DELETE]", error)
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
