import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, status: true, paymentMethod: true, discordChannelId: true, receiptImageUrl: true }
    });
    console.log("Recent Orders:", orders);
}

run().finally(() => prisma.$disconnect());
