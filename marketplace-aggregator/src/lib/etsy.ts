export const ETSY_BASE = "https://api.etsy.com/v3";

export const ETSY_SCOPES = [
  "transactions_r", // read orders/receipts
  "email_r",        // read buyer email
].join("%20");

export function getEtsyAuthUrl(state: string, codeChallenge: string) {
  const params = new URLSearchParams({
    response_type: "code",
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/etsy/callback`,
    scope: ETSY_SCOPES.replace(/%20/g, " "),
    client_id: process.env.ETSY_CLIENT_ID!,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://www.etsy.com/oauth/connect?${params.toString()}`;
}

export async function exchangeEtsyCode(code: string, codeVerifier: string) {
  const res = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.ETSY_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/etsy/callback`,
      code,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) throw new Error(`Etsy token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number; token_type: string }>;
}

export async function refreshEtsyToken(refreshToken: string) {
  const res = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ETSY_CLIENT_ID!,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Etsy token refresh failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

export async function getEtsyShop(accessToken: string) {
  const res = await fetch(`${ETSY_BASE}/application/users/me/shops`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": process.env.ETSY_CLIENT_ID!,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch Etsy shop: ${await res.text()}`);
  return res.json() as Promise<{ shop_id: number; shop_name: string }>;
}

export async function getEtsyReceipts(accessToken: string, shopId: string, offset = 0) {
  const res = await fetch(
    `${ETSY_BASE}/application/shops/${shopId}/receipts?limit=100&offset=${offset}&was_paid=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": process.env.ETSY_CLIENT_ID!,
      },
    }
  );
  if (!res.ok) throw new Error(`Failed to fetch Etsy receipts: ${await res.text()}`);
  return res.json() as Promise<{
    count: number;
    results: EtsyReceipt[];
  }>;
}

export type EtsyReceipt = {
  receipt_id: number;
  status: string;
  grand_total: { amount: number; divisor: number; currency_code: string };
  buyer_email: string;
  name: string;
  create_timestamp: number;
  update_timestamp: number;
  transactions: Array<{
    title: string;
    quantity: number;
    price: { amount: number; divisor: number };
  }>;
};
