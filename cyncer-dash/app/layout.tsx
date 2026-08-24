import "./globals.css"
import Link from "next/link"
import { auth, signOut } from "@/auth"
import prisma from "@/app/lib/prisma"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Query connected store counts
  const [etsyCount, amazonCount] = session?.user
    ? await Promise.all([
      prisma.store.count({ where: { platform: "etsy" } }),
      prisma.store.count({ where: { platform: "amazon" } }),
    ])
    : [0, 0]

  const isAmazonConnected =
    amazonCount > 0 ||
    Boolean(process.env.AMAZON_LWA_REFRESH_TOKEN && process.env.AMAZON_SELLER_ID)

  return (
    <html lang="en">
      <body>
        <nav className="bg-white shadow px-8 py-4 flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/product" className="font-semibold hover:text-blue-600">
            Products
          </Link>
          <Link href="/orders" className="font-semibold hover:text-blue-600">
            Orders
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {etsyCount > 0 || isAmazonConnected ? (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                {etsyCount > 0 && (
                  <div className="flex items-center gap-1">
                    <img src="/etsy/EtsySmall.webp" alt="Etsy" className="h-3.5 w-auto" />
                    <span className="font-semibold text-green-800">({etsyCount})</span>
                  </div>
                )}
                {etsyCount > 0 && isAmazonConnected && (
                  <span className="text-green-300">|</span>
                )}
                {isAmazonConnected && (
                  <img src="/amazon/amazon_logo.svg" alt="Amazon" className="h-3.5 w-auto" />
                )}
              </div>
            ) : (
              <a
                href="/api/etsy/auth"
                className="flex items-center gap-1.5 border border-gray-300 rounded px-2.5 py-1 hover:bg-gray-50 text-xs font-medium text-gray-700"
              >
                <span>Connect</span>
                <img src="/etsy/Etsy_Logo_0.svg" alt="Etsy" className="h-3.5" />
              </a>
            )}

            <a
              href="/api/etsy/auth"
              title="Connect another Etsy shop"
              className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-xs font-medium text-gray-700 transition"
            >
              <span className="font-bold text-gray-500 leading-none">+</span>
              <img src="/etsy/Etsy_Logo_0.svg" alt="Etsy" className="h-3.5" />
            </a>

            {session?.user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-7 h-7 rounded-full border border-gray-200"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {session.user.name || session.user.email}
                  </span>
                )}
                <form
                  action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/login" })
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-gray-50 transition"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}