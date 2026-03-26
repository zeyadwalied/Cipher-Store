import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { rateLimit, getClientIp } from "@/lib/rate-limit"


export async function GET(request: Request) {
    // Rate Limit to prevent email enumeration (20 requests per 15 mins per IP)
    const ip = getClientIp(request)
    const { limited, retryAfterMs } = rateLimit(`checkblock:${ip}`, { maxAttempts: 20, windowMs: 15 * 60 * 1000 })
    
    if (limited) {
        return NextResponse.json(
            { isBlocked: false, error: "Too many requests" },
            { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs || 0) / 1000)) } }
        )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
        return NextResponse.json({ isBlocked: false })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { isBlocked: true }
        })

        return NextResponse.json({ isBlocked: !!user?.isBlocked })
    } catch (error) {
        return NextResponse.json({ isBlocked: false })
    }
}
