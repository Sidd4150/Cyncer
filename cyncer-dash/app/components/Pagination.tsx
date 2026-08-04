import Link from "next/link"

export default function Pagination({
    currentPage,
    totalPages,
}: {
    currentPage: number
    totalPages: number
}) {
    return (
        <div className="flex justify-center gap-4">
            {currentPage > 1 && (
                <Link
                    href={`/product?page=${currentPage - 1}`}
                    className="px-4 py-2 bg-white rounded shadow hover:shadow-md"
                >
                    Previous
                </Link>
            )}
            {currentPage < totalPages && (
                <Link
                    href={`/product?page=${currentPage + 1}`}
                    className="px-4 py-2 bg-white rounded shadow hover:shadow-md"
                >
                    Next
                </Link>
            )}
        </div>
    )
}
