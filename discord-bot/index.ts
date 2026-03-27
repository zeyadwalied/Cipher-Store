import { Client, GatewayIntentBits, Partials, ChannelType, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';
import "dotenv/config";
import { Client as PgClient } from 'pg'; // <-- ADDED FOR INSTANT REALTIME SYNC
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      // Prefer pooled URL for long-running bot stability.
      url: process.env.DATABASE_URL || process.env.DIRECT_URL,
    },
  },
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

const TOKEN = process.env.DISCORD_TOKEN || "YOUR_DISCORD_TOKEN_HERE";
const ENV_TICKET_CATEGORY_ID = process.env.DISCORD_TICKET_CATEGORY_ID || null;
const FALLBACK_POLL_INTERVAL_MS = 30000;
const MAX_SUPPORT_TICKETS_PER_PASS = 3;
const MAX_ORDER_TICKETS_PER_PASS = 2;
const MAX_MESSAGES_PER_PASS = 10;
const MAX_CLEANUP_ITEMS_PER_PASS = 5;
const STATE_FLUSH_DEBOUNCE_MS = 1000;
const ORDER_TICKET_FALLBACK_DELAY_MS = 30000;

const CONFIG_FILE = path.join(__dirname, 'bot-config.json');

// Memory variables
let state = {
  orderChannelId: null as string | null,
  ticketCategoryId: null as string | null,
  backupChannelId: null as string | null,
  logChannelId: null as string | null,
  processedOrders: [] as string[],
  processedMessages: [] as string[]
};
let stateFlushTimer: NodeJS.Timeout | null = null;
let pendingPoll = false;
let ownerIdCache: { value: string | null; expiresAt: number } = { value: null, expiresAt: 0 };

// Load state from file if exists
try {
  if (fs.existsSync(CONFIG_FILE)) {
    state = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
} catch (e) {
  console.log("No config file found, starting fresh.");
}

if (!state.ticketCategoryId && ENV_TICKET_CATEGORY_ID) {
  state.ticketCategoryId = ENV_TICKET_CATEGORY_ID;
}

function flushState() {
  // keep sets small
  if (state.processedOrders.length > 300) state.processedOrders = state.processedOrders.slice(-300);
  if (state.processedMessages.length > 1000) state.processedMessages = state.processedMessages.slice(-1000);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(state));
}

function saveState() {
  if (stateFlushTimer) clearTimeout(stateFlushTimer);
  stateFlushTimer = setTimeout(() => {
    stateFlushTimer = null;
    flushState();
  }, STATE_FLUSH_DEBOUNCE_MS);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function getSystemSenderId() {
  if (ownerIdCache.expiresAt > Date.now()) return ownerIdCache.value;

  const owner = await prisma.user.findFirst({
    where: { role: { in: ['OWNER', 'DEV', 'MANAGER'] } },
    select: { id: true }
  });

  ownerIdCache = {
    value: owner?.id || null,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  return ownerIdCache.value;
}

async function resolveTicketCategoryId(guild: any) {
  const preferredIds = [state.ticketCategoryId, ENV_TICKET_CATEGORY_ID].filter(Boolean) as string[];

  for (const id of preferredIds) {
    const channel = await guild.channels.fetch(id).catch(() => null);
    if (channel?.type === ChannelType.GuildCategory) {
      if (state.ticketCategoryId !== channel.id) {
        state.ticketCategoryId = channel.id;
        saveState();
      }
      return channel.id;
    }
  }

  const channels = await guild.channels.fetch();
  const fallback = channels.find((channel: any) =>
    channel?.type === ChannelType.GuildCategory &&
    channel.name?.toLowerCase().includes("ticket")
  );

  if (fallback) {
    state.ticketCategoryId = fallback.id;
    saveState();
    return fallback.id;
  }

  const createdCategory = await guild.channels.create({
    name: "Tickets",
    type: ChannelType.GuildCategory,
  }).catch(() => null);

  if (createdCategory?.id) {
    state.ticketCategoryId = createdCategory.id;
    saveState();
    return createdCategory.id;
  }

  return null;
}

async function resolveBackupChannel(guild: any) {
  const preferredIds = [state.backupChannelId].filter(Boolean) as string[];

  for (const id of preferredIds) {
    const channel = await guild.channels.fetch(id).catch(() => null);
    if (channel?.type === ChannelType.GuildText) {
      if (state.backupChannelId !== channel.id) {
        state.backupChannelId = channel.id;
        saveState();
      }
      return channel as TextChannel;
    }
  }

  const channels = await guild.channels.fetch();
  const fallback = channels.find((channel: any) =>
    channel?.type === ChannelType.GuildText &&
    String(channel?.name || "").toLowerCase() === "ticket-backup"
  );

  if (fallback?.id) {
    state.backupChannelId = fallback.id;
    saveState();
    return fallback as TextChannel;
  }

  return null;
}

async function archiveResolvedOrder(guild: any, order: any) {
  if (!order.discordChannelId) return;

  const channel = guild.channels.cache.get(order.discordChannelId) as TextChannel | undefined;
  const backupChannel = await resolveBackupChannel(guild);
  const source = order.confirmationSource === 'DISCORD' ? 'Discord Staff' : 'Website Admin';
  const header = [
    'Ticket Archive',
    `Order ID: ${order.id}`,
    `Status: ${order.status}`,
    `Source: ${source}`,
    `Channel: ${channel?.name || 'unknown-ticket'}`
  ].join('\n');

  if (backupChannel) {
    await backupChannel.send(`\`\`\`txt\n${header}\n\`\`\``).catch(() => {});

    if (channel) {
      const fetchedMessages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
      const transcript = fetchedMessages
        ? [...fetchedMessages.values()]
            .reverse()
            .map((message) => {
              const timestamp = new Date(message.createdTimestamp).toISOString();
              const author = message.author?.tag || 'Unknown';
              const content = message.content?.trim() || '[attachment or embed]';
              return `[${timestamp}] ${author}: ${content}`;
            })
            .join('\n')
        : 'No transcript available.';

      const transcriptChunks = transcript.match(/[\s\S]{1,1800}/g) || [];
      for (const chunk of transcriptChunks) {
        await backupChannel.send(`\`\`\`txt\n${chunk}\n\`\`\``).catch(() => {});
      }
    }
  }

  if (channel) {
    await channel.send(`Archive Notice: Order ${order.status} by ${source}. A full transcript was sent to ticket-backup and this ticket will remain available.`).catch(() => {});
  }
}

function requestPoll() {
  if (isPolling) {
    pendingPoll = true;
    return;
  }

  void pollDatabase();
}

async function createSupportTicketChannel(guild: any, ticketCategoryId: string, chat: any) {
  const claimToken = `PENDING_SUPPORT:${process.pid}:${chat.id}`;
  const claim = await prisma.chat.updateMany({
    where: { id: chat.id, discordChannelId: null },
    data: { discordChannelId: claimToken }
  });

  if (!claim.count) return;

  try {
    const buyerName = chat.buyer?.name || 'guest';
    const channelName = `support-${buyerName}-${chat.id.slice(-4)}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: ticketCategoryId,
      topic: `Web ${chat.type} ID: ${chat.id} | User: ${chat.buyer?.email || 'N/A'}`
    });

    await prisma.chat.update({
      where: { id: chat.id },
      data: { discordChannelId: channel.id }
    });

    await channel.send(`**New Support Ticket**\n**User:** ${buyerName} (${chat.buyer?.email || 'Guest'})\n**Type:** ${chat.type}\n\n*Type \`!close\` to close.*`);
    await sleep(1000);
  } catch (err) {
    await prisma.chat.updateMany({
      where: { id: chat.id, discordChannelId: claimToken },
      data: { discordChannelId: null }
    }).catch(() => {});
    throw err;
  }
}

async function createOrderFallbackTicketChannel(guild: any, ticketCategoryId: string, chat: any) {
  if (!chat.order) return;

  const claimToken = `PENDING_ORDER:${process.pid}:${chat.id}`;
  const claim = await prisma.chat.updateMany({
    where: { id: chat.id, discordChannelId: null },
    data: { discordChannelId: claimToken }
  });

  if (!claim.count) return;

  try {
    const buyerName = chat.buyer?.name || 'guest';
    const order = chat.order;
    const channelName = `order-${buyerName}-${order.id.slice(-4)}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: ticketCategoryId,
      topic: `Web ORDER ID: ${order.id} | User: ${chat.buyer?.email || 'N/A'}`
    });

    const itemsStr = order.items.map((i: any) => `${i.quantity}x ${i.product.name}`).join('\n');
    const embed = new EmbedBuilder()
      .setTitle(` New Order Ticket (#${order.id})`)
      .setColor('#00f5ff')
      .addFields(
        { name: 'Customer', value: `${buyerName} (${chat.buyer?.email || 'Guest'})`, inline: true },
        { name: 'Total', value: `${order.total.toFixed(2)} EGP`, inline: true },
        { name: 'Method', value: order.paymentMethod, inline: true },
        { name: 'Items', value: itemsStr || 'None', inline: false }
      )
      .setTimestamp();

    const acceptBtn = new ButtonBuilder().setCustomId(`accept_${order.id}`).setLabel('Confirm Order').setStyle(ButtonStyle.Success);
    const rejectBtn = new ButtonBuilder().setCustomId(`reject_${order.id}`).setLabel('Reject Order').setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptBtn, rejectBtn);

    await channel.send({
      content: `@here  **New Order Placed!** You can chat with the customer below.\n*Type \`!close\` to close the ticket.*`,
      embeds: [embed],
      components: order.status === 'PENDING' ? [row] : []
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { discordChannelId: channel.id }
    });

    await prisma.chat.update({
      where: { id: chat.id },
      data: { discordChannelId: channel.id }
    });

    await sleep(1000);
  } catch (err) {
    await prisma.chat.updateMany({
      where: { id: chat.id, discordChannelId: claimToken },
      data: { discordChannelId: null }
    }).catch(() => {});
    throw err;
  }
}

client.on('clientReady', async () => {
  console.log(`🤖 Discord Bot Logged in as ${client.user?.tag}!`);
  
  // 1. Keep a backup polling loop just in case a notification drops
  setInterval(requestPoll, FALLBACK_POLL_INTERVAL_MS);

  // 2. Postgres LISTEN/NOTIFY -> The Magic!
  // MUST use DIRECT_URL (port 5432) because PgBouncer (port 6543) does NOT support LISTEN/NOTIFY!
  try {
    const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const pgClient = new PgClient({ connectionString: directUrl });
    await pgClient.connect();
    
    pgClient.on('notification', (msg: any) => {
      if (msg.channel === 'bot_sync') {
        requestPoll();
      }
    });

    await pgClient.query('LISTEN bot_sync');
    console.log("⚡ Bot is now LISTENING for instant Postgres realtime events! (NO MORE SPAM POLLING)");
  } catch (err) {
    console.error("Failed to setup PG Listen (fallback polling will still run):", err);
  }

  requestPoll();
});

// COMMANDS & DISCORD->WEB MESSAGE SYNC
client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;

    if (message.content.startsWith('!setorders')) {
      if (!message.member?.permissions.has('Administrator')) return;
      state.orderChannelId = message.channel.id;
      saveState();
      await message.reply('✅ This channel is now set for Order Confirmations.');
      return;
    }

    if (message.content.startsWith('!setlogs')) {
      if (!message.member?.permissions.has('Administrator')) return;
      state.logChannelId = message.channel.id;
      saveState();
      await message.reply('✅ This channel is now set for Logs (like deleted chats).');
      return;
    }

    if (message.content.startsWith('!setbackup')) {
      if (!message.member?.permissions.has('Administrator')) return;
      state.backupChannelId = message.channel.id;
      saveState();
      await message.reply('Backup channel saved for archived tickets.');
      return;
    }

    if (message.content.startsWith('!setup tickets')) {
      if (!message.member?.permissions.has('Administrator')) return;
      try {
        const cat = await message.guild?.channels.create({
          name: 'Tickets',
          type: ChannelType.GuildCategory,
        });
        state.ticketCategoryId = cat?.id || null;
        saveState();
        await message.reply(`✅ Ticket category setup successfully! Category ID: ${state.ticketCategoryId}`);
      } catch (e) {
        console.error(e);
        await message.reply('❌ Failed to create category.');
      }
      return;
    }

    if (message.content.startsWith('!close')) {
      const chat = await prisma.chat.findFirst({
        where: { discordChannelId: message.channel.id }
      });

      if (chat) {
        await prisma.chat.update({
          where: { id: chat.id },
          data: { status: 'CLOSED_BY_DISCORD' }
        });
        await message.reply('🔒 Ticket closed by Discord in database. Deleting channel in 5 seconds...');
      } else {
        await message.reply('🧹 This channel is not linked to a web ticket, but I will delete it anyway in 5 seconds...');
      }
      const channelToDelete = message.channel;
      setTimeout(() => {
        if ("delete" in channelToDelete && typeof channelToDelete.delete === "function") {
          void channelToDelete.delete().catch(() => { });
        }
      }, 5000);
      return;
    }

    if (message.content.startsWith('!transfer')) {
      const mentionedUser = message.mentions.users.first();
      if (!mentionedUser) {
        await message.reply('❌ Please mention a user. Example: `!transfer @user`');
        return;
      }
      await message.reply(`✅ Ticket transferred to ${mentionedUser.toString()}`);
      return;
    }

    // D2W Sync
    const linkedChat = await prisma.chat.findFirst({
      where: { discordChannelId: message.channel.id }
    });

    if (linkedChat) {
      const senderId = await getSystemSenderId();
      await prisma.message.create({
        data: {
          chatId: linkedChat.id,
          senderId,
          content: message.content,
          isAi: false,
          discordMessageId: message.id
        }
      });
      state.processedMessages.push(message.id);
      saveState();
    }
  } catch (err) {
    console.error("Error in messageCreate:", err);
  }
});

// INTERACTION HANDLER (Order ✅/❌ Buttons)
client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isButton()) return;

    const orderId = interaction.customId.split('_')[1];
    if (!orderId) return;

    const action = interaction.customId.split('_')[0];
    if (action === 'accept' || action === 'reject') {
      const nextStatus = action === 'accept' ? 'COMPLETED' : 'CANCELLED';
      const confirmationLabel = action === 'accept' ? 'confirmed' : 'rejected';
      const icon = action === 'accept' ? '✅' : '❌';

      const updated = await prisma.order.updateMany({
        where: {
          id: orderId,
          status: { in: ['PENDING', 'PAID'] }
        },
        data: { status: nextStatus, confirmationSource: 'DISCORD', confirmedByName: interaction.user.tag }
      });

      if (!updated.count) {
        await interaction.reply({
          content: '⚠️ This order was already processed or no longer exists.',
          flags: MessageFlags.Ephemeral
        }).catch(() => { });
        await interaction.message.edit({ components: [] }).catch(() => { });
        return;
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { chat: true }
      });

      if (!order) {
        await interaction.reply({
          content: '⚠️ Order not found after update.',
          flags: MessageFlags.Ephemeral
        }).catch(() => { });
        await interaction.message.edit({ components: [] }).catch(() => { });
        return;
      }

      // Close the associated chat
      if (order.chat) {
        await prisma.chat.update({
          where: { id: order.chat.id },
          data: { status: 'CLOSED_BY_DISCORD' }
        }).catch(() => {});
        // Add system message
        await prisma.message.create({
          data: {
            chatId: order.chat.id,
            content: `${icon} Order ${confirmationLabel} by ${interaction.user.tag} via Discord.`,
            isAi: true
          }
        }).catch(() => {});
      }
      await interaction.reply({
        content: `${icon} Order **${orderId}** ${confirmationLabel} by ${interaction.user.tag}! Ticket will close shortly...`,
        components: []
      });
      await interaction.message.edit({ components: [] }).catch(() => { });
    }
  } catch (err) {
    console.error("Error in interactionCreate:", err);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: '❌ Failed to process. Might already be processed.', flags: MessageFlags.Ephemeral }).catch(() => { });
    }
  }
});

// POLLING LOOP: W2D (Web to Discord)
let isPolling = false;
async function pollDatabase() {
  if (!client.isReady() || isPolling) return;
  isPolling = true;

  try {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    // 1. TICKET CREATION (SUPPORT only - ORDER tickets are created directly by the website)
    const newChats = await prisma.chat.findMany({
      where: {
        type: 'SUPPORT',
        discordChannelId: null
      },
      select: {
        id: true,
        type: true,
        orderId: true,
        order: {
          select: {
            id: true,
            total: true,
            paymentMethod: true,
            status: true,
            items: {
              select: {
                quantity: true,
                product: { select: { name: true } }
              }
            }
          }
        },
        buyer: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: MAX_SUPPORT_TICKETS_PER_PASS
    });

    const ticketCategoryId = newChats.length > 0
      ? await resolveTicketCategoryId(guild)
      : null;

    if (newChats.length > 0 && !ticketCategoryId) {
      console.warn(`[WARN] ⚠️ No ticket category! Run !setup tickets. Missing ${newChats.length} chats.`);
    }

    if (newChats.length > 0 && ticketCategoryId) {
      for (const chat of newChats) {
        try {
          const buyerName = chat.buyer?.name || 'guest';
          const channelName = `support-${buyerName}-${chat.id.slice(-4)}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

          const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: ticketCategoryId,
            topic: `Web ${chat.type} ID: ${chat.id} | User: ${chat.buyer?.email || 'N/A'}`
          });

          // Link channel to Chat
          await prisma.chat.update({
            where: { id: chat.id },
            data: { discordChannelId: channel.id }
          });

          if (chat.type === 'SUPPORT') {
            await channel.send(`🎟️ **New Support Ticket**\n**User:** ${buyerName} (${chat.buyer?.email || 'Guest'})\n**Type:** ${chat.type}\n\n*Type \`!close\` to close.*`);
          } else if (chat.type === 'ORDER' && chat.order) {
            const order = chat.order;
            const itemsStr = order.items.map((i: any) => `${i.quantity}x ${i.product.name}`).join('\n');
            const embed = new EmbedBuilder()
              .setTitle(`🛒 New Order Ticket (#${order.id})`)
              .setColor('#00f5ff')
              .addFields(
                { name: 'Customer', value: `${buyerName} (${chat.buyer?.email || 'Guest'})`, inline: true },
                { name: 'Total', value: `${order.total.toFixed(2)} EGP`, inline: true },
                { name: 'Method', value: order.paymentMethod, inline: true },
                { name: 'Items', value: itemsStr || 'None', inline: false }
              )
              .setTimestamp();

            const acceptBtn = new ButtonBuilder().setCustomId(`accept_${order.id}`).setLabel('✅ Confirm Order').setStyle(ButtonStyle.Success);
            const rejectBtn = new ButtonBuilder().setCustomId(`reject_${order.id}`).setLabel('❌ Reject Order').setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptBtn, rejectBtn);

            await channel.send({ 
              content: `@here 🎟️ **New Order Placed!** You can chat with the customer below.\n*Type \`!close\` to close the ticket.*`, 
              embeds: [embed], 
              components: order.status === 'PENDING' ? [row] : [] 
            });
          }

          await sleep(1000); // Wait 1 sec between creates
        } catch (err) {
          console.error(`Failed to create channel for chat ${chat.id}:`, err);
        }
      }
    }

    // 2. ORDER TICKET FALLBACK
    const fallbackOrderChats = await prisma.chat.findMany({
      where: {
        type: 'ORDER',
        discordChannelId: null,
        createdAt: { lte: new Date(Date.now() - ORDER_TICKET_FALLBACK_DELAY_MS) },
        order: {
          is: {
            discordChannelId: null,
            status: { in: ['PENDING', 'PAID'] }
          }
        }
      },
      select: {
        id: true,
        buyer: {
          select: { name: true, email: true }
        },
        order: {
          select: {
            id: true,
            total: true,
            paymentMethod: true,
            status: true,
            items: {
              select: {
                quantity: true,
                product: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: MAX_ORDER_TICKETS_PER_PASS
    });

    const orderTicketCategoryId = fallbackOrderChats.length > 0
      ? (ticketCategoryId || await resolveTicketCategoryId(guild))
      : null;

    if (fallbackOrderChats.length > 0 && !orderTicketCategoryId) {
      console.warn(`[WARN] No ticket category for order fallback. Missing ${fallbackOrderChats.length} order chats.`);
    }

    if (fallbackOrderChats.length > 0 && orderTicketCategoryId) {
      for (const chat of fallbackOrderChats) {
        try {
          await createOrderFallbackTicketChannel(guild, orderTicketCategoryId, chat);
        } catch (err) {
          console.error(`Failed to create fallback order ticket for chat ${chat.id}:`, err);
        }
      }
    }

    // 3. TICKET MESSAGES SYNC
    const unsyncedMessages = await prisma.message.findMany({
      where: {
        discordMessageId: null,
        chat: { discordChannelId: { not: null } }
      },
      select: {
        id: true,
        content: true,
        chat: { select: { discordChannelId: true } },
        sender: { select: { name: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: MAX_MESSAGES_PER_PASS
    });

    for (const msg of unsyncedMessages) {
      if (state.processedMessages.includes(msg.id)) continue;

      const channelId = msg.chat.discordChannelId;
      if (!channelId) continue;

      const channel = guild.channels.cache.get(channelId) as TextChannel;
      if (channel) {
        try {
          const claimToken = `PENDING:${process.pid}:${msg.id}`;
          const claim = await prisma.message.updateMany({
            where: { id: msg.id, discordMessageId: null },
            data: { discordMessageId: claimToken }
          });

          if (!claim.count) continue;

          const senderName = msg.sender?.name || 'Customer';
          const dMsg = await channel.send(`**[${senderName}]**: ${msg.content || '[Attachment/Image]'}`);

          await prisma.message.update({
            where: { id: msg.id },
            data: { discordMessageId: dMsg.id }
          });
          state.processedMessages.push(msg.id);
          saveState();
          await sleep(500); // rate limiting safety
        } catch (e) {
          await prisma.message.updateMany({
            where: { id: msg.id, discordMessageId: { startsWith: `PENDING:${process.pid}:` } },
            data: { discordMessageId: null }
          }).catch(() => {});
          console.error("Message sync error:", e);
        }
      }
    }

    // 3. CLEANUP DELETED CHATS
    const deletedChats = await prisma.chat.findMany({
      where: { status: 'DELETED' },
      select: { id: true, type: true, buyerId: true, discordChannelId: true },
      take: MAX_CLEANUP_ITEMS_PER_PASS
    });

    for (const chat of deletedChats) {
      if (chat.discordChannelId) {
        const channel = guild.channels.cache.get(chat.discordChannelId) as TextChannel;
        if (channel) {
          await channel.delete().catch(() => { });
        }
      }

      // Send audit log to a system channel if logChannelId is set, or just skip
      const logTarget = state.logChannelId || state.orderChannelId;
      if (logTarget) {
        const logChannel = guild.channels.cache.get(logTarget) as TextChannel;
        if (logChannel) {
          await logChannel.send(`🗑️ **Chat Deleted:** A chat (ID: ${chat.id}, Type: ${chat.type}, User: ${chat.buyerId}) was deleted from the website.`);
        }
      }

      // Hard delete from DB
      await prisma.message.deleteMany({ where: { chatId: chat.id } }).catch(() => { });
      await prisma.chat.delete({ where: { id: chat.id } }).catch(() => { });
    }

    // 4. HANDLE CLOSED CHATS FROM WEB
    const webClosedChats = await prisma.chat.findMany({
      where: { status: 'CLOSED_BY_WEB', discordChannelId: { not: null } },
      select: { id: true, discordChannelId: true },
      take: MAX_CLEANUP_ITEMS_PER_PASS
    });

    for (const chat of webClosedChats) {
      if (chat.discordChannelId) {
        const channel = guild.channels.cache.get(chat.discordChannelId) as TextChannel;
        if (channel) {
          try {
            await channel.send('🔒 **Ticket Closed by Website.** This channel will be deleted in 10 seconds to keep the server clean...');
            setTimeout(() => channel.delete().catch(() => { }), 10000);
          } catch (e) { }
        }
      }

      // Unlink discord channel so we don't process it again
      await prisma.chat.update({
        where: { id: chat.id },
        data: { discordChannelId: null }
      }).catch(() => { });
    }

    // 5. REMOVED (UNIFIED INTO SECTION 1)

    // 6. CLEANUP RESOLVED PAYMENT TICKETS
    const resolvedOrders = await prisma.order.findMany({
      where: {
        status: { in: ['COMPLETED', 'CANCELLED'] },
        discordChannelId: { not: null }
      },
      select: {
        id: true,
        status: true,
        discordChannelId: true,
        confirmationSource: true,
        chat: { select: { id: true } }
      },
      take: MAX_CLEANUP_ITEMS_PER_PASS
    });

    for (const order of resolvedOrders) {
      if (order.discordChannelId) {
        const channel = guild.channels.cache.get(order.discordChannelId) as TextChannel;
        if (channel) {
          try {
            const source = order.confirmationSource === 'DISCORD' ? 'Discord Staff' : 'Website Admin';
            await channel.send(`🔒 **Order ${order.status} by ${source}**. This ticket will be deleted in 10 seconds...`);
            await archiveResolvedOrder(guild, order).catch(() => {});
          } catch (e) { }
        }
      }

      // Unlink both Order and Chat from Discord channel
      await prisma.order.update({
        where: { id: order.id },
        data: { discordChannelId: null }
      }).catch(() => { });

      if (order.chat) {
        await prisma.chat.update({
          where: { id: order.chat.id },
          data: { discordChannelId: null }
        }).catch(() => { });
      }
    }

  } catch (err) {
    console.error('Polling critical error:', err);
  } finally {
    isPolling = false;
    if (pendingPoll) {
      pendingPoll = false;
      requestPoll();
    }
  }
}

// Handle global uncaught errors to prevent complete crash
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});
process.on('beforeExit', () => {
  if (stateFlushTimer) clearTimeout(stateFlushTimer);
  flushState();
});

client.login(TOKEN);
