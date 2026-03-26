import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET })
    const { pathname } = req.nextUrl

    // Block blocked users from all pages except login
    if (token?.isBlocked && !pathname.startsWith("/login")) {
        const url = req.nextUrl.clone()
        url.pathname = "/login"
        url.search = `error=Blocked`
        return NextResponse.redirect(url)
    }

    // Protect /dashboard — require authenticated admin/staff
    if (pathname.startsWith("/dashboard")) {
        if (!token) {
            const url = req.nextUrl.clone()
            url.pathname = "/login"
            url.search = "error=Unauthorized"
            return NextResponse.redirect(url)
        }
        const role = token.role as string
        if (!["DEV", "OWNER", "MANAGER", "SELLER", "SUPPORT"].includes(role)) {
            const url = req.nextUrl.clone()
            url.pathname = "/"
            return NextResponse.redirect(url)
        }
    }

    // Protect /api/admin — require authenticated users (role check is done in route handlers)
    if (pathname.startsWith("/api/admin")) {
        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 })
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
