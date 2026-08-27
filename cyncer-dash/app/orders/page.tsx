import prisma from "@/app/lib/prisma"
import Link from "next/link"
import SyncOrderButton from "@/app/components/SyncOrderButton"
export default async function Orders({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { platform, store } = await searchParams;
    const platformFilter = platform as string | undefined;
    const storeId = store ? Number(store) : undefined;

    const where = {
        ...(platformFilter ? { platform: platformFilter } : {}),
        ...(storeId ? { storeId } : {}),
    };

    const [orders, stores] = await Promise.all([
        prisma.order.findMany({ where, include: { product: true }, orderBy: { date: "desc" } }),
        prisma.store.findMany({ orderBy: { name: "asc" } }),
    ]);

    const etsyStores = stores.filter((s) => s.platform === "etsy");
    const amazonStores = stores.filter((s) => s.platform === "amazon");
    const faireStores = stores.filter((s) => s.platform === "faire");

    const selectedStore = stores.find((s) => s.id === storeId);

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Active Orders</h1>
            <p className="text-gray-500 text-sm mb-4">{orders.length} orders</p>
            <SyncOrderButton />

            {/* Consolidated Platform & Store Dropdown Filter Bar */}
            <div className="flex gap-2 mt-4 mb-6 flex-wrap items-center">
                {/* All Orders Button */}
                <Link
                    href="/orders"
                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm ${
                        !platformFilter && !storeId
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
                            href="/orders?platform=etsy"
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

                    {/* Unbreakable Hover Bridge Container */}
                    {etsyStores.length > 0 && (
                        <div className="absolute left-0 top-full pt-1.5 w-52 z-30 hidden group-hover:block group-focus-within:block">
                            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 ring-1 ring-black/5">
                                <Link
                                    href="/orders?platform=etsy"
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
                                        href={`/orders?platform=etsy&store=${s.id}`}
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
                            href="/orders?platform=amazon"
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                                platformFilter === "amazon"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <span>Amazon</span>
                            {platformFilter === "amazon" && selectedStore && (
                                <span className="text-[10px] bg-blue-700 text-white px-1.5 py-0.5 rounded-md font-normal">
                                    {selectedStore.name}
                                </span>
                            )}
                        </Link>
                        {amazonStores.length > 0 && (
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
                        )}
                    </div>

                    {/* Unbreakable Hover Bridge Container */}
                    {amazonStores.length > 0 && (
                        <div className="absolute left-0 top-full pt-1.5 w-52 z-30 hidden group-hover:block group-focus-within:block">
                            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 ring-1 ring-black/5">
                                <Link
                                    href="/orders?platform=amazon"
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                                        platformFilter === "amazon" && !storeId
                                            ? "bg-blue-50 text-blue-700 font-semibold"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <span>All Amazon Stores</span>
                                    <span className="text-[10px] text-gray-400">All</span>
                                </Link>
                                <div className="my-1 border-t border-gray-100" />
                                {amazonStores.map((s) => (
                                    <Link
                                        key={s.id}
                                        href={`/orders?platform=amazon&store=${s.id}`}
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

                {/* Faire Dropdown */}
                <div className="relative group inline-block">
                    <div className="flex items-stretch shadow-sm rounded-lg overflow-hidden border border-gray-300">
                        <Link
                            href="/orders?platform=faire"
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                                platformFilter === "faire"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <span>Faire</span>
                            {platformFilter === "faire" && selectedStore && (
                                <span className="text-[10px] bg-blue-700 text-white px-1.5 py-0.5 rounded-md font-normal">
                                    {selectedStore.name}
                                </span>
                            )}
                        </Link>
                        {faireStores.length > 0 && (
                            <button type="button" className="px-2 py-1.5 border-l text-xs bg-white text-gray-500 border-gray-200">
                                <span aria-hidden="true">⌄</span>
                            </button>
                        )}
                    </div>
                    {faireStores.length > 0 && (
                        <div className="absolute left-0 top-full pt-1.5 w-52 z-30 hidden group-hover:block group-focus-within:block">
                            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 ring-1 ring-black/5">
                                <Link href="/orders?platform=faire" className="flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    <span>All Faire Stores</span><span className="text-[10px] text-gray-400">All</span>
                                </Link>
                                <div className="my-1 border-t border-gray-100" />
                                {faireStores.map((s) => (
                                    <Link key={s.id} href={`/orders?platform=faire&store=${s.id}`} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        <span>{s.name}</span><span className="text-[10px] text-gray-400">Store</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => (
                    <Link href={`/product/${order.productId}`} key={order.id}>
                        <div className="bg-white rounded-lg shadow hover:shadow-md transition p-4">
                            {order.product.images[0] && (
                                <img
                                    src={order.product.images[0]}
                                    alt={order.product.name}
                                    className="w-full h-48 object-cover rounded mb-3"
                                />
                            )}
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-lg truncate">{order.product.name}</h2>
                                {order.platform === "etsy" && (
                                    <img src="/etsy/Etsy_Logo_0.svg" alt="Etsy" className="h-4" />
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{order.orderId}</p>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-sm text-gray-600">Qty: {order.quantity}</span>
                                <span className="text-sm font-semibold">${order.salePrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-400">{order.date.toLocaleDateString()}</span>
                                <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div >
    )
}
