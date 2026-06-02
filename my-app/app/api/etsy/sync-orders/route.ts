import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
    const token = request.cookies.get("etsy_access_token")?.value;

    if (!token) {
        return NextResponse.json({ error: "No auth, visit api/etsy/auth to verify" }, { status: 401 });
    }
    const shopId = process.env.ETSY_SHOP_ID;
    const response = await fetch(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/receipts?was_paid=true&was_shipped=false&was_canceled=false`,
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

    for (const receipt of data.results) {
        for (const txn of receipt.transactions) {
            const sku = `ETSY-${txn.listing_id}`;
            const product = await prisma.product.findUnique({ where: { SKU: sku } });

            if (!product) continue;

            await prisma.order.upsert({
                where: { orderId: `ETSY-${receipt.receipt_id}-${txn.transaction_id}` },
                update: {
                    status: receipt.status,
                    quantity: txn.quantity,
                    salePrice: txn.price.amount / txn.price.divisor,
                },
                create: {
                    platform: "etsy",
                    orderId: `ETSY-${receipt.receipt_id}-${txn.transaction_id}`,
                    quantity: txn.quantity,
                    salePrice: txn.price.amount / txn.price.divisor,
                    date: new Date(receipt.create_timestamp * 1000),
                    status: receipt.status,
                    productId: product.id,
                },
            });
            synced++;
        }
    }

    return NextResponse.json({ synced, total: data.count });

}