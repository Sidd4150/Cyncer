import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const codeVerifier = request.cookies.get("etsy_code_verifier")?.value;

    if (!code || !codeVerifier) {
        return NextResponse.json({ error: "Missing code or verifier" }, { status: 400 });
    }
    //Excahnge the code for an access token
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

    if (data.access_token) {
        // Save the token in a cookie for now
        const res = NextResponse.json({ success: true, message: "Etsy connected!" });
        res.cookies.set("etsy_access_token", data.access_token, {
            httpOnly: true,
            maxAge: data.expires_in,
        });
        res.cookies.set("etsy_refresh_token", data.refresh_token, {
            httpOnly: true,
        });
        // Clear the verifier
        res.cookies.delete("etsy_code_verifier");
        return res;
    }
    return NextResponse.json({ error: data }, { status: 400 });
}