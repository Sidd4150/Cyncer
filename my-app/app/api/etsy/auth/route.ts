import { NextResponse } from "next/server";
import crpyto from "crypto";

export async function GET() {
    const codeVerifier = crpyto.randomBytes(32).toString('base64url');
    const codeChallenge = crpyto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64url");

    const state = Math.random().toString(36).substring(7);

    const url = `https://www.etsy.com/oauth/connect?` +
        `response_type=code` +
        `&redirect_uri=${process.env.ETSY_REDIRECT_URI}` +
        `&scope=listings_r%20transactions_r` +
        `&client_id=${process.env.ETSY_API_KEY}` +
        `&state=${state}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256`;
    const response = NextResponse.redirect(url);
    response.cookies.set("etsy_code_verifier", codeVerifier, {
        httpOnly: true,
        maxAge: 300,
    });

    return response;
}