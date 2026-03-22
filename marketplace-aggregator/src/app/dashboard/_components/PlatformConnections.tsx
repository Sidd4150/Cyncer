"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Connection = {
  platform: string;
  shopName: string | null;
  updatedAt: Date;
} | null;

export function PlatformConnections({ etsy }: { etsy: Connection }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function syncEtsy() {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync/etsy", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err) {
      alert(`Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {etsy ? (
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 dark:border-orange-900 dark:bg-orange-950/30">
          <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
            Etsy · {etsy.shopName}
          </span>
          <button
            onClick={syncEtsy}
            disabled={syncing}
            className="rounded-full bg-orange-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
      ) : (
        <a
          href="/api/auth/etsy"
          className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-800 transition-colors hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300"
        >
          <span className="text-base">🛍</span>
          Connect Etsy
        </a>
      )}
    </div>
  );
}
