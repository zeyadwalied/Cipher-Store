export type DiscordWebhookType =
  | "orders"
  | "payments"
  | "admin"
  | "products"
  | "chat"
  | "users"
  | "discounts"
  | "support"
  | "reviews"
  | "errors";

const WEBHOOKS: Record<DiscordWebhookType, string> = {
  orders: "https://discord.com/api/webhooks/1485456013015646348/-V7XIbEGCshw_zM77P5U8ZgQdqDKCKowjusSJ7_2oNXF7BLb8jPrXu5dTOGaMBvsAVPG",
  payments: "https://discord.com/api/webhooks/1485459046541820017/qI8gsSHFQJ0e4YR4IPtoYyMVFDKxEGVE0748avgqSR2NAFk-KnLpzK-sk9BkuN_FTCEG",
  admin: "https://discord.com/api/webhooks/1485459180226740396/mxVVwUbYW5siEsn_XYdDyP2Mlxokkz32NNGgHwzL2Ckco8xUeFJkSVErRQaHXTxFQfDW",
  products: "https://discord.com/api/webhooks/1485459399160889446/QRkZ217nmP597dXs-GuANcnlNaC5RLTl8M-pKGAbokOKmaSRQmsoKPDJG8KBIwTtOc_f",
  chat: "https://discord.com/api/webhooks/1485459510700277881/_fOHnRMG-FcnPn0Ap7jSEtIepmpZ72JvY79DXBu3KRcUNghMbOCkJT8uMgxXgUSzVNir",
  users: "https://discord.com/api/webhooks/1485868020474577017/d6r_4dp0MuncU-eh-nXFH3o0iSskgQW7x5pTp8HsfFzhA8g6oTKRKpPYH4BUY5rlWyy3",
  discounts: "https://discord.com/api/webhooks/1485459730511167610/tBafM5nwdgic-TJNn9LaltT10su1vIU9BHXAJZkpHoRlrx26uzXTSwta0GThiBg4P3H0",
  support: "https://discord.com/api/webhooks/1485459831430320148/8a_4oPLNo_KI59I-gsb4YUx9NRctKiFeMZtJ8ZvDa_w1IADYe7AiiVdrAt4cfm204vgm",
  reviews: "https://discord.com/api/webhooks/1485459942168330350/J_Dl3J2ilkgLa6RpoZ22JvOLMXrJiewScIehFbxoQQPkBub_qr5jiA3kNlVWq5Vr3yvJ",
  errors: "https://discord.com/api/webhooks/1485460064973226065/wNxKI9I_idVOapzeaSmuwK7RmOGrmfAG7zbysizcsKKjxZaGGxLnl8a3rFb-k317cY2q"
};

interface Embed {
  title?: string;
  description?: string;
  color?: number; // Integer color code
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
}

export async function sendDiscordLog(
  type: DiscordWebhookType,
  embed: Embed
) {
  try {
    const webhookUrl = WEBHOOKS[type];
    if (!webhookUrl) return;

    // Attach timestamp if not provided
    if (!embed.timestamp) embed.timestamp = new Date().toISOString();

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error(`Failed to send Discord Log (${type}):`, error);
  }
}
