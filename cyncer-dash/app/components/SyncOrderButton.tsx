'use client'

export default function SyncOrderButton() {
    const handlesync = async () => {
        const res = await fetch("/api/etsy/sync-orders")
        const data = await res.json();
        alert(`Synced ${data.synced} orders`);
        window.location.reload();
    };

    return (
        <button onClick={handlesync} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Refresh Orders
        </button>
    )
}
