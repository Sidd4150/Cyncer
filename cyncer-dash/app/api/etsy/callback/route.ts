import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma"

// Callback route for Etsy verification
// Currenlty saves access token in cache changing it to save in database to allow for mutlipe etsy store connections
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const codeVerifier = request.cookies.get("etsy_code_verifier")?.value;

    if (!code || !codeVerifier) {
        return NextResponse.json({ error: "Missing code or verifier" }, { status: 400 });
    }
    // Exchange the code for an access token
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

        const res = NextResponse.json({ success: true, message: "Etsy connected!" });
        res.cookies.delete("etsy_code_verifier");

        // Save access and refresh to database
        await prisma.platformToken.upsert({
            where: {
                platform_shopId: {
                    platform: "etsy",
                    shopId: process.env.ETSY_SHOP_ID!,
                },
            },
            update: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: new Date(Date.now() + data.expires_in * 1000),
            },
            create: {
                platform: "etsy",
                shopId: process.env.ETSY_SHOP_ID!,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: new Date(Date.now() + data.expires_in * 1000),
            },
        });
        return res;
    } catch (error) {
        return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 });
    }
}