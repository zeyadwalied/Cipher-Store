/**
 * Creates a Discord ticket channel directly via REST API from the web app.
 * This bypasses the bot's polling for the primary order-ticket path.
 */

const DISCORD_API = "https://discord.com/api/v10";
let cachedCategory: { guildId: string; categoryId: string; expiresAt: number } | null = null;

async function discordAPI(endpoint: string, method: string, body?: any) {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error("DISCORD_TOKEN is not set");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${DISCORD_API}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Discord API error ${res.status}: ${errText}`);
      return null;
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveTicketCategoryId(guildId: string, preferredCategoryId?: string | null) {
  if (
    cachedCategory &&
    cachedCategory.guildId === guildId &&
    cachedCategory.expiresAt > Date.now() &&
    (!preferredCategoryId || cachedCategory.categoryId === preferredCategoryId)
  ) {
    return cachedCategory.categoryId;
  }

  const channels = await discordAPI(`/guilds/${guildId}/channels`, "GET");
  if (!Array.isArray(channels)) {
    const created = await discordAPI(`/guilds/${guildId}/channels`, "POST", {
      name: "Tickets",
      type: 4,
    });
    const categoryId = created?.id || null;
    if (categoryId) {
      cachedCategory = { guildId, categoryId, expiresAt: Date.now() + 10 * 60 * 1000 };
    }
    return categoryId;
  }

  if (preferredCategoryId) {
    const preferred = channels.find((channel: any) =>
      channel?.id === preferredCategoryId && channel?.type === 4
    );
    if (preferred?.id) {
      cachedCategory = { guildId, categoryId: preferred.id, expiresAt: Date.now() + 10 * 60 * 1000 };
      return preferred.id;
    }
  }

  const fallback = channels.find((channel: any) =>
    channel?.type === 4 && String(channel?.name || "").toLowerCase().includes("ticket")
  );

  if (fallback?.id) {
    cachedCategory = { guildId, categoryId: fallback.id, expiresAt: Date.now() + 10 * 60 * 1000 };
    return fallback.id;
  }

  const created = await discordAPI(`/guilds/${guildId}/channels`, "POST", {
    name: "Tickets",
    type: 4,
  });

  if (created?.id) {
    cachedCategory = { guildId, categoryId: created.id, expiresAt: Date.now() + 10 * 60 * 1000 };
    return created.id;
  }

  return null;
}

interface OrderTicketData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentMethod: string;
  items: { name: string; quantity: number }[];
}

export async function createOrderTicket(data: OrderTicketData): Promise<string | null> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const categoryId = process.env.DISCORD_TICKET_CATEGORY_ID;

  if (!guildId) {
    console.error("Missing DISCORD_GUILD_ID");
    return null;
  }

  try {
    const resolvedCategoryId = await resolveTicketCategoryId(guildId, categoryId);
    if (!resolvedCategoryId) {
      console.error("Could not resolve a valid Discord ticket category");
      return null;
    }

    const safeName = data.customerName.toLowerCase().replace(/[^a-z0-9]/g, "") || "customer";
    const channelName = `order-${safeName}-${data.orderId.slice(-4)}`;

    let channel = await discordAPI(`/guilds/${guildId}/channels`, "POST", {
      name: channelName,
      type: 0,
      parent_id: resolvedCategoryId,
      topic: `Order #${data.orderId} | Customer: ${data.customerEmail}`,
    });

    if (!channel?.id) {
      cachedCategory = null;

      const retryCategoryId = await resolveTicketCategoryId(guildId, null);
      if (retryCategoryId && retryCategoryId !== resolvedCategoryId) {
        channel = await discordAPI(`/guilds/${guildId}/channels`, "POST", {
          name: channelName,
          type: 0,
          parent_id: retryCategoryId,
          topic: `Order #${data.orderId} | Customer: ${data.customerEmail}`,
        });
      }
    }

    if (!channel?.id) return null;

    const itemsStr = data.items.map((item) => `${item.quantity}x ${item.name}`).join("\n");

    const embed = {
      title: `New Order (#${data.orderId})`,
      color: 0x00f5ff,
      fields: [
        { name: "Customer", value: `${data.customerName} (${data.customerEmail})`, inline: true },
        { name: "Total", value: `${data.total.toFixed(2)} EGP`, inline: true },
        { name: "Method", value: data.paymentMethod, inline: true },
        { name: "Items", value: itemsStr || "None", inline: false },
      ],
      timestamp: new Date().toISOString(),
    };

    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 3,
            label: "Confirm Order",
            custom_id: `accept_${data.orderId}`,
          },
          {
            type: 2,
            style: 4,
            label: "Reject Order",
            custom_id: `reject_${data.orderId}`,
          },
        ],
      },
    ];

    await discordAPI(`/channels/${channel.id}/messages`, "POST", {
      content: `@here **New Order Placed!** Chat with the customer below.\n*Type \`!close\` to close the ticket.*`,
      embeds: [embed],
      components,
    });

    return channel.id;
  } catch (error) {
    console.error("Failed to create Discord ticket:", error);
    return null;
  }
}
