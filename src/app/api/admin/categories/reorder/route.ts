import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

async function isAdmin() {
    const session = await auth()
    return ["DEV", "OWNER", "MANAGER"].includes(session?.user?.role || "")
}

export async function PUT(req: Request) {
    if (!await isAdmin()) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const items = await req.json()

        if (!Array.isArray(items)) {
            return new NextResponse("Invalid data format", { status: 400 })
        }

        // Use a transaction to update all categories' sort order
        await prisma.$transaction(
            items.map((item: { id: string, sortOrder: number }) =>
                prisma.category.update({
                    where: { id: item.id },
                    data: { sortOrder: item.sortOrder }
                })
            )
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error reordering categories:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
