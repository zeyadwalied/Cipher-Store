import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const orderId = 'cmn6bg9x4000246tq0bulyktr';
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true }
    });
    console.log("Order Search Result for " + orderId + ":", order);

    const allOrderCount = await prisma.order.count();
    console.log("Total Orders in DB:", allOrderCount);
}

run().finally(() => prisma.$disconnect());
