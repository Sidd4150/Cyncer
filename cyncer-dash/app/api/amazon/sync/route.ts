import { getAccessToken, amazonBase, amazonHeaders } from "@/app/lib/amazonHelpers";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth"

export async function POST() {

    const session = await auth()
    if (!session?.user || session.user.email?.toLowerCase().trim() !== process.env.ALLOWED_EMAIL?.toLowerCase().trim()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = await getAccessToken();
    if (!token) {
        return NextResponse.json({ error: "No Amazon Auth" }, { status: 401 });
    }

    const base = amazonBase();
    const headers = amazonHeaders(token);
    const sellerId = process.env.AMAZON_SELLER_ID!;
    const marketPlaceId = process.env.AMAZON_MARKETPLACE_ID!;

    const items: any[] = [];
    let pageToken: string | undefined = undefined;

    try {
        // 1. Page through all of the seller's listings
        do {
            const url = new URL(`${base}/listings/2021-08-01/items/${sellerId}`);
            url.searchParams.set("marketplaceIds", marketPlaceId);
            url.searchParams.set("includedData", "summaries,offers,fulfillmentAvailability");
            url.searchParams.set("pageSize", "20");
            if (pageToken) {
                url.searchParams.set("pageToken", pageToken);
            }

            const res = await fetch(url, { headers });
            const data = await res.json();
            if (!res.ok) {
                return NextResponse.json({ error: data }, { status: res.status });
            }

            items.push(...(data.items ?? []));
            pageToken = data.pagination?.nextToken;

            // Respect rate limits — space out page requests (searchListingsItems
            // is a low-rate operation; ~500ms keeps us comfortably under the cap)
            if (pageToken) await new Promise((r) => setTimeout(r, 500));
        } while (pageToken);

        // 2. Ensure a Store row for this Amazon seller
        const store = await prisma.store.upsert({
            where: { platform_shopId: { platform: "amazon", shopId: sellerId } },
            update: {},
            create: { platform: "amazon", shopId: sellerId, name: "Amazon" },
        });

        // 3. Upsert each listing into Product + Listing
        let synced = 0;
        for (const item of items) {
            const summary = item.summaries?.[0] ?? {};
            const sku = `AMZN-${item.sku}`;
            const name = summary.itemName ?? item.sku;
            const price = parseFloat(item.offers?.[0]?.price?.amount ?? "0");
            const quantity = item.fulfillmentAvailability?.[0]?.quantity ?? 0;
            const status = summary.status?.includes("BUYABLE") ? "active" : "inactive";
            const images = summary.mainImage?.link ? [summary.mainImage.link] : [];
            const url = summary.asin ? `https://www.amazon.com/dp/${summary.asin}` : null;

            await prisma.product.upsert({
                where: { SKU: sku },
                update: {
                    name,
                    listings: {
                        updateMany: {
                            where: { platformId: item.sku },
                            data: { quantity, price, status, storeId: store.id },
                        },
                    },
                },
                create: {
                    name,
                    SKU: sku,
                    desc: null,
                    category: null,
                    images,
                    listings: {
                        create: {
                            platform: "amazon",
                            platformId: item.sku,
                            url,
                            price,
                            quantity,
                            status,
                            storeId: store.id,
                        },
                    },
                },
            });
            synced++;
        }

        return NextResponse.json({ store: store.name, synced, total: items.length });
    } catch (error) {
        console.error("Amazon listings sync failed:", error);
        return NextResponse.json({ error: "Amazon listings sync failed" }, { status: 500 });
    }
}
