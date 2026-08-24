'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SyncListingButton() {
    const [isSyncing, setSyncing] = useState(false)
    const [message, setMessage] = useState("")
    const router = useRouter()

    async function handleSync(): Promise<void> {
        setSyncing(true)
        setMessage("")

        try {
            // Run Etsy and Amazon listing syncs in parallel
            const [etsyRes, amazonRes] = await Promise.allSettled([
                fetch("/api/etsy/sync", { method: "POST" }),
                fetch("/api/amazon/sync", { method: "POST" }),
            ])

            let totalSynced = 0
            const successfulPlatforms: string[] = []

            // 1. Process Etsy results
            if (etsyRes.status === "fulfilled" && etsyRes.value.ok) {
                const data = await etsyRes.value.json()
                const count = (data.results ?? []).reduce(
                    (sum: number, s: { synced?: number }) => sum + (s.synced ?? 0),
                    0
                )
                totalSynced += count
                successfulPlatforms.push("Etsy")
            }

            // 2. Process Amazon results
            if (amazonRes.status === "fulfilled" && amazonRes.value.ok) {
                const data = await amazonRes.value.json()
                totalSynced += (data.synced ?? 0)
                successfulPlatforms.push("Amazon")
            }

            if (successfulPlatforms.length === 0) {
                setMessage("Failed to sync listings from connected stores.")
                return
            }

            setMessage(`Synced ${totalSynced} listing${totalSynced === 1 ? "" : "s"} (${successfulPlatforms.join(" & ")})`)
            router.refresh()
        } catch (error) {
            console.error("Listing sync error:", error)
            setMessage("Error syncing listings.")
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition text-sm font-medium"
            >
                {isSyncing ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Syncing Listings...</span>
                    </>
                ) : (
                    <span>Sync Listings</span>
                )}
            </button>
            {message && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded border border-green-200">
                    {message}
                </span>
            )}
        </div>
    )
}
