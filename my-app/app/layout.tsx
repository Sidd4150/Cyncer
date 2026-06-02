
import "./globals.css";
import Link from "next/link"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-white shadow px-8 py-4 flex gap-6">
          <Link href="/dashboard" className="font-semibold hover:text-blue-600">Dashboard</Link>
          <Link href="/product" className="font-semibold hover:text-blue-600">Products</Link>
          <Link href="/orders" className="font-semibold hover:text-blue-600">Orders</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}