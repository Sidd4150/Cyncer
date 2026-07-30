import prisma from "@/app/lib/prisma"

export default async function Dashboard() {

    const totalProd = await prisma.product.count();
    const listings = await prisma.listing.findMany();
    const orders = await prisma.order.findMany();

    const totalStock = listings.reduce((sum, l) => sum + l.quantity, 0);


    return (
        < div id="dashboard" >
            <p>total product count {totalProd}</p>
            <p>total stock {totalStock}</p>

            <ul>
                {listings.map((listing) => (
                    <li key={listing.id}>
                        {listing.platform} - {listing.quantity} in stock
                    </li>
                ))}
            </ul>

        </div >)

}