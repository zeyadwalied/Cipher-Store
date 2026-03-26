import { Client, GatewayIntentBits, Partials, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, CategoryChannel, TextChannel, Message, AttachmentBuilder } from 'discord.js';
import prisma from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';
import "dotenv/config";
import { Client as PgClient } from 'pg'; // <-- ADDED FOR INSTANT REALTIME SYNC

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

const TOKEN = process.env.DISCORD_TOKEN || "YOUR_DISCORD_TOKEN_HERE";

const CONFIG_FILE = path.join(__dirname, 'bot-config.json');

// Memory variables
let state = {
  orderChannelId: null as string | null,
  ticketCategoryId: null as string | null,
  logChannelId: null as string | null,
  processedOrders: [] as string[],
  processedMessages: [] as string[]
};

// Load state from file if exists
try {
  if (fs.existsSync(CONFIG_FILE)) {
    state = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
} catch (e) {
  console.log("No config file found, starting fresh.");
}

function saveState() {
  // keep sets small
  if (state.processedOrders.length > 300) state.processedOrders = state.processedOrders.slice(-300);
  if (state.processedMessages.length > 1000) state.processedMessages = state.processedMessages.slice(-1000);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(state));
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

client.on('ready', async () => {
  console.log(`🤖 Discord Bot Logged in as ${client.user?.tag}!`);
  
  // 1. Keep a backup polling loop just in case a notification drops
  setInterval(pollDatabase, 15000); // Every 15 seconds as safety net

  // 2. Postgres LISTEN/NOTIFY -> The Magic!
  // MUST use DIRECT_URL (port 5432) because PgBouncer (port 6543) does NOT support LISTEN/NOTIFY!
  try {
    const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const pgClient = new PgClient({ connectionString: directUrl });
    await pgClient.connect();
    
    pgClient.on('notification', (msg: any) => {
      if (msg.channel === 'bot_sync') {
        // Trigger poll instantly when the website says a new item exists!
        pollDatabase();
      }
    });

    await pgClient.query('LISTEN bot_sync');
    console.log("⚡ Bot is now LISTENING for instant Postgres realtime events! (NO MORE SPAM POLLING)");
  } catch (err) {
    console.error("Failed to setup PG Listen (fallback polling will still run):", err);
  }
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
      setTimeout(() => message.channel.delete().catch(() => { }), 5000);
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
      const adminUser = await prisma.user.findFirst({ where: { role: 'OWNER' } });
      await prisma.message.create({
        data: {
          chatId: linkedChat.id,
          senderId: adminUser?.id || null,
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
    if (action === 'accept') {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', confirmationSource: 'DISCORD', confirmedByName: interaction.user.tag },
        include: { chat: true }
      });
      // Close the associated chat
      if (order.chat) {
        await prisma.chat.update({
          where: { id: order.chat.id },
          data: { status: 'CLOSED_BY_DISCORD' }
        }).catch(() => {});
        // Add system message
        await prisma.message.create({
          data: { chatId: order.chat.id, content: `✅ Order confirmed by ${interaction.user.tag} via Discord.`, isAi: true }
        }).catch(() => {});
      }
      await interaction.reply({ content: `✅ Order **${orderId}** confirmed by ${interaction.user.tag}! Ticket will close shortly...`, components: [] });
      await interaction.message.edit({ components: [] }).catch(() => { });
    } else if (action === 'reject') {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', confirmationSource: 'DISCORD', confirmedByName: interaction.user.tag },
        include: { chat: true }
      });
      // Close the associated chat
      if (order.chat) {
        await prisma.chat.update({
          where: { id: order.chat.id },
          data: { status: 'CLOSED_BY_DISCORD' }
        }).catch(() => {});
        await prisma.message.create({
          data: { chatId: order.chat.id, content: `❌ Order rejected by ${interaction.user.tag} via Discord.`, isAi: true }
        }).catch(() => {});
      }
      await interaction.reply({ content: `❌ Order **${orderId}** rejected by ${interaction.user.tag}. Ticket will close shortly...`, components: [] });
      await interaction.message.edit({ components: [] }).catch(() => { });
    }
  } catch (err) {
    console.error("Error in interactionCreate:", err);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: '❌ Failed to process. Might already be processed.', ephemeral: true }).catch(() => { });
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

    // 1. TICKET CREATION (ALL CHATS: SUPPORT and ORDER)
    const newChats = await prisma.chat.findMany({
      where: { discordChannelId: null },
      include: { 
        buyer: true,
        order: {
          include: { 
            items: { include: { product: true } } 
          }
        }
      },
      take: 5 // Process max 5 at a time to prevent rate limits
    });

    if (newChats.length > 0 && !state.ticketCategoryId) {
      console.warn(`[WARN] ⚠️ No ticket category! Run !setup tickets. Missing ${newChats.length} chats.`);
    }

    if (newChats.length > 0 && state.ticketCategoryId) {
      for (const chat of newChats) {
        try {
          const buyerName = chat.buyer?.name || 'guest';
          const prefix = chat.type === 'ORDER' ? 'order' : 'support';
          const channelName = `${prefix}-${buyerName}-${chat.id.slice(-4)}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

          const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: state.ticketCategoryId,
            topic: `Web ${chat.type} ID: ${chat.id} | User: ${chat.buyer?.email || 'N/A'}`
          });

          // Link channel to Chat
          await prisma.chat.update({
            where: { id: chat.id },
            data: { discordChannelId: channel.id }
          });

          // Also link to Order
          if (chat.orderId) {
            await prisma.order.update({
              where: { id: chat.orderId },
              data: { discordChannelId: channel.id }
            }).catch(() => {});
          }

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

    // 2. TICKET MESSAGES SYNC
    const unsyncedMessages = await prisma.message.findMany({
      where: {
        discordMessageId: null,
        chat: { discordChannelId: { not: null } }
      },
      include: { chat: true, sender: true },
      take: 10
    });

    for (const msg of unsyncedMessages) {
      if (state.processedMessages.includes(msg.id)) continue;

      const channelId = msg.chat.discordChannelId;
      if (!channelId) continue;

      const channel = guild.channels.cache.get(channelId) as TextChannel;
      if (channel) {
        try {
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
          console.error("Message sync error:", e);
        }
      }
    }

    // 3. CLEANUP DELETED CHATS
    const deletedChats = await prisma.chat.findMany({
      where: { status: 'DELETED' },
      take: 5
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
      take: 5
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
      include: { chat: true },
      take: 5
    });

    for (const order of resolvedOrders) {
      if (order.discordChannelId) {
        const channel = guild.channels.cache.get(order.discordChannelId) as TextChannel;
        if (channel) {
          try {
            const source = order.confirmationSource === 'DISCORD' ? 'Discord Staff' : 'Website Admin';
            await channel.send(`🔒 **Order ${order.status} by ${source}**. This ticket will be deleted in 10 seconds...`);
            setTimeout(() => channel.delete().catch(() => { }), 10000);
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
  }
}

// Handle global uncaught errors to prevent complete crash
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

client.login(TOKEN);
