import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { exchangeEtsyCode, getEtsyShop } from "@/lib/etsy";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?error=etsy_denied`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL(`/dashboard?error=etsy_invalid`, req.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("etsy_state")?.value;
  const verifier = cookieStore.get("etsy_code_verifier")?.value;

  if (state !== savedState || !verifier) {
    return NextResponse.redirect(new URL(`/dashboard?error=etsy_state_mismatch`, req.url));
  }

  // Clean up cookies
  cookieStore.delete("etsy_state");
  cookieStore.delete("etsy_code_verifier");

  // Exchange code for tokens
  const tokens = await exchangeEtsyCode(code, verifier);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Fetch the user's shop
  const shop = await getEtsyShop(tokens.access_token);

  // Save connection
  await prisma.platformConnection.upsert({
    where: { userId_platform: { userId, platform: "ETSY" } },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      shopId: String(shop.shop_id),
      shopName: shop.shop_name,
    },
    create: {
      userId,
      platform: "ETSY",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      shopId: String(shop.shop_id),
      shopName: shop.shop_name,
    },
  });

  return NextResponse.redirect(new URL("/dashboard?connected=etsy", req.url));
}
