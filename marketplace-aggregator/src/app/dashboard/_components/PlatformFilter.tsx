"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PLATFORMS = ["ALL", "ETSY", "FAIRE", "EBAY", "AMAZON", "MICHAELS"] as const;
const STATUSES = ["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

export function PlatformFilter({
  activePlatform,
  activeStatus,
}: {
  activePlatform: string;
  activeStatus: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-500">Platform:</span>
        <div className="flex gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => updateFilter("platform", p)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activePlatform === p
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-500">Status:</span>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateFilter("status", s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeStatus === s
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
