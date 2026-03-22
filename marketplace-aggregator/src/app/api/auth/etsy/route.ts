import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getEtsyAuthUrl } from "@/lib/etsy";
import { cookies } from "next/headers";
import crypto from "crypto";

function base64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // PKCE: generate verifier + challenge
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
  const state = base64url(crypto.randomBytes(16));

  // Store verifier + state in cookies for the callback
  const cookieStore = await cookies();
  cookieStore.set("etsy_code_verifier", verifier, { httpOnly: true, maxAge: 600, path: "/" });
  cookieStore.set("etsy_state", state, { httpOnly: true, maxAge: 600, path: "/" });

  return NextResponse.redirect(getEtsyAuthUrl(state, challenge));
}
