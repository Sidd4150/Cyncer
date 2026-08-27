import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isEmailAllowed } from "@/app/lib/authHelpers";
import prisma from "@/app/lib/prisma";

export async function GET(req: Request) {
    const isCron = Boolean(process.env.CRON_SECRET && req?.headers?.get("authorization") === `Bearer ${process.env.CRON_SECRET}`);
    if (!isCron) {
        const session = await auth();
        if (!isEmailAllowed(session?.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const token = process.env.FAIRE_API_KEY || process.env.FAIRE_ACCESS_TOKEN;
    if (!token) {
        return NextResponse.json({ error: "No API KEY for Faire stores found in .env" }, { status: 401 });
    }


    try {
        const store = await prisma.store.findFirst({
            where: { platform: "faire" },
        });

        if (!store) {
            return NextResponse.json(
                { error: "Faire store not found. Connect the Faire store first." },
                { status: 404 },
            );
        }

        const limit = 50;
        const seenCursors = new Set<string>();
        let cursor: string | undefined;
        let pages = 0;
        let totalProducts = 0;
        let syncedVariants = 0;

        while (true) {
            const url = new URL("https://www.faire.com/external-api/v2/products");
            if (cursor) {
                // Faire's cursor contains the original query state, so it must
                // not be combined with page, limit, or filter parameters.
                url.searchParams.set("cursor", cursor);
            } else {
                url.searchParams.set("page", "1");
                url.searchParams.set("limit", String(limit));
                url.searchParams.set("include_deleted", "false");
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent": "Cyncer/1.0",
                    "Accept": "application/json",
                    "X-FAIRE-ACCESS-TOKEN": token,
                },
            });

            if (!response.ok) {
                return NextResponse.json(
                    { error: `Faire ${response.status}`, page: pages + 1 },
                    { status: response.status },
                );
            }

            const data = await response.json();
            const pageProducts = Array.isArray(data.products) ? data.products : [];
            pages++;
            totalProducts += pageProducts.length;

            for (const prod of pageProducts) {
            for (const variant of prod.variants ?? []) {
                const imageUrls = new Set<string>();
                const sourceImages = variant.images?.length > 0
                    ? variant.images
                    : (prod.images ?? []);

                for (const image of sourceImages) {
                    if (typeof image.url !== "string" || image.url.trim() === "") {
                        console.warn("[Faire Image] Image is missing a URL", {
                            productId: prod.id,
                            productName: prod.name,
                            variantId: variant.id,
                            imageId: image.id,
                            originalUrl: image.original_url,
                        });
                        continue;
                    }

                    try {
                        const parsedUrl = new URL(image.url);
                        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                            throw new Error(`Unsupported protocol: ${parsedUrl.protocol}`);
                        }
                        imageUrls.add(image.url);
                    } catch (error) {
                        console.warn("[Faire Image] Invalid image URL", {
                            productId: prod.id,
                            productName: prod.name,
                            variantId: variant.id,
                            imageId: image.id,
                            url: image.url,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }

                const images = Array.from(imageUrls);
                if (images.length === 0) {
                    console.warn("[Faire Image] Variant and product have no usable images", {
                        productId: prod.id,
                        productName: prod.name,
                        variantId: variant.id,
                        variantSku: variant.sku,
                    });
                }

                const name = prod.name
                const SKU = variant.sku || `FAIRE-${variant.id}`
                const desc = prod.description
                const wholesalePrice =
                    variant.prices?.find(
                        (regionalPrice: { wholesale_price?: { currency?: string } }) =>
                            regionalPrice.wholesale_price?.currency === "USD",
                    )?.wholesale_price ?? variant.prices?.[0]?.wholesale_price
                const price = (wholesalePrice?.amount_minor ?? 0) / 100
                const quantity = variant.available_quantity ?? 0
                const status =
                    variant.sale_state ??
                    prod.sale_state ??
                    variant.lifecycle_state ??
                    prod.lifecycle_state ??
                    "UNPUBLISHED"
                const category = prod.taxonomy_type?.name ?? null

                await prisma.product.upsert({
                    where: { SKU: SKU },
                    update: {
                        name: name,
                        desc: desc || null,
                        category,
                        images,
                        listings: {
                            updateMany: {
                                where: {
                                    platformId: String(variant.id)
                                },
                                data: {
                                    quantity,
                                    price,
                                    status,
                                    storeId: store.id,
                                },
                            },
                        },
                    }, create: {
                        name: name,
                        SKU: SKU,
                        desc: desc || null,
                        category,
                        images,
                        listings: {
                            create: {
                                platform: "faire",
                                platformId: String(variant.id),
                                url: `https://www.faire.com/brand-portal`,
                                price,
                                quantity,
                                status,
                                storeId: store.id,
                            },
                        },
                    },
                });
                syncedVariants++;
            }


            }

            console.log(`[Faire] Synced page ${pages}: ${pageProducts.length} products`);

            const nextCursor = typeof data.cursor === "string" && data.cursor.length > 0
                ? data.cursor
                : undefined;

            if (!nextCursor || pageProducts.length === 0) break;
            if (seenCursors.has(nextCursor)) {
                throw new Error("Faire returned a repeated pagination cursor");
            }

            seenCursors.add(nextCursor);
            cursor = nextCursor;
        }

        return NextResponse.json({
            store: store.name,
            pages,
            products: totalProducts,
            synced: syncedVariants,
        });
    } catch (error: unknown) {
        console.error("Faire sync error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Faire listings sync failed" },
            { status: 500 },
        );
    }
}
