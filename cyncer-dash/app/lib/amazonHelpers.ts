
export async function getAccessToken(): Promise<string | null> {
    try {
        const res = await fetch("https://api.amazon.com/auth/o2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: process.env.AMAZON_LWA_REFRESH_TOKEN!,
                client_id: process.env.AMAZON_LWA_CLIENT_ID!,
                client_secret: process.env.AMAZON_LWA_CLIENT_SECRET!,
            })
        });

        const data = await res.json();

        if (!data.access_token) return null;
        return data.access_token as string;
    } catch (error) {
        console.error("Amazon LWA token fetch failed:", error);
        return null;
    }
}

export function amazonBase(): string {
    return process.env.AMAZON_USE_SANDBOX === "true"
        ? "https://sandbox.sellingpartnerapi-na.amazon.com"
        : "https://sellingpartnerapi-na.amazon.com";
}

export function amazonHeaders(token: string): Record<string, string> {
    return { "x-amz-access-token": token };
}