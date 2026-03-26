/**
 * Creates a Discord ticket channel directly via REST API from Vercel.
 * This bypasses the bot's polling entirely — tickets are created INSTANTLY when orders are placed.
 * The bot still handles button interactions (confirm/reject) and !close commands.
 */

const DISCORD_API = "https://discord.com/api/v10";

async function discordAPI(endpoint: string, method: string, body?: any) {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error("DISCORD_TOKEN is not set");
    return null;
  }

  const res = await fetch(`${DISCORD_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Discord API error ${res.status}: ${errText}`);
    return null;
  }

  return res.json();
}

async function resolveTicketCategoryId(guildId: string, preferredCategoryId?: string | null) {
  const channels = await discordAPI(`/guilds/${guildId}/channels`, "GET");
  if (!Array.isArray(channels)) {
    const created = await discordAPI(`/guilds/${guildId}/channels`, "POST", {
      name: "Tickets",
      type: 4,
    });
    return created?.id || preferredCategoryId || null;
  }

  if (preferredCategoryId) {
    const preferred = channels.find((channel: any) =>
      channel?.id === preferredCategoryId && channel?.type === 4
    );
    if (preferred?.id) return preferred.id;
  }

  const fallback = channels.find((channel: any) =>
    channel?.type === 4 && String(channel?.name || "").toLowerCase().includes("ticket")
  );

  if (fallback?.id) return fallback.id;

  const created = await discordAPI(`/guilds/${guildId}/channels`, "POST", {
    name: "Tickets",
    type: 4,
  });

  return created?.id || null;
}

interface OrderTicketData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentMethod: string;
  items: { name: string; quantity: number }[];
}

/**
 * Creates a Discord channel + sends the order embed with confirm/reject buttons.
 * Returns the Discord channel ID, or null if it fails.
 */
export async function createOrderTicket(data: OrderTicketData): Promise<string | null> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const categoryId = process.env.DISCORD_TICKET_CATEGORY_ID;

  if (!guildId) {
    console.error("Missing DISCORD_GUILD_ID or DISCORD_TICKET_CATEGORY_ID");
    return null;
  }

  try {
    const resolvedCategoryId = await resolveTicketCategoryId(guildId, categoryId);
    if (!resolvedCategoryId) {
      console.error("Could not resolve a valid Discord ticket category");
      return null;
    }

    const safeName = data.customerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'customer';
    const channelName = `order-${safeName}-${data.orderId.slice(-4)}`;

    // 1. Create the text channel under the Tickets category
    const channel = await discordAPI(`/guilds/${guildId}/channels`, "POST", {
      name: channelName,
      type: 0, // GUILD_TEXT
      parent_id: resolvedCategoryId,
      topic: `Order #${data.orderId} | Customer: ${data.customerEmail}`,
    });

    if (!channel?.id) return null;

    // 2. Build the embed
    const itemsStr = data.items.map(i => `${i.quantity}x ${i.name}`).join("\n");

    const embed = {
      title: `🛒 New Order (#${data.orderId})`,
      color: 0x00f5ff,
      fields: [
        { name: "Customer", value: `${data.customerName} (${data.customerEmail})`, inline: true },
        { name: "Total", value: `${data.total.toFixed(2)} EGP`, inline: true },
        { name: "Method", value: data.paymentMethod, inline: true },
        { name: "Items", value: itemsStr || "None", inline: false },
      ],
      timestamp: new Date().toISOString(),
    };

    // 3. Build confirm/reject buttons
    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 3,
            label: "✅ Confirm Order",
            custom_id: `accept_${data.orderId}`,
          },
          {
            type: 2,
            style: 4,
            label: "❌ Reject Order",
            custom_id: `reject_${data.orderId}`,
          },
        ],
      },
    ];

    // 4. Send the message
    await discordAPI(`/channels/${channel.id}/messages`, "POST", {
      content: `@here 🎟️ **New Order Placed!** Chat with the customer below.\n*Type \`!close\` to close the ticket.*`,
      embeds: [embed],
      components,
    });

    return channel.id;
  } catch (e) {
    console.error("Failed to create Discord ticket:", e);
    return null;
  }
}
