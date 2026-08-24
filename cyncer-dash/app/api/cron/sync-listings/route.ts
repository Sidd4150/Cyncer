import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isEmailAllowed } from "@/app/lib/authHelpers";
import { POST as syncEtsyListings } from "@/app/api/etsy/sync/route";
import { POST as syncAmazonListings } from "@/app/api/amazon/sync/route";

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

    const [etsyListings, amazonListings] = await Promise.allSettled([
        syncEtsyListings(req),
        syncAmazonListings(req),
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
        type: "listings_sync",
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        results: {
            etsyListings: await parseResult(etsyListings),
            amazonListings: await parseResult(amazonListings),
        },
    };

    return NextResponse.json(summary);
}
