import { auth } from "@/auth";
import { isEmailAllowed } from "@/app/lib/authHelpers";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

type Money = { amount_minor?: number };

type FaireOrderItem = {
    id?: string;
    product_id?: string;
    product_option_id?: string;
    product_variant_id?: string;
    variant_id?: string;
    sku?: string;
    quantity?: number;
    price_cents?: number;
    wholesale_price_cents?: number;
    price?: Money;
    wholesale_price?: Money;
    product?: { id?: string };
    variant?: { id?: string; sku?: string };
};

type FaireOrder = {
    id: string;
    created_at?: string;
    updated_at?: string;
    state: string;
    items?: FaireOrderItem[];
};

type FaireOrdersResponse = {
    orders?: FaireOrder[];
    cursor?: string;
};

const ACTIVE_FAIRE_ORDER_STATES = new Set(["NEW", "PROCESSING"]);
const EXCLUDED_FAIRE_ORDER_STATES = [
    "PRE_TRANSIT",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELED",
    "BACKORDERED",
    "PENDING_RETAILER_CONFIRMATION",
].join(",");

export async function POST(req: Request) {
    const isCron = Boolean(
        process.env.CRON_SECRET &&
        req?.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`,
    );

    if (!isCron) {
        const session = await auth();
        if (!isEmailAllowed(session?.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const token = process.env.FAIRE_API_KEY || process.env.FAIRE_ACCESS_TOKEN;
    if (!token) {
        return NextResponse.json({ error: "No Faire API key found in .env" }, { status: 401 });
    }

    const store = await prisma.store.findFirst({ where: { platform: "faire" } });
    if (!store) {
        return NextResponse.json(
            { error: "Faire store not found. Connect the Faire store first." },
            { status: 404 },
        );
    }

    const headers = {
        Accept: "application/json",
        "X-FAIRE-ACCESS-TOKEN": token,
    };

    const activeOrderIds: string[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | undefined;
    let pages = 0;
    let totalOrders = 0;
    let synced = 0;
    let hasErrors = false;

    try {
        while (true) {
            const url = new URL("https://www.faire.com/external-api/v2/orders");
            if (cursor) {
                url.searchParams.set("cursor", cursor);
            } else {
                url.searchParams.set("page", "1");
                url.searchParams.set("limit", "50");
                url.searchParams.set("excluded_states", EXCLUDED_FAIRE_ORDER_STATES);
            }

            const response = await fetch(url, { headers });
            const data = await response.json() as FaireOrdersResponse;

            if (!response.ok) {
                throw new Error(`Faire ${response.status}: ${JSON.stringify(data)}`);
            }

            const pageOrders = Array.isArray(data.orders) ? data.orders : [];
            const orders = pageOrders.filter((order) => ACTIVE_FAIRE_ORDER_STATES.has(order.state));
            pages++;
            totalOrders += orders.length;

            for (const order of orders) {
                for (const [itemIndex, item] of (order.items ?? []).entries()) {
                    const platformIds = [
                        item.product_option_id,
                        item.product_variant_id,
                        item.variant_id,
                        item.variant?.id,
                        item.product_id,
                        item.product?.id,
                    ].filter((id): id is string => Boolean(id));

                    const listing = platformIds.length > 0
                        ? await prisma.listing.findFirst({
                            where: {
                                platform: "faire",
                                platformId: { in: platformIds },
                                storeId: store.id,
                            },
                            include: { product: true },
                        })
                        : null;

                    const sku = item.sku || item.variant?.sku;
                    const product = listing?.product || (sku
                        ? await prisma.product.findUnique({ where: { SKU: sku } })
                        : null);

                    if (!product) {
                        hasErrors = true;
                        console.warn("[Faire Orders] Product not found for order item", {
                            orderId: order.id,
                            itemId: item.id,
                            sku,
                            platformIds,
                        });
                        continue;
                    }

                    const itemId = item.id || platformIds[0] || String(itemIndex);
                    const orderId = `FAIRE-${order.id}-${itemId}`;
                    const quantity = item.quantity ?? 0;
                    const amountMinor =
                        item.wholesale_price?.amount_minor ??
                        item.price?.amount_minor ??
                        item.wholesale_price_cents ??
                        item.price_cents ??
                        0;
                    const salePrice = amountMinor / 100;
                    const dateValue = order.created_at || order.updated_at;

                    activeOrderIds.push(orderId);
                    await prisma.order.upsert({
                        where: { orderId },
                        update: {
                            status: order.state,
                            quantity,
                            salePrice,
                            productId: product.id,
                            storeId: store.id,
                        },
                        create: {
                            platform: "faire",
                            orderId,
                            quantity,
                            salePrice,
                            date: dateValue ? new Date(dateValue) : new Date(),
                            status: order.state,
                            productId: product.id,
                            storeId: store.id,
                        },
                    });
                    synced++;
                }
            }

            console.log(`[Faire Orders] Synced page ${pages}: ${orders.length} active orders`);

            const nextCursor = typeof data.cursor === "string" && data.cursor.length > 0
                ? data.cursor
                : undefined;
            if (!nextCursor || pageOrders.length === 0) break;
            if (seenCursors.has(nextCursor)) {
                throw new Error("Faire returned a repeated orders pagination cursor");
            }
            seenCursors.add(nextCursor);
            cursor = nextCursor;
        }

        let removed = 0;
        if (!hasErrors) {
            const result = await prisma.order.deleteMany({
                where: {
                    platform: "faire",
                    storeId: store.id,
                    orderId: { notIn: activeOrderIds },
                },
            });
            removed = result.count;
        }

        return NextResponse.json({
            store: store.name,
            pages,
            total: totalOrders,
            synced,
            removed,
            hasErrors,
        });
    } catch (error) {
        console.error("Faire orders sync failed:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Faire orders sync failed" },
            { status: 500 },
        );
    }
}
