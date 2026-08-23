import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isLoginPage = req.nextUrl.pathname === "/login"
    const isPublicRoute = req.nextUrl.pathname === "/"

    //If user is already logged in and tries to go to /login, redirect to /dashboard    
    if (isLoggedIn && isLoginPage) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
    //If user is NOT logged in and tries to access private routes, redirect to /login 
    if (!isLoggedIn && !isLoginPage && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}