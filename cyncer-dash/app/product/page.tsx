import prisma from "@/app/lib/prisma"
import Link from "next/link"
import Pagination from "@/app/components/Pagination"
import SyncListingButton from "@/app/components/SyncListingButton"

const PAGE_SIZE = 24;

export default async function Product({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { page, platform, store, amazon, stock, sort } = await searchParams;
    const currentPage = Math.max(1, parseInt(page as string) || 1);
    const skip = (currentPage - 1) * PAGE_SIZE;

    const platformFilter = platform as string | undefined;
    const storeId = store ? Number(store) : undefined;
    const amazonStatus = amazon === "active" || amazon === "inactive" ? amazon : undefined;
    const stockFilter = typeof stock === "string" ? stock : undefined;
    const sortParam = typeof sort === "string" ? sort : undefined;

    const listingFilters: Record<string, unknown>[] = [];
    if (storeId) {
        listingFilters.push({ storeId });
    } else if (platformFilter) {
        listingFilters.push({ platform: platformFilter });
    }
    if (amazonStatus) listingFilters.push({ platform: "amazon", status: amazonStatus });
    if (stockFilter === "low") {
        listingFilters.push({ quantity: { gt: 0, lte: 3 } });
    } else if (stockFilter === "out") {
        listingFilters.push({ quantity: { lte: 0 } });
    } else if (stockFilter === "in") {
        listingFilters.push({ quantity: { gt: 0 } });
    }

    const where = listingFilters.length
        ? { AND: listingFilters.map((f) => ({ listings: { some: f } })) }
        : {};

    const [products, totalCount, stores] = await Promise.all([
        prisma.product.findMany({
            where,
            include: { listings: true },
            skip,
            take: PAGE_SIZE,
            orderBy: sortParam === "recent" ? { id: "desc" } : { id: "asc" },
        }),
        prisma.product.count({ where }),
        prisma.store.findMany({ orderBy: { name: "asc" } }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const etsyStores = stores.filter((s) => s.platform === "etsy");
    const amazonStores = stores.filter((s) => s.platform === "amazon");
    const selectedStore = stores.find((s) => s.id === storeId);

    const buildHref = (params: { platform?: string; store?: number; amazon?: string; stock?: string; sort?: string }) => {
        const sp = new URLSearchParams();
        if (params.platform) sp.set("platform", params.platform);
        if (params.store) sp.set("store", String(params.store));
        if (params.amazon) sp.set("amazon", params.amazon);
        if (params.stock) sp.set("stock", params.stock);
        if (params.sort) sp.set("sort", params.sort);
        const qs = sp.toString();
        return qs ? `/product?${qs}` : "/product";
    };

    const stockFilters: { label: string; value?: string }[] = [
        { label: "All Stock", value: undefined },
        { label: "In Stock (> 0)", value: "in" },
        { label: "Low Stock (≤ 3)", value: "low" },
        { label: "Out of Stock (0)", value: "out" },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1">Products</h1>
                    <p className="text-gray-500 text-sm">{totalCount} products | Page {currentPage} of {totalPages}</p>
                </div>
                <SyncListingButton />
            </div>

            {/* Consolidated Platform & Filter Suite Bar */}
            <div className="flex gap-2 mb-6 flex-wrap items-center">
                {/* All Platform Pill */}
                <Link
                    href={buildHref({ stock: stockFilter, sort: sortParam })}
                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm ${
                        !platformFilter && !storeId && !amazonStatus
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                >
                    All
                </Link>

                {/* Etsy Dropdown */}
                <div className="relative group inline-block">
                    <div className="flex items-stretch shadow-sm rounded-lg overflow-hidden border border-gray-300">
                        <Link
                            href={buildHref({ platform: "etsy", stock: stockFilter, sort: sortParam })}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                                platformFilter === "etsy"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <span>Etsy</span>
                            {platformFilter === "etsy" && selectedStore && (
                                <span className="text-[10px] bg-blue-700 text-white px-1.5 py-0.5 rounded-md font-normal">
                                    {selectedStore.name}
                                </span>
                            )}
                        </Link>
                        {etsyStores.length > 0 && (
                            <button
                                type="button"
                                className={`px-2 py-1.5 border-l text-xs transition flex items-center justify-center ${
                                    platformFilter === "etsy"
                                        ? "bg-blue-600 text-white border-blue-500 hover:bg-blue-700"
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                <svg
                                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Unbreakable Hover Bridge */}
                    {etsyStores.length > 0 && (
                        <div className="absolute left-0 top-full pt-1.5 w-52 z-30 hidden group-hover:block group-focus-within:block">
                            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 ring-1 ring-black/5">
                                <Link
                                    href={buildHref({ platform: "etsy", stock: stockFilter, sort: sortParam })}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                                        platformFilter === "etsy" && !storeId
                                            ? "bg-blue-50 text-blue-700 font-semibold"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <span>All Etsy Stores</span>
                                    <span className="text-[10px] text-gray-400">All</span>
                                </Link>
                                <div className="my-1 border-t border-gray-100" />
                                {etsyStores.map((s) => (
                                    <Link
                                        key={s.id}
                                        href={buildHref({ platform: "etsy", store: s.id, stock: stockFilter, sort: sortParam })}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                                            storeId === s.id
                                                ? "bg-blue-50 text-blue-700 font-semibold"
                                                : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span>{s.name}</span>
                                        <span className="text-[10px] text-gray-400">Shop</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Amazon Dropdown */}
                <div className="relative group inline-block">
                    <div className="flex items-stretch shadow-sm rounded-lg overflow-hidden border border-gray-300">
                        <Link
                            href={buildHref({ platform: "amazon", stock: stockFilter, sort: sortParam })}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                                platformFilter === "amazon"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <span>Amazon</span>
                            {platformFilter === "amazon" && (amazonStatus || selectedStore) && (
                                <span className="text-[10px] bg-blue-700 text-white px-1.5 py-0.5 rounded-md font-normal">
                                    {amazonStatus ? (amazonStatus === "active" ? "Active" : "Inactive") : selectedStore?.name}
                                </span>
                            )}
                        </Link>
                        <button
                            type="button"
                            className={`px-2 py-1.5 border-l text-xs transition flex items-center justify-center ${
                                platformFilter === "amazon"
                                    ? "bg-blue-600 text-white border-blue-500 hover:bg-blue-700"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            <svg
                                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Unbreakable Hover Bridge */}
                    <div className="absolute left-0 top-full pt-1.5 w-52 z-30 hidden group-hover:block group-focus-within:block">
                        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 ring-1 ring-black/5">
                            <Link
                                href={buildHref({ platform: "amazon", stock: stockFilter, sort: sortParam })}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                                    platformFilter === "amazon" && !amazonStatus && !storeId
                                        ? "bg-blue-50 text-blue-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <span>All Amazon</span>
                                <span className="text-[10px] text-gray-400">All</span>
                            </Link>
                            <div className="my-1 border-t border-gray-100" />
                            <Link
                                href={buildHref({ platform: "amazon", amazon: "active", stock: stockFilter, sort: sortParam })}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                                    amazonStatus === "active"
                                        ? "bg-orange-50 text-orange-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <span>Active Listings</span>
                                <span className="text-[10px] text-green-600 font-medium">Buyable</span>
                            </Link>
                            <Link
                                href={buildHref({ platform: "amazon", amazon: "inactive", stock: stockFilter, sort: sortParam })}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                                    amazonStatus === "inactive"
                                        ? "bg-orange-50 text-orange-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <span>Inactive Listings</span>
                                <span className="text-[10px] text-gray-400 font-medium">Paused</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* eBay Tab */}
                <Link
                    href={buildHref({ platform: "ebay", stock: stockFilter, sort: sortParam })}
                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm ${
                        platformFilter === "ebay"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                >
                    eBay
                </Link>

                <span className="text-gray-300 mx-1 hidden sm:inline">|</span>

                {/* Stock Dropdown */}
                <div className="relative group inline-block">
                    <div className="flex items-stretch shadow-sm rounded-lg overflow-hidden border border-gray-300">
                        <Link
                            href={buildHref({ platform: platformFilter, store: storeId, amazon: amazonStatus, sort: sortParam })}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                                stockFilter
                                    ? "bg-gray-800 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <span>
                                {stockFilter === "in"
                                    ? "In Stock (>0)"
                                    : stockFilter === "low"
                                    ? "Low Stock (≤3)"
                                    : stockFilter === "out"
                                    ? "Out of Stock (0)"
                                    : "All Stock"}
                            </span>
                        </Link>
                        <button
                            type="button"
                            className={`px-2 py-1.5 border-l text-xs transition flex items-center justify-center ${
                                stockFilter
                                    ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-900"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            <svg
                                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Unbreakable Hover Bridge */}
                    <div className="absolute left-0 top-full pt-1.5 w-48 z-30 hidden group-hover:block group-focus-within:block">
                        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 ring-1 ring-black/5">
                            <Link
                                href={buildHref({ platform: platformFilter, store: storeId, amazon: amazonStatus, sort: sortParam })}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                                    !stockFilter
                                        ? "bg-gray-100 text-gray-900 font-semibold"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <span>All Stock</span>
                                <span className="text-[10px] text-gray-400">Any</span>
                            </Link>
                            <div className="my-1 border-t border-gray-100" />
                            <Link
                                href={buildHref({ platform: platformFilter, store: storeId, amazon: amazonStatus, stock: "in", sort: sortParam })}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                                    stockFilter === "in"
                                        ? "bg-green-50 text-green-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <span>In Stock</span>
                                <span className="text-[10px] text-green-600 font-medium">&gt; 0</span>
                            </Link>
                            <Link
                                href={buildHref({ platform: platformFilter, store: storeId, amazon: amazonStatus, stock: "low", sort: sortParam })}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                                    stockFilter === "low"
                                        ? "bg-amber-50 text-amber-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <span>Low Stock</span>
                                <span className="text-[10px] text-amber-600 font-medium">≤ 3</span>
                            </Link>
                            <Link
                                href={buildHref({ platform: platformFilter, store: storeId, amazon: amazonStatus, stock: "out", sort: sortParam })}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                                    stockFilter === "out"
                                        ? "bg-red-50 text-red-700 font-semibold"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <span>Out of Stock</span>
                                <span className="text-[10px] text-red-600 font-medium">0</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <span className="text-gray-300 mx-1 hidden sm:inline">|</span>

                {/* Recently Added Sort */}
                <Link
                    href={buildHref({ platform: platformFilter, store: storeId, amazon: amazonStatus, stock: stockFilter, sort: sortParam === "recent" ? undefined : "recent" })}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm ${
                        sortParam === "recent"
                            ? "bg-purple-700 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                >
                    Recently Added
                </Link>
            </div>

            <div className="mb-6">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    platform={platformFilter}
                    store={store as string | undefined}
                    amazon={amazonStatus}
                    stock={stockFilter}
                    sort={sortParam}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => {
                    const stock = product.listings.reduce((sum, l) => sum + l.quantity, 0);
                    return (
                        <Link href={`/product/${product.id}`} key={product.id}>
                            <div className="bg-white rounded-lg shadow hover:shadow-md transition p-4">
                                {product.images[0] && (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-48 object-cover rounded mb-3"
                                    />
                                )}
                                <h2 className="font-semibold text-lg truncate">{product.name}</h2>
                                <p className="text-sm text-gray-500 mt-1">{product.SKU}</p>
                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-sm text-gray-600">{stock} in stock</span>
                                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {product.listings.length} platform{product.listings.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-8">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    platform={platformFilter}
                    store={store as string | undefined}
                    amazon={amazonStatus}
                    stock={stockFilter}
                    sort={sortParam}
                />
            </div>
        </div>
    );
}
