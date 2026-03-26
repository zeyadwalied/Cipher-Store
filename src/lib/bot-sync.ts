/**
 * Sends a lightweight Postgres NOTIFY event to wake up the Discord bot instantly.
 * MUST use DIRECT_URL (not PgBouncer) because NOTIFY/LISTEN is not supported by PgBouncer.
 * This function should be called inside API routes *after* creating an order, ticket, or message.
 */
export async function triggerBotSync() {
    try {
        // Try Prisma first (works if directUrl is configured in schema.prisma)
        const prisma = (await import("@/lib/prisma")).default;
        await prisma.$executeRawUnsafe(`NOTIFY bot_sync, 'sync_needed'`);
    } catch (e) {
        // Silently fail — the bot has a 15-second polling fallback
        console.error("Failed to notify Discord bot:", e);
    }
}
