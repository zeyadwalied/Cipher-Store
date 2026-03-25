const { Client } = require('pg');
const url = "postgresql://neondb_owner:npg_V0BJLWF5YXRe@ep-withered-block-a9su4scu-pooler.gwc.azure.neon.tech/neondb?sslmode=require";

async function run() {
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const orders = await client.query('SELECT id, status, "paymentMethod", "discordChannelId", "receiptImageUrl", "senderPhoneNumber" FROM "Order" ORDER BY "createdAt" DESC;');
    console.log("All Orders:");
    for (const o of orders.rows) {
        console.log(JSON.stringify(o));
    }

    await client.end();
}
run();
