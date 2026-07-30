
import "./globals.css";
import Link from "next/link"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-white shadow px-8 py-4 flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold hover:text-blue-600">Dashboard</Link>
          <Link href="/product" className="font-semibold hover:text-blue-600">Products</Link>
          <Link href="/orders" className="font-semibold hover:text-blue-600">Orders</Link>
          <a href="/api/etsy/auth" className="ml-auto flex items-center gap-2 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 text-sm font-medium text-gray-700">
            Connect
            <img src="/etsy/Etsy_Logo_0.svg" alt="Etsy" className="h-4" />
          </a>
        </nav>
        {children}
      </body>
    </html>
  );
}