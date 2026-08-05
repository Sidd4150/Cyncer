import prisma from "@/app/lib/prisma"

// Standard headers for Etsy v3 calls. x-api-key must be keystring:shared_secret.
export function etsyHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
        "x-api-key": `${process.env.ETSY_API_KEY}:${process.env.ETSY_SHARED_SECRET}`,
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

// Resolve which shop an access token belongs to. The token is "{user_id}.{rest}",
// and /users/{user_id}/shops returns that owner's shop (id + name).
export async function getShopForToken(token: string) {
    const userId = token.split(".")[0];
    const res = await fetch(
        `https://openapi.etsy.com/v3/application/users/${userId}/shops`,
        { headers: etsyHeaders(token) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const shop = data.results?.[0] ?? data;
    if (!shop?.shop_id) return null;
    return { shopId: String(shop.shop_id), name: (shop.shop_name as string) || `Shop ${shop.shop_id}` };
}

// Ensure a Store row exists for a connected shop, fetching its display name once.
export async function ensureStore(platform: string, shopId: string, token: string) {
    const existing = await prisma.store.findUnique({
        where: { platform_shopId: { platform, shopId } },
    });
    if (existing) return existing;

    const shop = await getShopForToken(token);
    return prisma.store.create({
        data: { platform, shopId, name: shop?.name || `Shop ${shopId}` },
    });
}

export async function getValidToken(platform: string, shopId: string,) {
    const tokenRow = await prisma.platformToken.findFirst({
        where: { platform: platform, shopId: shopId }
    });

    if (!tokenRow) return null;

    if (tokenRow.expiresAt > new Date()) {
        return tokenRow.accessToken;
    }

    try {
        const res = await fetch("https://api.etsy.com/v3/public/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: process.env.ETSY_API_KEY!,
                refresh_token: tokenRow.refreshToken,
            }),
        });

        const data = await res.json();

        if (!data.access_token) return null;

        await prisma.platformToken.update({
            where: { id: tokenRow.id },
            data: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: new Date(Date.now() + data.expires_in * 1000),
            },
        });

        return data.access_token;
    } catch (error) {
        console.error("Etsy token refresh failed:", error);
        return null;
    }

}