import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function middleware(req: NextRequest) {
    try {
        const sessionCookie =
            req.cookies.get("__Secure-authjs.session-token")?.value ||
            req.cookies.get("authjs.session-token")?.value ||
            req.cookies.get("__Secure-next-auth.session-token")?.value ||
            req.cookies.get("next-auth.session-token")?.value

        const isLoggedIn = !!sessionCookie
        const pathname = req.nextUrl.pathname
        const isLoginPage = pathname === "/login"
        const isPublicRoute = pathname === "/"

        // 1. If logged in and on /login, redirect to /dashboard
        if (isLoggedIn && isLoginPage) {
            return NextResponse.redirect(new URL("/dashboard", req.url))
        }

        // 2. If NOT logged in and accessing private pages, redirect to /login
        if (!isLoggedIn && !isLoginPage && !isPublicRoute) {
            return NextResponse.redirect(new URL("/login", req.url))
        }

        return NextResponse.next()
    } catch (err) {
        console.error("Middleware error:", err)
        return NextResponse.next()
    }
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
