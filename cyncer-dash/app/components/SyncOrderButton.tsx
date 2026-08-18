'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"
export default function SyncOrderButton() {
    const [isSyncing, setSyncing] = useState(false)
    const [message, setMessage] = useState("")
    const router = useRouter()
    async function handlesync(): Promise<void> {

        setSyncing(true)
        try {
            const res = await fetch("/api/etsy/sync-orders")
            if (!res.ok) {
                setMessage("Failed to sync orders")
                return
            }
            const data = await res.json()
            const total = (data.stores ?? []).reduce(


                (sum: number, s: { synced?: number }) => sum + (s.synced ?? 0),
                0
            )
            setMessage(`Synced ${total} order${total === 1 ? "" : "s"}`)
            router.refresh()
        } catch (error) {
            console.error(error)
            setMessage("Error syncing orders")
        } finally {
            setSyncing(false)
        }



    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handlesync}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
                {isSyncing ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Syncing Orders...</span>
                    </>
                ) : (
                    <span>Refresh orders</span>
                )}
            </button>
            {message && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded">
                    {message}
                </span>
            )}
        </div>
    )
}
