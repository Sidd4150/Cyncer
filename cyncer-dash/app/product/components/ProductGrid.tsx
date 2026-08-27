import Link from "next/link";

type ProductGridProps = {
    products: Array<{
        id: number;
        name: string;
        SKU: string;
        images: string[];
        listings: Array<{ quantity: number }>;
    }>;
};

export default function ProductGrid({ products }: ProductGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
        const stock = product.listings.reduce((sum, l) => sum + l.quantity, 0);
        return (
        <Link href={`/product/${product.id}`} key={product.id}>
        <div className="bg-white rounded-lg shadow hover:shadow-md transition p-4">
        {product.images[0] && (
        <img
        src={product.images[0]}
        alt={product.name}
        className="w-full h-48 object-cover rounded mb-3"
        />
        )}
        <h2 className="font-semibold text-lg truncate">{product.name}</h2>
        <p className="text-sm text-gray-500 mt-1">{product.SKU}</p>
        <div className="flex justify-between items-center mt-3">
        <span className="text-sm text-gray-600">{stock} in stock</span>
        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
        {product.listings.length} platform{product.listings.length !== 1 ? "s" : ""}
        </span>
        </div>
        </div>
        </Link>
        );
        })}
        </div>
    );
}

