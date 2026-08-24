import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { authConfig } from "./auth.config"
import { isEmailAllowed } from "@/app/lib/authHelpers"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Google({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        // Only allow sign-in if the email matches the whitelisted emails
        async signIn({ user }) {
            return isEmailAllowed(user.email)
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string
            }
            return session
        },
    },
})