import prisma from "@/app/lib/prisma"
import Link from "next/link"

export default async function Product() {

    const products = await prisma.product.findMany({
        include: { listings: true },
    });


    return (<div>
        <div>Product page</div>

        <ul>

            {products.map((product) => (
                <li key={product.id}>

                    <Link href={`/product/${product.id}`}>{product.name}</Link>
                    <br></br>

                    {product.SKU}
                    <br></br>

                    {product.desc}

                    | Stock: {product.listings.reduce((sum, l) => sum + l.quantity, 0)}
                    | Platforms: {product.listings.length}



                </li>
            ))}
        </ul>

    </div>)
}