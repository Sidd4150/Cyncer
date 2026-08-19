import "./globals.css"
import Link from "next/link"
import { auth, signOut } from "@/auth"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

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

          <div className="ml-auto flex items-center gap-4">
            <a
              href="/api/etsy/auth"
              className="flex items-center gap-2 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              Connect
              <img src="/etsy/Etsy_Logo_0.svg" alt="Etsy" className="h-4" />
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