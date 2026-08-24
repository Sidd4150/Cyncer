import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function middleware(req: NextRequest) {
    // Check for Auth.js / NextAuth session cookies (supports both local HTTP and production HTTPS __Secure- cookies)
    const sessionCookie =
        req.cookies.get("__Secure-authjs.session-token")?.value ||
        req.cookies.get("authjs.session-token")?.value ||
        req.cookies.get("__Secure-next-auth.session-token")?.value ||
        req.cookies.get("next-auth.session-token")?.value

    const isLoggedIn = !!sessionCookie
    const isLoginPage = req.nextUrl.pathname === "/login"
    const isPublicRoute = req.nextUrl.pathname === "/"

    // 1. If logged in and on /login, redirect to /dashboard
    if (isLoggedIn && isLoginPage) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }

    // 2. If NOT logged in and accessing private pages, redirect to /login
    if (!isLoggedIn && !isLoginPage && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
