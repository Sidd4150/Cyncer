import { getAccessToken, amazonBase, amazonHeaders } from "@/app/lib/amazonHelpers";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth"
import { isEmailAllowed } from "@/app/lib/authHelpers";

export async function POST(req?: Request) {
    const isCron = Boolean(process.env.CRON_SECRET && req?.headers?.get("authorization") === `Bearer ${process.env.CRON_SECRET}`);
    if (!isCron) {
        const session = await auth()
        if (!isEmailAllowed(session?.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
    }


    const token = await getAccessToken();
    if (!token) {
        return NextResponse.json({ error: "No Amazon Auth" }, { status: 401 });
    }

    const base = amazonBase();
    const headers = amazonHeaders(token);
    const marketPlaceId = process.env.AMAZON_MARKETPLACE_ID;
    const sellerId = process.env.AMAZON_SELLER_ID;

    if (!marketPlaceId || !sellerId) {
        return NextResponse.json(
            { error: "Missing AMAZON_MARKETPLACE_ID or AMAZON_SELLER_ID in .env" },
            { status: 400 }
        );
    }

    // Sandbox only returns mock data for TEST_CASE_200; prod queries real orders from the last 30 days
    const createdAfter = process.env.AMAZON_USE_SANDBOX === "true"
        ? "TEST_CASE_200"
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    interface AmazonOrder {
        AmazonOrderId: string;
        OrderStatus: string;
        PurchaseDate?: string;
    }

    interface AmazonOrderItem {
        OrderItemId: string;
        SellerSKU?: string;
        QuantityOrdered: number;
        ItemPrice?: { Amount?: string };
    }

    const orders: AmazonOrder[] = [];
    let nextToken: string | undefined = undefined;

    try {
        // Ensure a Store row for this Amazon seller
        const store = await prisma.store.upsert({
            where: { platform_shopId: { platform: "amazon", shopId: sellerId } },
            update: {},
            create: { platform: "amazon", shopId: sellerId, name: "Amazon" },
        });

        // 1. Page through active (unshipped) orders with NextToken
        do {
            const url = new URL(`${base}/orders/v0/orders`);
            url.searchParams.set("MarketplaceIds", marketPlaceId);
            if (nextToken) {
                url.searchParams.set("NextToken", nextToken);
            } else {
                url.searchParams.set("CreatedAfter", createdAfter);
                url.searchParams.set("OrderStatuses", "Unshipped,PartiallyShipped");
            }

            const res = await fetch(url, { headers });
            const data = await res.json();
            if (!res.ok) {
                return NextResponse.json({ error: data }, { status: res.status });
            }

            const payload = data.payload ?? {};
            orders.push(...(payload.Orders ?? []));
            nextToken = payload.NextToken;
        } while (nextToken);

        // 2. For each order, fetch its line items and upsert them
        let synced = 0;
        let hasErrors = false;
        const activeOrderIds: string[] = [];

        for (const order of orders) {
            const itemsRes = await fetch(
                `${base}/orders/v0/orders/${order.AmazonOrderId}/orderItems`,
                { headers }
            );
            const itemsData = await itemsRes.json();

            // getOrderItems is a low-rate operation (~0.5 req/sec)
            await new Promise((r) => setTimeout(r, 2000));

            if (!itemsRes.ok) {
                console.error("orderItems failed for", order.AmazonOrderId, itemsData);
                hasErrors = true; // 🛡️ Flag that an error occurred
                continue;
            }

            for (const item of (itemsData.payload?.OrderItems ?? []) as AmazonOrderItem[]) {
                const orderId = `AMZN-${order.AmazonOrderId}-${item.OrderItemId}`;
                activeOrderIds.push(orderId);

                const product = await prisma.product.findUnique({
                    where: { SKU: `AMZN-${item.SellerSKU}` },
                });
                if (!product) continue;

                const salePrice = parseFloat(item.ItemPrice?.Amount ?? "0");

                await prisma.order.upsert({
                    where: { orderId },
                    update: {
                        status: order.OrderStatus,
                        quantity: item.QuantityOrdered,
                        salePrice,
                        storeId: store.id,
                    },
                    create: {
                        platform: "amazon",
                        orderId,
                        quantity: item.QuantityOrdered,
                        salePrice,
                        date: order.PurchaseDate ? new Date(order.PurchaseDate) : new Date(),
                        status: order.OrderStatus,
                        productId: product.id,
                        storeId: store.id,
                    },
                });
                synced++;
            }
        }

        // 3. Reconcile: Drop local active orders that are no longer in Amazon's unshipped feed
        let removedCount = 0;
        if (!hasErrors) {
            const removed = await prisma.order.deleteMany({
                where: {
                    storeId: store.id,
                    platform: "amazon",
                    orderId: { notIn: activeOrderIds },
                },
            });
            removedCount = removed.count;
        }

        return NextResponse.json({
            store: store.name,
            synced,
            removed: removedCount,
            total: orders.length,
            hasErrors,
        });
    } catch (error) {
        console.error("Amazon orders sync failed:", error);
        return NextResponse.json({ error: "Amazon orders sync failed" }, { status: 500 });
    }
}
