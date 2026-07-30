import { PrismaClient } from "../app/generated/prisma/client";
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
    const product2 = await prisma.product.create({
        data: {
            name: "Himalayan Lokta Paper",
            SKU: "HLP-002",
            desc: "Traditional Nepali lokta bark paper",
            category: "Paper",
            listings: {
                create: [
                    { platform: "amazon", platformId: "ASIN-B00HLP", price: 9.99, quantity: 25, status: "active" },
                    { platform: "etsy", platformId: "ETY-11111", price: 11.99, quantity: 50, status: "active" },
                    { platform: "ebay", platformId: "EBY-22222", price: 8.99, quantity: 30, status: "active" },
                ],
            },
            orders: {
                create: [
                    { platform: "etsy", orderId: "ETY-2001", quantity: 2, salePrice: 11.99, status: "delivered" },
                    { platform: "amazon", orderId: "AMZ-2001", quantity: 1, salePrice: 9.99, status: "shipped" },
                ],
            },
        },
    });

    const product3 = await prisma.product.create({
        data: {
            name: "Flower Pressed Paper",
            SKU: "FPP-003",
            desc: "Handmade paper with real pressed flowers",
            category: "Paper",
            listings: {
                create: [
                    { platform: "etsy", platformId: "ETY-33333", price: 18.99, quantity: 40, status: "active" },
                    { platform: "ebay", platformId: "EBY-44444", price: 16.50, quantity: 15, status: "active" },
                ],
            },
            orders: {
                create: [
                    { platform: "etsy", orderId: "ETY-3001", quantity: 3, salePrice: 18.99, status: "delivered" },
                ],
            },
        },
    });

    const product4 = await prisma.product.create({
        data: {
            name: "Rice Paper Sheets",
            SKU: "RPS-004",
            desc: "Thin translucent rice paper for calligraphy",
            category: "Paper",
            listings: {
                create: [
                    { platform: "amazon", platformId: "ASIN-B00RPS", price: 7.99, quantity: 200, status: "active" },
                    { platform: "etsy", platformId: "ETY-55555", price: 9.49, quantity: 75, status: "active" },
                ],
            },
            orders: {
                create: [
                    { platform: "amazon", orderId: "AMZ-4001", quantity: 5, salePrice: 7.99, status: "delivered" },
                    { platform: "amazon", orderId: "AMZ-4002", quantity: 2, salePrice: 7.99, status: "pending" },
                ],
            },
        },
    });

    console.log(`Seeded: ${product.name}, ${product2.name}, ${product3.name}, ${product4.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
