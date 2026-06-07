import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getValidToken } from "@/app/lib/etsyHelpers";

export async function GET(request: NextRequest) {
    const token = await getValidToken("etsy", process.env.ETSY_SHOP_ID!);

    if (!token) {
        return NextResponse.json({ error: "No auth, visit api/etsy/auth to verify" }, { status: 401 });
    }
    // Need to not Hard code
    const shopId = process.env.ETSY_SHOP_ID;
    const limit = 100;
    let offset = 0;
    let total = Infinity;
    let synced = 0;

    while (offset < total) {
        const response = await fetch(
            `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/active?limit=${limit}&offset=${offset}&includes=images`,
            {
                headers: {
                    "x-api-key": `${process.env.ETSY_API_KEY}:${process.env.ETSY_SHARED_SECRET}`,
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data, synced }, { status: response.status });
        }

        total = data.count;

        for (const item of data.results) {
            const sku = `ETSY-${item.listing_id}`;
            const price = item.price?.amount / item.price?.divisor;

            const existing = await prisma.product.findUnique({ where: { SKU: sku } });

            let images: string[] = [];
            if (!existing) {
                // Only fetch images for new products
                const imgRes = await fetch(
                    `https://openapi.etsy.com/v3/application/listings/${item.listing_id}/images`,
                    {
                        headers: {
                            "x-api-key": `${process.env.ETSY_API_KEY}:${process.env.ETSY_SHARED_SECRET}`,
                        },
                    }
                );
                const imgData = imgRes.ok ? await imgRes.json() : { results: [] };
                images = imgData.results?.map((img: any) => img.url_570xN) || [];
                await new Promise(r => setTimeout(r, 250));
            }

            await prisma.product.upsert({
                where: { SKU: sku },
                update: {
                    name: item.title,
                    listings: {
                        updateMany: {
                            where: { platformId: String(item.listing_id) },
                            data: { quantity: item.quantity, price, status: item.state },
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
                        },
                    },
                },
            });
            synced++;
        }

        offset += limit;
    }

    return NextResponse.json({ synced, total });
}