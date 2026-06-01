import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    //Clearing existing data ( order matters -delete children first)
    await prisma.order.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.product.deleteMany();

    //Create a product with listings and orders in one go
    const product = await prisma.product.create({
        data: {
            name: "OceanBase Paper",
            SKU: "OBP-001",
            desc: "Handmade ocean base lokta",
            category: "Paper",
            listings: {
                create: [
                    { platform: "amazon", platformId: "ASIN-B00XYZ", price: 12.99, quantity: 10, status: "active" },
                    { platform: "etsy", platformId: "ETY-98765", price: 14.99, quantity: 100, status: "active" },
                ],
            },
            orders: {
                create: [
                    { platform: "amazon", orderId: "AMZ-0001", quantity: 1, salePrice: 12.99, status: "delivered" },
                ],
            },
        },
    });
    console.log(`Seeded: ${product.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
