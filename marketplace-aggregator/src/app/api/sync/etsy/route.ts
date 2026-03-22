import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEtsyReceipts, refreshEtsyToken, EtsyReceipt } from "@/lib/etsy";

function mapEtsyStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "completed": return "DELIVERED";
    case "payment_processing":
    case "open": return "PENDING";
    case "shipped": return "SHIPPED";
    case "cancelled": return "CANCELLED";
    default: return "PENDING";
  }
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connection = await prisma.platformConnection.findUnique({
    where: { userId_platform: { userId, platform: "ETSY" } },
  });

  if (!connection?.shopId) {
    return NextResponse.json({ error: "Etsy not connected" }, { status: 400 });
  }

  // Refresh token if expired
  let accessToken = connection.accessToken;
  if (connection.expiresAt && connection.expiresAt < new Date() && connection.refreshToken) {
    const refreshed = await refreshEtsyToken(connection.refreshToken);
    accessToken = refreshed.access_token;
    await prisma.platformConnection.update({
      where: { userId_platform: { userId, platform: "ETSY" } },
      data: {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    });
  }

  // Paginate through all receipts
  let offset = 0;
  let synced = 0;

  while (true) {
    const { count, results } = await getEtsyReceipts(accessToken, connection.shopId, offset);

    for (const receipt of results) {
      await upsertReceipt(receipt);
      synced++;
    }

    if (offset + results.length >= count) break;
    offset += results.length;
  }

  // Update syncedAt
  await prisma.platformConnection.update({
    where: { userId_platform: { userId, platform: "ETSY" } },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ synced });
}

async function upsertReceipt(receipt: EtsyReceipt) {
  const total = receipt.grand_total.amount / receipt.grand_total.divisor;
  const status = mapEtsyStatus(receipt.status) as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

  await prisma.order.upsert({
    where: { platform_externalId: { platform: "ETSY", externalId: String(receipt.receipt_id) } },
    update: { status, total, syncedAt: new Date() },
    create: {
      externalId: String(receipt.receipt_id),
      platform: "ETSY",
      status,
      customerName: receipt.name,
      customerEmail: receipt.buyer_email,
      total,
      currency: receipt.grand_total.currency_code,
      createdAt: new Date(receipt.create_timestamp * 1000),
      items: {
        create: receipt.transactions.map((t) => ({
          name: t.title,
          quantity: t.quantity,
          price: t.price.amount / t.price.divisor,
        })),
      },
    },
  });
}
