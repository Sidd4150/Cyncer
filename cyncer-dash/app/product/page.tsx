import prisma from "@/app/lib/prisma"
import Link from "next/link"

const PAGE_SIZE = 24;

export default async function Product({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { page } = await searchParams;
    const currentPage = Math.max(1, parseInt(page as string) || 1);
    const skip = (currentPage - 1) * PAGE_SIZE;

    const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
            include: { listings: true },
            skip,
            take: PAGE_SIZE,
            orderBy: { id: "asc" },
        }),
        prisma.product.count(),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const totalStock = products.reduce(
        (sum, p) => sum + p.listings.reduce((s, l) => s + l.quantity, 0), 0
    );

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-2">Products</h1>
            <p className="text-gray-500 mb-4">{totalCount} products | Page {currentPage} of {totalPages}</p>

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

            <div className="flex justify-center gap-4 mt-8">
                {currentPage > 1 && (
                    <Link
                        href={`/product?page=${currentPage - 1}`}
                        className="px-4 py-2 bg-white rounded shadow hover:shadow-md"
                    >
                        Previous
                    </Link>
                )}
                {currentPage < totalPages && (
                    <Link
                        href={`/product?page=${currentPage + 1}`}
                        className="px-4 py-2 bg-white rounded shadow hover:shadow-md"
                    >
                        Next
                    </Link>
                )}
            </div>
        </div>
    )
}