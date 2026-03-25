import { Client, GatewayIntentBits, Partials, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, CategoryChannel, TextChannel, Message, AttachmentBuilder } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import "dotenv/config";

const prisma = new PrismaClient();

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

client.on('ready', () => {
  console.log(`🤖 Discord Bot Logged in as ${client.user?.tag}!`);
  setInterval(pollDatabase, 5000); // 5 seconds instead of 3 to avoid rate limits
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

    // 1. TICKET CREATION (SUPPORT chats only — ORDER chats get a unified ticket via Section 5)
    const newChats = await prisma.chat.findMany({
      where: { discordChannelId: null, type: 'SUPPORT' },
      include: { buyer: true },
      take: 5 // Process max 5 at a time to prevent rate limits
    });

    if (newChats.length > 0 && !state.ticketCategoryId) {
      console.warn(`[WARN] ⚠️ No ticket category! Run !setup tickets. Missing ${newChats.length} chats.`);
    }

    if (newChats.length > 0 && state.ticketCategoryId) {
      for (const chat of newChats) {
        try {
          const buyerName = chat.buyer?.name || 'guest';
          const channelName = `ticket-${buyerName}-${chat.id.slice(-4)}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

          const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: state.ticketCategoryId,
            topic: `Web Ticket ID: ${chat.id} | User: ${chat.buyer?.email || 'N/A'}`
          });

          await prisma.chat.update({
            where: { id: chat.id },
            data: { discordChannelId: channel.id }
          });

          await channel.send(`🎟️ **New Support Ticket Created**\n**User:** ${buyerName} (${chat.buyer?.email || 'Guest'})\n**Type:** ${chat.type}\n\n*Type \`!close\` to close.*`);
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

    // 5. UNIFIED PAYMENT + CHAT TICKETS (only after receipt is uploaded)
    if (state.ticketCategoryId) {
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: 'PENDING',
          paymentMethod: { in: ['VODAFONE_CASH', 'INSTAPAY', 'VODAFONE', 'PAYPAL'] },
          discordChannelId: null,
          receiptImageUrl: { not: null }
        },
        include: { user: true, items: { include: { product: true } }, chat: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      for (const order of pendingOrders) {
        try {
          const buyerName = order.user?.name || 'guest';
          const channelName = `payment-${buyerName}-${order.id.slice(-4)}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

          const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: state.ticketCategoryId,
            topic: `Payment Order #${order.id} | User: ${order.user?.email || 'N/A'} | Chat with customer here`
          });

          // Link channel to BOTH Order AND Chat (unified ticket)
          await prisma.order.update({
            where: { id: order.id },
            data: { discordChannelId: channel.id }
          });

          // Also link the associated chat so messages sync to this same channel
          if (order.chat) {
            await prisma.chat.update({
              where: { id: order.chat.id },
              data: { discordChannelId: channel.id }
            });
          }

          const itemsStr = order.items.map((i: any) => `${i.quantity}x ${i.product.name}`).join('\n');
          const embed = new EmbedBuilder()
            .setTitle(`🚨 Payment Confirmation Required (#${order.id})`)
            .setColor('#00f5ff')
            .addFields(
              { name: 'Customer', value: `${buyerName} (${order.user?.email || 'Guest'})`, inline: true },
              { name: 'Total', value: `${order.total.toFixed(2)} EGP`, inline: true },
              { name: 'Method', value: order.paymentMethod, inline: true },
              { name: 'Phone', value: order.senderPhoneNumber || 'N/A', inline: false },
              { name: 'Items', value: itemsStr || 'None', inline: false }
            )
            .setTimestamp();

          let attachment;
          if (order.receiptImageUrl) {
            if (order.receiptImageUrl.startsWith('data:')) {
              // Base64 images can't be embedded in Discord — add a note
              embed.addFields({ name: '📷 Receipt', value: 'Receipt image uploaded (view on website)', inline: false });
            } else if (order.receiptImageUrl.startsWith('/uploads/')) {
              // Local file upload - read from disk and attach so Discord can render it even on localhost
              try {
                const filePath = path.join(process.cwd(), 'public', order.receiptImageUrl);
                if (fs.existsSync(filePath)) {
                  attachment = new AttachmentBuilder(filePath, { name: 'receipt.png' });
                  embed.setImage('attachment://receipt.png');
                } else {
                  // Fallback
                  embed.addFields({ name: '📷 Receipt', value: `[View Receipt Document](${order.receiptImageUrl})`, inline: false });
                }
              } catch (e) {
                console.error("Error reading receipt image:", e);
              }
            } else {
              // External http URL 
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cipherr-store.vercel.app';
              const imageUrl = order.receiptImageUrl.startsWith('http')
                ? order.receiptImageUrl
                : `${baseUrl}${order.receiptImageUrl}`;
              embed.setImage(imageUrl);
            }
          }

          const acceptBtn = new ButtonBuilder().setCustomId(`accept_${order.id}`).setLabel('✅ Confirm Order').setStyle(ButtonStyle.Success);
          const rejectBtn = new ButtonBuilder().setCustomId(`reject_${order.id}`).setLabel('❌ Reject Order').setStyle(ButtonStyle.Danger);
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptBtn, rejectBtn);

          const messageOptions: any = { content: '@here 🎟️ **New Payment Ticket** — Confirm or chat with the customer below:', embeds: [embed], components: [row] };
          if (attachment) messageOptions.files = [attachment];

          await channel.send(messageOptions);
          await sleep(1000);
        } catch (e) {
          console.error(`Order payment ticket fail ${order.id}`, e);
        }
      }
    }

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
