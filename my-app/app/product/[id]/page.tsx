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

        </>
    )
}