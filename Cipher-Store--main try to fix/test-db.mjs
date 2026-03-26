const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPendingOrders() {
    const orders = await prisma.order.findMany({
        where: {
            status: 'PENDING'
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log("Latest PENDING orders:", JSON.stringify(orders, null, 2));
}

checkPendingOrders().catch(console.error).finally(() => prisma.$disconnect());
