import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isEmailAllowed } from "@/app/lib/authHelpers";
import prisma from "@/app/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!isEmailAllowed(session?.user?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appId = process.env.FAIRE_ID;
    const appSecret = process.env.FAIRE_SECRET;
    const accessToken = process.env.FAIRE_API_KEY;

    // if (!appId || !appSecret || !accessToken) {
    //     throw new Error("Missing Faire credentials");
    // }

    if (!accessToken) throw new Error("Missing FAIRE_API_KEY");

    const headers = {
        "Accept": "application/json",
        "X-FAIRE-ACCESS-TOKEN": accessToken,
    };

    const path = "brands/profile";
    const response = await fetch(
        `https://www.faire.com/external-api/v2/${path}`,
        {
            method: "GET",
            headers,
        }
    );

    const body = await response.json();

    if (!response.ok) {
        return NextResponse.json(
            { error: "Faire authentication failed", details: body },
            { status: response.status },
        );
    }
    const name = body.name;
    const shopId = body.brand_id

    await prisma.store.upsert({
        where: { platform_shopId: { platform: "faire", shopId } },
        update: { name },
        create: { platform: "faire", shopId, name },
    });

    return NextResponse.json({
        connected: true,
        shopId,
        name,
    });


}
