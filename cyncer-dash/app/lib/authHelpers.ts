export function isEmailAllowed(email?: string | null): boolean {
    if (!email || !process.env.ALLOWED_EMAIL) {
        return false
    }

    const allowedList = process.env.ALLOWED_EMAIL
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)

    return allowedList.includes(email.trim().toLowerCase())
}
