import prisma from "@/app/lib/prisma"
import Link from "next/link"

export default async function Orders({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { platform } = await searchParams;
    const platformFilter = platform as string | undefined;

    const where = platformFilter ? { platform: platformFilter } : {};
    const orders = await prisma.order.findMany({ where, include: { product: true } });

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-2">Active Orders</h1>
            <p className="text-gray-500 mb-4">{orders.length} orders</p>

            <div className="flex gap-2 mb-6">
                <Link href="/orders" className={`px-3 py-1.5 rounded text-sm font-medium ${!platformFilter ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>
                    All
                </Link>
                <Link href="/orders?platform=etsy" className={`px-3 py-1.5 rounded text-sm font-medium ${platformFilter === "etsy" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>
                    Etsy
                </Link>
                <Link href="/orders?platform=amazon" className={`px-3 py-1.5 rounded text-sm font-medium ${platformFilter === "amazon" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>
                    Amazon
                </Link>
                <Link href="/orders?platform=ebay" className={`px-3 py-1.5 rounded text-sm font-medium ${platformFilter === "ebay" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}>
                    eBay
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>
    )
}