import prisma from "@/app/lib/prisma"

export async function checkReceiptStatus(receiptId: string, headers: Record<string, string>) {
    const shopId = process.env.ETSY_SHOP_ID;
    const res = await fetch(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/receipts/${receiptId}`,
        { headers }
    );
    const data = await res.json();
    console.log("This is the checkRecepit", { data })
    return data;
}

export async function getValidToken(platform: string, shopId: string,) {
    const tokenRow = await prisma.platformToken.findFirst({
        where: { platform: platform, shopId: shopId }
    });

    if (!tokenRow) return null;

    if (tokenRow.expiresAt > new Date()) {
        return tokenRow.accessToken;
    }

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

}