const { Client } = require('pg');

// Test 1: Connect WITHOUT channel_binding
const url1 = "postgresql://neondb_owner:npg_V0BJLWF5YXRe@ep-withered-block-a9su4scu-pooler.gwc.azure.neon.tech/neondb?sslmode=require";

async function run() {
    const client = new Client({ connectionString: url1, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log("✅ Connected to Neon DB!");

        // Check what tables exist
        const tables = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';");
        console.log("📋 Tables:", tables.rows.map(r => r.tablename));

        // Check order count
        try {
            const orders = await client.query('SELECT COUNT(*) FROM "Order";');
            console.log("📦 Order count:", orders.rows[0].count);
        } catch (e) {
            console.log("❌ Order table query failed:", e.message);
        }

        // Check user count
        try {
            const users = await client.query('SELECT COUNT(*) FROM "User";');
            console.log("👤 User count:", users.rows[0].count);
        } catch (e) {
            console.log("❌ User table query failed:", e.message);
        }

    } catch (e) {
        console.error("❌ Connection failed:", e.message);
    } finally {
        await client.end();
    }
}

run();
