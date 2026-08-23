import { NextResponse } from "next/server";
import { auth } from "@/auth"
import { getValidToken, ensureStore, etsyHeaders } from "@/app/lib/etsyHelpers";
import prisma from "@/app/lib/prisma";

export async function POST() {

    const session = await auth()
    if (!session?.user || session.user.email?.toLowerCase().trim() !== process.env.ALLOWED_EMAIL?.toLowerCase().trim()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const tokens = await prisma.platformToken.findMany({ where: { platform: "etsy" } });

    if (tokens.length === 0) {
        return NextResponse.json({ error: "No connected Etsy stores, visit /api/etsy/auth" }, { status: 401 });
    }

    const limit = 100;
    const results: { shopId: string; store?: string; synced?: number; removed?: number; total?: number; error?: string }[] = [];

    for (const tokenRow of tokens) {
        const token = await getValidToken("etsy", tokenRow.shopId);
        if (!token) {
            results.push({ shopId: tokenRow.shopId, error: "auth failed" });
            continue;
        }

        try {
            const store = await ensureStore("etsy", tokenRow.shopId, token);
            const shopId = tokenRow.shopId;
            let offset = 0;
            let total = Infinity;
            let synced = 0;
            const activeOrderIds: string[] = [];

            while (offset < total) {
                const response = await fetch(
                    `https://openapi.etsy.com/v3/application/shops/${shopId}/receipts?was_paid=true&was_shipped=false&was_canceled=false&limit=${limit}&offset=${offset}`,
                    { headers: etsyHeaders(token) }
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(`Etsy ${response.status}: ${JSON.stringify(data)}`);
                }

                total = data.count ?? 0;
                if (!data.results?.length) break;

                for (const receipt of data.results) {
                    for (const txn of receipt.transactions) {
                        const sku = `ETSY-${txn.listing_id}`;
                        const orderId = `ETSY-${receipt.receipt_id}-${txn.transaction_id}`;
                        activeOrderIds.push(orderId);

                        const product = await prisma.product.findUnique({ where: { SKU: sku } });

                        if (!product) continue;

                        await prisma.order.upsert({
                            where: { orderId },
                            update: {
                                status: receipt.status,
                                quantity: txn.quantity,
                                salePrice: txn.price.amount / txn.price.divisor,
                                storeId: store.id,
                            },
                            create: {
                                platform: "etsy",
                                orderId,
                                quantity: txn.quantity,
                                salePrice: txn.price.amount / txn.price.divisor,
                                date: new Date(receipt.create_timestamp * 1000),
                                status: receipt.status,
                                productId: product.id,
                                storeId: store.id,
                            },
                        });
                        synced++;
                    }
                }

                offset += limit;
            }

            // Reconcile: drop this store's orders that are no longer in Etsy's
            // active feed (shipped/canceled). notIn [] deletes all when there are
            // zero active orders, which is the correct outcome.
            const removed = await prisma.order.deleteMany({
                where: {
                    storeId: store.id,
                    platform: "etsy",
                    orderId: { notIn: activeOrderIds },
                },
            });

            results.push({ shopId, store: store.name, synced, removed: removed.count, total: total === Infinity ? 0 : total });
        } catch (error) {
            console.error("Etsy orders sync failed:", error);
            results.push({ shopId: tokenRow.shopId, error: "sync failed" });
        }
    }

    return NextResponse.json({ stores: results });
}
