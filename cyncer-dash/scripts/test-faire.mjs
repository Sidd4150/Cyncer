async function testFaireProfile() {
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

    // OAuth access tokens require the app credentials as well. A direct API key
    // uses only X-FAIRE-ACCESS-TOKEN.
    if (process.env.FAIRE_TEST_OAUTH === "true") {
        if (!appId || !appSecret) throw new Error("Missing Faire OAuth credentials");
        delete headers["X-FAIRE-ACCESS-TOKEN"];
        headers["X-FAIRE-OAUTH-ACCESS-TOKEN"] = accessToken;
        headers["X-FAIRE-APP-CREDENTIALS"] = Buffer
            .from(`${appId}:${appSecret}`)
            .toString("base64");
    }

    const path = "brands/profile";
    const response = await fetch(
        `https://www.faire.com/external-api/v2/${path}`,
        {
            method: "GET",
            headers,
        }
    );

    const body = await response.text();

    console.log("Status:", response.status);
    console.log("Body:", body);

    if (!response.ok) {
        throw new Error(`Faire API error: ${response.status}`);
    }
}

testFaireProfile().catch(console.error);
