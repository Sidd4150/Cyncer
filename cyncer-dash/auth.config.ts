import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isLoginPage = nextUrl.pathname === "/login"
            const isPublicRoute = nextUrl.pathname === "/"

            if (isLoggedIn && isLoginPage) {
                return Response.redirect(new URL("/dashboard", nextUrl))
            }
            if (!isLoggedIn && !isLoginPage && !isPublicRoute) {
                return false
            }
            return true
        },
    },
    providers: [],
} satisfies NextAuthConfig
