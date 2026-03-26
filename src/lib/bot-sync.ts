import prisma from "@/lib/prisma"

/**
 * Sends a lightweight Postgres NOTIFY event to wake up the Discord bot instantly.
 * This function should be called inside API routes *after* creating an order, ticket, or message.
 */
export async function triggerBotSync() {
    try {
        await prisma.$executeRawUnsafe(`NOTIFY bot_sync, 'sync_needed'`);
    } catch (e) {
        console.error("Failed to notify Discord bot:", e);
    }
}
