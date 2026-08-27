import Link from "next/link";

type Store = {
    id: number;
    platform: string;
    name: string;
};

type ProductFiltersProps = {
    platformFilter?: string;
    storeId?: number;
    amazonStatus?: "active" | "inactive";
    stockFilter?: string;
    sortParam?: string;
    stores: Store[];
};

export default function ProductFilters({
    platformFilter,
    storeId,
    amazonStatus,
    stockFilter,
    sortParam,
    stores,
}: ProductFiltersProps) {
    const etsyStores = stores.filter((s) => s.platform === "etsy");
    const faireStores = stores.filter((s) => s.platform === "faire");
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

    return (
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
        
        {/* Faire Dropdown */}
        <div className="relative group inline-block">
        <div className="flex items-stretch shadow-sm rounded-lg overflow-hidden border border-gray-300">
        <Link
        href={buildHref({ platform: "faire", stock: stockFilter, sort: sortParam })}
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
        <button
        type="button"
        className={`px-2 py-1.5 border-l text-xs transition flex items-center justify-center ${
        platformFilter === "faire"
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

        {faireStores.length > 0 && (
        <div className="absolute left-0 top-full pt-1.5 w-52 z-30 hidden group-hover:block group-focus-within:block">
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 ring-1 ring-black/5">
        <Link
        href={buildHref({ platform: "faire", stock: stockFilter, sort: sortParam })}
        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
        platformFilter === "faire" && !storeId
        ? "bg-blue-50 text-blue-700 font-semibold"
        : "text-gray-700 hover:bg-gray-50"
        }`}
        >
        <span>All Faire Stores</span>
        <span className="text-[10px] text-gray-400">All</span>
        </Link>
        <div className="my-1 border-t border-gray-100" />
        {faireStores.map((s) => (
        <Link
        key={s.id}
        href={buildHref({ platform: "faire", store: s.id, stock: stockFilter, sort: sortParam })}
        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
        storeId === s.id
        ? "bg-blue-50 text-blue-700 font-semibold"
        : "text-gray-700 hover:bg-gray-50"
        }`}
        >
        <span>{s.name}</span>
        <span className="text-[10px] text-gray-400">Store</span>
        </Link>
        ))}
        </div>
        </div>
        )}
        </div>
        
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
    );
}
