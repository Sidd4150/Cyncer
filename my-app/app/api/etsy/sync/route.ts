import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
    const token = request.cookies.get("etsy_access_token")?.value;

    if (!token) {
        return NextResponse.json({ error: "No auth, visit api/etsy/auth to verify" }, { status: 401 });
    }

    const shopId = process.env.ETSY_SHOP_ID;

    const response = await fetch(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/active?limit=25&includes=images`,
        {
            headers: {
                "x-api-key": `${process.env.ETSY_API_KEY}:${process.env.ETSY_SHARED_SECRET}`,
                Authorization: `Bearer ${token}`,
            },
        }
    );
    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json({ error: data }, { status: response.status });
    }

    let synced = 0;

    for (const item of data.results) {
        const sku = `ETSY-${item.listing_id}`;
        const price = item.price?.amount / item.price?.divisor;
        const images = item.images?.map((img: any) => img.url_fullxfull) || [];

        await prisma.product.upsert({
            where: { SKU: sku },
            update: {
                name: item.title,
                images,
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

    return NextResponse.json({ synced, total: data.count });
}