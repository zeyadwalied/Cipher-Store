import { WebhookClient, AttachmentBuilder } from "discord.js";

const url = "https://discord.com/api/webhooks/1485459046541820017/qI8gsSHFQJ0e4YR4IPtoYyMVFDKxEGVE0748avgqSR2NAFk-KnLpzK-sk9BkuN_FTCEG";

async function testUpload() {
    try {
        const webhookClient = new WebhookClient({ url });
        const fileBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

        const attachment = new AttachmentBuilder(fileBytes, { name: 'test.png' });

        const msg = await webhookClient.send({
            content: 'Test upload from discord.js',
            files: [attachment]
        });

        console.log("Success! Attachment URL:", msg.attachments[0]?.url);
    } catch (err) {
        console.error("Error:", err);
    }
}

testUpload();
