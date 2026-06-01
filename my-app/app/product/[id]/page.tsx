import prisma from "@/app/lib/prisma"


export default async function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: { listings: true, orders: true },
    });

    if (!product) return <div>Product Not found!</div>;

    return (
        <>
            <div>Product Details</div>

            <ul>


                <li key={product.id}>

                    {product.name}
                    <br></br>

                    {product.SKU}
                    <br></br>

                    {product.desc}

                    <br></br>


                    Platforms:
                    <ul>
                        {product.listings.map((l) => (
                            <li key={l.id}>{l.platform}: {l.quantity} in Stock. Pricing: {l.price}</li>
                        ))}
                    </ul>



                </li>

            </ul>
        </>
    )
}