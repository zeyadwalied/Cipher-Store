import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth(async (req) => {
    const session = req.auth
    const { pathname } = req.nextUrl

    // Block blocked users from all pages except login
    if (session?.user?.isBlocked && !pathname.startsWith("/login")) {
        const url = req.nextUrl.clone()
        url.pathname = "/login"
        url.search = `error=Blocked`
        return NextResponse.redirect(url)
    }

    // Protect /dashboard — require authenticated admin/staff
    if (pathname.startsWith("/dashboard")) {
        if (!session?.user) {
            const url = req.nextUrl.clone()
            url.pathname = "/login"
            url.search = "error=Unauthorized"
            return NextResponse.redirect(url)
        }
        const role = session.user.role
        if (!["DEV", "OWNER", "MANAGER", "SELLER", "SUPPORT"].includes(role)) {
            const url = req.nextUrl.clone()
            url.pathname = "/"
            return NextResponse.redirect(url)
        }
    }

    // Protect /api/admin — require authenticated users (role check is done in route handlers)
    if (pathname.startsWith("/api/admin")) {
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
