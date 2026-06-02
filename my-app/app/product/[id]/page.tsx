import prisma from "@/app/lib/prisma"
import Link from "next/link"

export default async function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: { listings: true, orders: true },
    });

    if (!product) return <div className="p-8 text-gray-500">Product not found</div>;

    const totalStock = product.listings.reduce((sum, l) => sum + l.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Link href="/product" className="text-blue-600 hover:underline text-sm">&larr; Back to Products</Link>

            <div className="mt-4 bg-white rounded-lg shadow p-6">
                {product.images[0] && (
                    <div className="flex gap-4 overflow-x-auto mb-6">
                        {product.images.map((url, i) => (
                            <img
                                key={i}
                                src={url}
                                alt={`${product.name} ${i + 1}`}
                                className="h-64 rounded shadow object-cover"
                            />
                        ))}
                    </div>
                )}

                <h1 className="text-2xl font-bold">{product.name}</h1>
                <p className="text-gray-500 mt-1">{product.SKU}</p>
                {product.desc && (
                    <p className="text-gray-700 mt-3 line-clamp-4">{product.desc}</p>
                )}

                <div className="flex gap-4 mt-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                        {totalStock} total stock
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium">
                        {product.orders.length} orders
                    </span>
                </div>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-3">Platforms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.listings.map((l) => (
                    <div key={l.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                        <div>
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{l.platform}</span>
                            <p className="text-sm text-gray-500 mt-2">{l.status}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">${l.price.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">{l.quantity} in stock</p>
                        </div>
                    </div>
                ))}
            </div>

            {product.orders.length > 0 && (
                <>
                    <h2 className="text-xl font-semibold mt-8 mb-3">Orders</h2>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-sm text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Order ID</th>
                                    <th className="px-4 py-3">Qty</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {product.orders.map((o) => (
                                    <tr key={o.id} className="border-t">
                                        <td className="px-4 py-3">{o.orderId}</td>
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
                </>
            )}
        </div>
    )
}