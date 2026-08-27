import SyncListingButton from "@/app/components/SyncListingButton";

type ProductPageHeaderProps = {
    totalCount: number;
    currentPage: number;
    totalPages: number;
};

export default function ProductPageHeader({ totalCount, currentPage, totalPages }: ProductPageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Products</h1>
        <p className="text-gray-500 text-sm">{totalCount} products | Page {currentPage} of {totalPages}</p>
        </div>
        <SyncListingButton />
        </div>
    );
}

