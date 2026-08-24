import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { auth } from "@/auth"
import { getValidToken, ensureStore, etsyHeaders } from "@/app/lib/etsyHelpers";

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
    const results: { shopId: string; store?: string; synced?: number; total?: number; error?: string }[] = [];

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

            while (offset < total) {
                const response = await fetch(
                    `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/active?limit=${limit}&offset=${offset}&includes=images`,
                    { headers: etsyHeaders(token) }
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(`Etsy ${response.status}: ${JSON.stringify(data)}`);
                }

                total = data.count ?? 0;
                if (!data.results?.length) break;

                for (const item of data.results) {
                    const sku = `ETSY-${item.listing_id}`;
                    const price = item.price ? item.price.amount / item.price.divisor : 0;

                    const existing = await prisma.product.findUnique({ where: { SKU: sku } });

                    let images: string[] = [];
                    if (!existing) {
                        // Only fetch images for new products (rate limiting)
                        const imgRes = await fetch(
                            `https://openapi.etsy.com/v3/application/listings/${item.listing_id}/images`,
                            { headers: etsyHeaders() }
                        );
                        const imgData = imgRes.ok ? await imgRes.json() : { results: [] };
                        images = (imgData.results ?? [])
                            .map((img: { url_570xN?: string }) => img.url_570xN)
                            .filter((url): url is string => Boolean(url));
                        await new Promise((r) => setTimeout(r, 250));
                    }

                    await prisma.product.upsert({
                        where: { SKU: sku },
                        update: {
                            name: item.title,
                            listings: {
                                updateMany: {
                                    where: { platformId: String(item.listing_id) },
                                    data: { quantity: item.quantity, price, status: item.state, storeId: store.id },
                                },
                            },
                        },
                        create: {
                            name: item.title,
                            SKU: sku,
                            desc: item.description || null,
                            category: null,
                            images,
                            listings: {
                                create: {
                                    platform: "etsy",
                                    platformId: String(item.listing_id),
                                    url: `https://www.etsy.com/listing/${item.listing_id}`,
                                    price,
                                    quantity: item.quantity,
                                    status: item.state,
                                    storeId: store.id,
                                },
                            },
                        },
                    });
                    synced++;
                }
                offset += limit;
            }

            results.push({ shopId, store: store.name, synced, total: total === Infinity ? 0 : total });
        } catch (error) {
            console.error("Etsy listings sync failed:", error);
            results.push({ shopId: tokenRow.shopId, error: "sync failed" });
        }
    }

    return NextResponse.json({ stores: results });
}
