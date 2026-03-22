import "dotenv/config";
import { PrismaClient, Platform, OrderStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SAMPLE_ORDERS = [
  {
    externalId: "ETSY-10001",
    platform: Platform.ETSY,
    status: OrderStatus.DELIVERED,
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
    total: 42.5,
    createdAt: new Date("2026-03-01"),
    items: [{ name: "Hand-painted ceramic mug", quantity: 1, price: 42.5 }],
  },
  {
    externalId: "ETSY-10002",
    platform: Platform.ETSY,
    status: OrderStatus.PROCESSING,
    customerName: "Bob Lee",
    customerEmail: "bob@example.com",
    total: 128.0,
    createdAt: new Date("2026-03-10"),
    items: [
      { name: "Custom wall art print", quantity: 2, price: 55.0 },
      { name: "Greeting card set", quantity: 1, price: 18.0 },
    ],
  },
  {
    externalId: "FAIRE-50001",
    platform: Platform.FAIRE,
    status: OrderStatus.SHIPPED,
    customerName: "Cedar Boutique",
    customerEmail: "orders@cedarboutique.com",
    total: 320.0,
    createdAt: new Date("2026-03-05"),
    items: [{ name: "Artisan soap set (wholesale)", quantity: 40, price: 8.0 }],
  },
  {
    externalId: "FAIRE-50002",
    platform: Platform.FAIRE,
    status: OrderStatus.PENDING,
    customerName: "The Little Shop",
    customerEmail: "hello@thelittleshop.com",
    total: 180.0,
    createdAt: new Date("2026-03-18"),
    items: [{ name: "Beeswax candles (12-pack)", quantity: 15, price: 12.0 }],
  },
  {
    externalId: "EBAY-7778923",
    platform: Platform.EBAY,
    status: OrderStatus.DELIVERED,
    customerName: "Carlos Mendez",
    customerEmail: "cmendez@example.com",
    total: 59.99,
    createdAt: new Date("2026-02-28"),
    items: [{ name: "Vintage lamp (used)", quantity: 1, price: 59.99 }],
  },
  {
    externalId: "EBAY-7778924",
    platform: Platform.EBAY,
    status: OrderStatus.CANCELLED,
    customerName: "Dana White",
    customerEmail: "dana@example.com",
    total: 22.0,
    createdAt: new Date("2026-03-12"),
    items: [{ name: "Ceramic plant pot", quantity: 2, price: 11.0 }],
  },
  {
    externalId: "AMZ-114-2893-01",
    platform: Platform.AMAZON,
    status: OrderStatus.SHIPPED,
    customerName: "Eva Green",
    customerEmail: "eva@example.com",
    total: 89.95,
    createdAt: new Date("2026-03-08"),
    items: [
      { name: "Scented candle trio", quantity: 1, price: 34.95 },
      { name: "Diffuser set", quantity: 1, price: 55.0 },
    ],
  },
  {
    externalId: "AMZ-114-2893-02",
    platform: Platform.AMAZON,
    status: OrderStatus.PENDING,
    customerName: "Frank Kim",
    customerEmail: "frank@example.com",
    total: 15.49,
    createdAt: new Date("2026-03-20"),
    items: [{ name: "Pressed flower bookmark set", quantity: 1, price: 15.49 }],
  },
];

async function main() {
  console.log("Seeding orders...");

  for (const order of SAMPLE_ORDERS) {
    const { items, ...orderData } = order;
    await prisma.order.upsert({
      where: { platform_externalId: { platform: orderData.platform, externalId: orderData.externalId } },
      update: {},
      create: {
        ...orderData,
        items: { create: items },
      },
    });
  }

  console.log(`Seeded ${SAMPLE_ORDERS.length} orders.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
