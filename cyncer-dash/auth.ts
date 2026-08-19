import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        // Only allow sign-in if the email matches Dad's whitelisted email
        async signIn({ user }) {
            const allowedEmail = process.env.ALLOWED_EMAIL?.toLowerCase().trim()
            if (!user.email || !allowedEmail) {
                return false
            }
            return user.email.toLowerCase().trim() === allowedEmail
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string
            }
            return session
        },
    },
})