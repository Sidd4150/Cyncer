import { Order, OrderItem, Platform, OrderStatus } from "@/generated/prisma/client";

type OrderWithItems = Order & { items: OrderItem[] };

const PLATFORM_COLORS: Record<Platform, string> = {
  ETSY: "bg-orange-100 text-orange-700",
  FAIRE: "bg-purple-100 text-purple-700",
  EBAY: "bg-blue-100 text-blue-700",
  AMAZON: "bg-yellow-100 text-yellow-700",
  MICHAELS: "bg-green-100 text-green-700",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-zinc-100 text-zinc-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-orange-100 text-orange-700",
};

export function OrdersTable({ orders }: { orders: OrderWithItems[] }) {
  if (orders.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-zinc-500">
        No orders found. Adjust your filters or sync your platforms.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-6 py-3 text-left font-medium text-zinc-500">Platform</th>
            <th className="px-6 py-3 text-left font-medium text-zinc-500">Order ID</th>
            <th className="px-6 py-3 text-left font-medium text-zinc-500">Customer</th>
            <th className="px-6 py-3 text-left font-medium text-zinc-500">Items</th>
            <th className="px-6 py-3 text-left font-medium text-zinc-500">Total</th>
            <th className="px-6 py-3 text-left font-medium text-zinc-500">Status</th>
            <th className="px-6 py-3 text-left font-medium text-zinc-500">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="px-6 py-4">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_COLORS[order.platform]}`}>
                  {order.platform}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {order.externalId}
              </td>
              <td className="px-6 py-4">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{order.customerName}</div>
                {order.customerEmail && (
                  <div className="text-xs text-zinc-500">{order.customerEmail}</div>
                )}
              </td>
              <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </td>
              <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: order.currency,
                }).format(order.total)}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 text-zinc-500">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
