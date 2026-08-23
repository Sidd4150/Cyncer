import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma"
import { getShopForToken } from "@/app/lib/etsyHelpers";

// Callback route for Etsy OAuth. Resolves which shop connected (from the token)
// so multiple Etsy stores can be connected without overwriting each other.
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const codeVerifier = request.cookies.get("etsy_code_verifier")?.value;
    const savedState = request.cookies.get("etsy_oauth_state")?.value;

    if (!code || !codeVerifier || !state || !savedState || state !== savedState) {
        return NextResponse.json(
            { error: "Invalid or expired OAuth state parameter" },
            { status: 400 }
        );
    }
    // Exchange the code for an access token.
    try {
        const response = await fetch("https://api.etsy.com/v3/public/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: process.env.ETSY_API_KEY!,
                redirect_uri: process.env.ETSY_REDIRECT_URI!,
                code: code,
                code_verifier: codeVerifier,
            }),
        });

        const data = await response.json();

        if (!data.access_token) {
            return NextResponse.json({ error: data }, { status: 400 });
        }

        // Resolve which shop this token belongs to instead of trusting the env var
        const shop = await getShopForToken(data.access_token);
        const shopId = shop?.shopId ?? process.env.ETSY_SHOP_ID!;
        const name = shop?.name ?? `Shop ${shopId}`;

        await prisma.store.upsert({
            where: { platform_shopId: { platform: "etsy", shopId } },
            update: { name },
            create: { platform: "etsy", shopId, name },
        });

        await prisma.platformToken.upsert({
            where: {
                platform_shopId: {
                    platform: "etsy",
                    shopId,
                },
            },
            update: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: new Date(Date.now() + data.expires_in * 1000),
            },
            create: {
                platform: "etsy",
                shopId,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: new Date(Date.now() + data.expires_in * 1000),
            },
        });

        const res = NextResponse.redirect(new URL("/dashboard?connected=etsy", request.url));
        res.cookies.delete("etsy_code_verifier");
        res.cookies.delete("etsy_oauth_state");
        return res;
    } catch (error) {
        console.error("Etsy token exchange failed:", error);
        return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 });
    }
}
