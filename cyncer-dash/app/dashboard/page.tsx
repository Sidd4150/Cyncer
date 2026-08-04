import prisma from "@/app/lib/prisma"

export default async function Dashboard() {
    const [totalProducts, totalOrders, stockAgg] = await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.listing.aggregate({ _sum: { quantity: true } }),
    ]);

    const totalStock = stockAgg._sum.quantity ?? 0;

    const stats = [
        { label: "Products", value: totalProducts },
        { label: "Total Stock", value: totalStock },
        { label: "Current Orders", value: totalOrders },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
