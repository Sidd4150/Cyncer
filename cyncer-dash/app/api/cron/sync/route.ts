import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isEmailAllowed } from "@/app/lib/authHelpers";
import { POST as syncEtsyListings } from "@/app/api/etsy/sync/route";
import { POST as syncEtsyOrders } from "@/app/api/etsy/sync-orders/route";
import { POST as syncAmazonListings } from "@/app/api/amazon/sync/route";
import { POST as syncAmazonOrders } from "@/app/api/amazon/sync-orders/route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const isVercelCron = Boolean(process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`);

    if (!isVercelCron) {
        const session = await auth();
        if (!isEmailAllowed(session?.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const startTime = Date.now();

    // Trigger existing sync endpoints
    const [etsyListings, etsyOrders, amazonListings, amazonOrders] = await Promise.allSettled([
        syncEtsyListings(req),
        syncEtsyOrders(req),
        syncAmazonListings(req),
        syncAmazonOrders(req),
    ]);

    const parseResult = async (result: PromiseSettledResult<Response>) => {
        if (result.status === "rejected") return { error: String(result.reason) };
        try {
            return await result.value.json();
        } catch {
            return { status: result.value.status };
        }
    };

    const summary = {
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        results: {
            etsyListings: await parseResult(etsyListings),
            etsyOrders: await parseResult(etsyOrders),
            amazonListings: await parseResult(amazonListings),
            amazonOrders: await parseResult(amazonOrders),
        },
    };

    return NextResponse.json(summary);
}
