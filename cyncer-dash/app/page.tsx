import Link from "next/link"

export const metadata = {
    title: "Cyncer — Multi-Channel Inventory Management",
    description:
        "Cyncer syncs stock and orders across Etsy, eBay, and Amazon in one dashboard, so selling an item on one marketplace keeps its quantity accurate everywhere and helps prevent overselling.",
}

const features = [
    {
        title: "Unified catalog",
        body: "Every listing from every connected shop lives in one product catalog, with live stock counts and prices per marketplace.",
    },
    {
        title: "Order tracking",
        body: "See active orders as they come in across your stores, filterable by shop and by marketplace, each linked back to its product.",
    },
    {
        title: "Stock in one place",
        body: "Quantity is tracked per listing, so the stock you have on one channel is always visible alongside the others — the foundation for cross-channel sync.",
    },
    {
        title: "Multiple shops",
        body: "Connect more than one store on the same marketplace (for example two Etsy shops) and filter your catalog and orders by store.",
    },
]

const steps = [
    {
        title: "Connect your shops",
        body: "Authorize Cyncer to read your listings and orders through each marketplace's secure OAuth flow. Your credentials are never shared with third parties.",
    },
    {
        title: "Sync your catalog",
        body: "Cyncer imports your products, per-platform listings, and active orders into a single database you control.",
    },
    {
        title: "Manage from one dashboard",
        body: "Track total stock, product counts, and current orders across every store and marketplace from one place.",
    },
]

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100">
            <section className="max-w-4xl mx-auto px-8 py-16 text-center">
                <h1 className="text-4xl font-bold mb-4">Cyncer</h1>
                <p className="text-xl text-gray-700 mb-3">
                    Multi-channel inventory management for online sellers.
                </p>
                <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                    Cyncer keeps your stock and orders in sync across Etsy, eBay, and Amazon
                    from a single dashboard. When an item sells on one marketplace, its
                    quantity stays accurate everywhere — so you spend less time reconciling
                    spreadsheets and avoid overselling products you no longer have.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <Link href="/dashboard" className="px-5 py-2.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">
                        Open Dashboard
                    </Link>
                    <Link href="/product" className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded font-medium hover:bg-gray-50">
                        Browse Products
                    </Link>
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-8 pb-16">
                <h2 className="text-2xl font-bold mb-6 text-center">What Cyncer does</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((f) => (
                        <div key={f.title} className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                            <p className="text-gray-600 text-sm">{f.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-8 pb-16">
                <h2 className="text-2xl font-bold mb-6 text-center">How it works</h2>
                <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {steps.map((s, i) => (
                        <li key={s.title} className="bg-white rounded-lg shadow p-6">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold mb-3">
                                {i + 1}
                            </span>
                            <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                            <p className="text-gray-600 text-sm">{s.body}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="max-w-4xl mx-auto px-8 pb-16 text-center">
                <div className="bg-white rounded-lg shadow p-8">
                    <h2 className="text-2xl font-bold mb-2">Supported marketplaces</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Etsy is fully supported today, including multiple Etsy shops. eBay and
                        Amazon integrations are actively being built and will use the same
                        unified catalog and order tracking.
                    </p>
                </div>
            </section>

            <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
                Cyncer — inventory management for Etsy, eBay, and Amazon sellers.
            </footer>
        </div>
    )
}
