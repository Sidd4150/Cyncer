

export async function checkReceiptStatus(receiptId: string, headers: Record<string, string>) {
    const shopId = process.env.ETSY_SHOP_ID;
    const res = await fetch(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/receipts/${receiptId}`,
        { headers }
    );
    const data = await res.json();
    console.log("This is the checkRecepit", { data })
    return data;
}