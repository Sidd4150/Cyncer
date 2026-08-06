import { getAccessToken, amazonBase, amazonHeaders } from "@/app/lib/amazonHelpers";
import { NextResponse } from "next/server";

export async function GET() {
    const token = await getAccessToken();
    if (!token) {
        return NextResponse.json({ error: "No Amazon Auth" }, { status: 401 });
    }
    const base = amazonBase();
    const headers = amazonHeaders(token);
    const marketPlaceId = process.env.AMAZON_MARKETPLACE_ID!;

    const createdAfter = process.env.AMAZON_USE_SANDBOX === "true"
        ? "TEST_CASE_200"
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // last 30 days

    const orders: any[] = [];
    let nextToken: string | undefined = undefined;

    try {
        // Page through orders with NextToken
        do {
            const url = new URL(`${base}/orders/v0/orders`);
            url.searchParams.set("MarketplaceIds", marketPlaceId);
            if (nextToken) {
                url.searchParams.set("NextToken", nextToken);
            } else {
                url.searchParams.set("CreatedAfter", createdAfter); // first page only
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

        // For each order, fetch its line items (the N+1)
        for (const order of orders) {
            try {
                const itemsRes = await fetch(
                    `${base}/orders/v0/orders/${order.AmazonOrderId}/orderItems`,
                    { headers }
                );
                const itemsData = await itemsRes.json();
                if (!itemsRes.ok) {
                    console.log("orderItems failed for", order.AmazonOrderId, itemsData);
                    continue;
                }
                const items = (itemsData.payload?.OrderItems ?? []).map((i: any) => ({
                    sku: i.SellerSKU,
                    qty: i.QuantityOrdered,
                    price: i.ItemPrice?.Amount,
                }));
                console.log("Amazon order", order.AmazonOrderId, order.OrderStatus, items);
            } catch (e) {
                console.error("orderItems error for", order.AmazonOrderId, e);
            }
        }

        return NextResponse.json({ fetched: orders.length });
    } catch (error) {
        console.error("Amazon orders sync failed:", error);
        return NextResponse.json({ error: "Amazon orders sync failed" }, { status: 500 });
    }
}
