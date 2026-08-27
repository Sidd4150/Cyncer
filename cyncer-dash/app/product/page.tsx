import prisma from "@/app/lib/prisma"
import Pagination from "@/app/components/Pagination"
import ProductFilters from "@/app/product/components/ProductFilters"
import ProductGrid from "@/app/product/components/ProductGrid"
import ProductPageHeader from "@/app/product/components/ProductPageHeader"

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

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <ProductPageHeader totalCount={totalCount} currentPage={currentPage} totalPages={totalPages} />

            <ProductFilters
                platformFilter={platformFilter}
                storeId={storeId}
                amazonStatus={amazonStatus}
                stockFilter={stockFilter}
                sortParam={sortParam}
                stores={stores}
            />

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

            <ProductGrid products={products} />

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
