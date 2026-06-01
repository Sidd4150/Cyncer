import prisma from "@/app/lib/prisma"
import Link from "next/link"

export default async function Product() {

    const products = await prisma.product.findMany({
        include: { listings: true },
    });

    const totalStock = products.reduce(
        (sum, p) => sum + p.listings.reduce((s, l) => s + l.quantity, 0), 0
    );

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-2">Products</h1>
            <p className="text-gray-500 mb-6">{products.length} products | {totalStock} total stock</p>

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
        </div>
    )
}