import prisma from "@/app/lib/prisma"

export default async function Orders() {

    const orders = await prisma.order.findMany({ include: { product: true } });


    return (<>
        <div>Orders:</div>


        <ul>
            {orders.map((order) => (
                <li key={order.id}>
                    Platform {order.platform} <br></br>
                    Name: {order.product.name}
                    Order Price: {order.salePrice}
                    Status: {order.status}
                </li>
            ))}
        </ul>

    </>)
}