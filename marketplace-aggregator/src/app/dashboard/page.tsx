import { prisma } from "@/lib/prisma";
import { Platform, OrderStatus } from "@/generated/prisma/client";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { OrdersTable } from "./_components/OrdersTable";
import { PlatformFilter } from "./_components/PlatformFilter";
import { PlatformConnections } from "./_components/PlatformConnections";

const PLATFORM_COLORS: Record<Platform, string> = {
  ETSY: "bg-orange-100 text-orange-800",
  FAIRE: "bg-purple-100 text-purple-800",
  EBAY: "bg-blue-100 text-blue-800",
  AMAZON: "bg-yellow-100 text-yellow-800",
};

type SearchParams = { platform?: string; status?: string };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await auth();
  const { platform, status } = await searchParams;

  const where = {
    ...(platform && platform !== "ALL" ? { platform: platform as Platform } : {}),
    ...(status && status !== "ALL" ? { status: status as OrderStatus } : {}),
  };

  const [orders, counts, totals, etsyConnection] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["platform"],
      _count: { id: true },
    }),
    prisma.order.aggregate({
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.platformConnection.findUnique({
      where: { userId_platform: { userId: userId!, platform: "ETSY" } },
      select: { platform: true, shopName: true, updatedAt: true },
    }),
  ]);

  const platformCounts = Object.fromEntries(
    counts.map((c: { platform: Platform; _count: { id: number } }) => [c.platform, c._count.id])
  );

  const totalOrders = totals._count.id;
  const totalRevenue = totals._sum.total ?? 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Cyncer
          </h1>
          <UserButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Top summary row */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500">Total Orders</p>
            <p className="mt-1 text-4xl font-bold text-zinc-900 dark:text-zinc-50">{totalOrders}</p>
            <p className="mt-1 text-xs text-zinc-400">across all platforms</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500">Total Revenue</p>
            <p className="mt-1 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalRevenue)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">across all platforms</p>
          </div>
        </div>

        {/* Platform stat cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(Object.keys(Platform) as Platform[]).map((p) => (
            <div
              key={p}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_COLORS[p]}`}>
                {p}
              </span>
              <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {platformCounts[p] ?? 0}
              </p>
              <p className="text-sm text-zinc-500">orders</p>
            </div>
          ))}
        </div>

        {/* Platform connections */}
        <PlatformConnections etsy={etsyConnection} />

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <PlatformFilter
            activePlatform={platform ?? "ALL"}
            activeStatus={status ?? "ALL"}
          />
        </div>

        {/* Orders table */}
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <OrdersTable orders={orders} />
        </div>
      </main>
    </div>
  );
}
