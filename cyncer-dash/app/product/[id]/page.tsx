import prisma from "@/app/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const productId = Number(id);

    if (Number.isNaN(productId)) {
        notFound();
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { listings: true, orders: true },
    });

    if (!product) {
        notFound();
    }

    const totalStock = product.listings.reduce((sum, l) => sum + l.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <Link href="/product" className="text-blue-600 hover:underline text-sm inline-block mb-3">&larr; Back to Products</Link>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                {product.images[0] && (
                    <div className="flex gap-3 overflow-x-auto pb-2 mb-4 snap-x">
                        {product.images.map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`${product.name} ${i + 1}`}
                                className="h-48 sm:h-64 rounded shadow object-cover flex-shrink-0 snap-center"
                            />
                        ))}
                    </div>
                )}

                <h1 className="text-xl sm:text-2xl font-bold">{product.name}</h1>
                <p className="text-gray-500 text-sm mt-1">{product.SKU}</p>
                {product.desc && (
                    <p className="text-gray-700 text-sm sm:text-base mt-3 line-clamp-4">{product.desc}</p>
                )}

                <div className="flex gap-3 mt-4 flex-wrap">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs sm:text-sm font-medium">
                        {totalStock} total stock
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs sm:text-sm font-medium">
                        {product.orders.length} orders
                    </span>
                </div>
            </div>

            <h2 className="text-lg sm:text-xl font-semibold mt-6 sm:mt-8 mb-3">Platforms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.listings.map((l) => (
                    <div key={l.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                        <div>
                            <span className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{l.platform}</span>
                            <p className="text-xs sm:text-sm text-gray-500 mt-2">{l.status}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-sm sm:text-base">${l.price.toFixed(2)}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{l.quantity} in stock</p>
                        </div>
                    </div>
                ))}
            </div>

            {product.orders.length > 0 && (
                <>
                    <h2 className="text-lg sm:text-xl font-semibold mt-6 sm:mt-8 mb-3">Orders</h2>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[500px]">
                                <thead className="bg-gray-50 text-xs sm:text-sm text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Order ID</th>
                                        <th className="px-4 py-3">Qty</th>
                                        <th className="px-4 py-3">Price</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs sm:text-sm">
                                    {product.orders.map((o) => (
                                        <tr key={o.id} className="border-t">
                                            <td className="px-4 py-3 font-medium">{o.orderId}</td>
                                            <td className="px-4 py-3">{o.quantity}</td>
                                            <td className="px-4 py-3">${o.salePrice.toFixed(2)}</td>
                                            <td className="px-4 py-3">{o.date.toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                                    {o.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}