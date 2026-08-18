import prisma from "@/app/lib/prisma"
import Link from "next/link"
import Pagination from "@/app/components/Pagination"

const PAGE_SIZE = 24;

export default async function Product({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { page, store, amazon } = await searchParams;
    const currentPage = Math.max(1, parseInt(page as string) || 1);
    const skip = (currentPage - 1) * PAGE_SIZE;

    const storeId = store ? Number(store) : undefined;
    const amazonStatus = amazon === "active" || amazon === "inactive" ? amazon : undefined;

    const listingFilters = [];
    if (storeId) listingFilters.push({ storeId });
    if (amazonStatus) listingFilters.push({ platform: "amazon", status: amazonStatus });
    const where = listingFilters.length
        ? { AND: listingFilters.map((f) => ({ listings: { some: f } })) }
        : {};

    const [products, totalCount, stores] = await Promise.all([
        prisma.product.findMany({
            where,
            include: { listings: true },
            skip,
            take: PAGE_SIZE,
            orderBy: { id: "asc" },
        }),
        prisma.product.count({ where }),
        prisma.store.findMany({ orderBy: { name: "asc" } }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const selectedStore = stores.find((s) => s.id === storeId);
    const isAmazonSelected = selectedStore?.platform === "amazon";

    const buildHref = (params: { store?: number; amazon?: string }) => {
        const sp = new URLSearchParams();
        if (params.store) sp.set("store", String(params.store));
        if (params.amazon) sp.set("amazon", params.amazon);
        const qs = sp.toString();
        return qs ? `/product?${qs}` : "/product";
    };

    const amazonFilters: { label: string; value?: string }[] = [
        { label: "All", value: undefined },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-2">Products</h1>
            <p className="text-gray-500 mb-4">{totalCount} products | Page {currentPage} of {totalPages}</p>

            {stores.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                    <Link href={buildHref({})} className={`px-3 py-1.5 rounded text-sm font-medium ${!storeId ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>
                        All Stores
                    </Link>
                    {stores.map((s) => (
                        <Link key={s.id} href={buildHref({ store: s.id, amazon: s.platform === "amazon" ? amazonStatus : undefined })} className={`px-3 py-1.5 rounded text-sm font-medium ${storeId === s.id ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>
                            {s.name}
                        </Link>
                    ))}
                </div>
            )}

            {isAmazonSelected && (
                <div className="flex gap-2 mb-6 flex-wrap">
                    {amazonFilters.map((f) => (
                        <Link key={f.label} href={buildHref({ store: storeId, amazon: f.value })} className={`px-3 py-1.5 rounded text-sm font-medium ${amazonStatus === f.value ? "bg-orange-500 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>
                            {f.label}
                        </Link>
                    ))}
                </div>
            )}

            <div className="mb-6">
                <Pagination currentPage={currentPage} totalPages={totalPages} store={store as string | undefined} amazon={amazonStatus} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <Pagination currentPage={currentPage} totalPages={totalPages} store={store as string | undefined} amazon={amazonStatus} />
            </div>
        </div>
    )
}
