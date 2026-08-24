import Link from "next/link"

export default function Pagination({
    currentPage,
    totalPages,
    store,
    amazon,
    stock,
}: {
    currentPage: number
    totalPages: number
    store?: string
    amazon?: string
    stock?: string
}) {
    const href = (page: number) => {
        const params = new URLSearchParams()
        params.set("page", String(page))
        if (store) params.set("store", store)
        if (amazon) params.set("amazon", amazon)
        if (stock) params.set("stock", stock)
        return `/product?${params.toString()}`
    }

    return (
        <div className="flex justify-center gap-4">
            {currentPage > 1 && (
                <Link
                    href={href(currentPage - 1)}
                    className="px-4 py-2 bg-white rounded shadow hover:shadow-md"
                >
                    Previous
                </Link>
            )}
            {currentPage < totalPages && (
                <Link
                    href={href(currentPage + 1)}
                    className="px-4 py-2 bg-white rounded shadow hover:shadow-md"
                >
                    Next
                </Link>
            )}
        </div>
    )
}
