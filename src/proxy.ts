import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl

    const hasSession = 
        req.cookies.has("authjs.session-token") || 
        req.cookies.has("__Secure-authjs.session-token") || 
        req.cookies.has("next-auth.session-token")

    // Protect /admin — fast edge redirect for anonymous users
    // Deep role checks are securely handled by layout.tsx and API routes
    if (pathname.startsWith("/admin")) {
        if (!hasSession) {
            const url = req.nextUrl.clone()
            url.pathname = "/login"
            url.search = "error=Unauthorized"
            return NextResponse.redirect(url)
        }
    }

    // Fast reject for anonymous API calls to admin
    if (pathname.startsWith("/api/admin")) {
        if (!hasSession) {
            return new NextResponse("Unauthorized", { status: 401 })
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
}
