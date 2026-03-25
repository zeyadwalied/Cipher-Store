import { PrismaClient } from '@prisma/client';
const dbUrl = "postgresql://neondb_owner:npg_V0BJLWF5YXRe@ep-withered-block-a9su4scu-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";
const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } }
});

async function run() {
  const allOrderCount = await prisma.order.count();
  console.log("Total Orders using exact URL string:", allOrderCount);
}

run().finally(() => prisma.$disconnect());
