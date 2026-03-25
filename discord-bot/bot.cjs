"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// discord-bot/index.ts
var import_discord = require("discord.js");
var import_client = require("@prisma/client");
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_config = require("dotenv/config");
var prisma = new import_client.PrismaClient();
var client = new import_discord.Client({
  intents: [
    import_discord.GatewayIntentBits.Guilds,
    import_discord.GatewayIntentBits.GuildMessages,
    import_discord.GatewayIntentBits.MessageContent
  ],
  partials: [import_discord.Partials.Message, import_discord.Partials.Channel]
});
var TOKEN = process.env.DISCORD_TOKEN || "YOUR_DISCORD_TOKEN_HERE";
var CONFIG_FILE = import_path.default.join(__dirname, "bot-config.json");
var state = {
  orderChannelId: null,
  ticketCategoryId: null,
  logChannelId: null,
  processedOrders: [],
  processedMessages: []
};
try {
  if (import_fs.default.existsSync(CONFIG_FILE)) {
    state = JSON.parse(import_fs.default.readFileSync(CONFIG_FILE, "utf-8"));
  }
} catch (e) {
  console.log("No config file found, starting fresh.");
}
function saveState() {
  if (state.processedOrders.length > 300) state.processedOrders = state.processedOrders.slice(-300);
  if (state.processedMessages.length > 1e3) state.processedMessages = state.processedMessages.slice(-1e3);
  import_fs.default.writeFileSync(CONFIG_FILE, JSON.stringify(state));
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
client.on("ready", () => {
  console.log(`\u{1F916} Discord Bot Logged in as ${client.user?.tag}!`);
  setInterval(pollDatabase, 5e3);
});
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message.content.startsWith("!setorders")) {
      if (!message.member?.permissions.has("Administrator")) return;
      state.orderChannelId = message.channel.id;
      saveState();
      await message.reply("\u2705 This channel is now set for Order Confirmations.");
      return;
    }
    if (message.content.startsWith("!setlogs")) {
      if (!message.member?.permissions.has("Administrator")) return;
      state.logChannelId = message.channel.id;
      saveState();
      await message.reply("\u2705 This channel is now set for Logs (like deleted chats).");
      return;
    }
    if (message.content.startsWith("!setup tickets")) {
      if (!message.member?.permissions.has("Administrator")) return;
      try {
        const cat = await message.guild?.channels.create({
          name: "Tickets",
          type: import_discord.ChannelType.GuildCategory
        });
        state.ticketCategoryId = cat?.id || null;
        saveState();
        await message.reply(`\u2705 Ticket category setup successfully! Category ID: ${state.ticketCategoryId}`);
      } catch (e) {
        console.error(e);
        await message.reply("\u274C Failed to create category.");
      }
      return;
    }
    if (message.content.startsWith("!close")) {
      const chat = await prisma.chat.findFirst({
        where: { discordChannelId: message.channel.id }
      });
      if (chat) {
        await prisma.chat.update({
          where: { id: chat.id },
          data: { status: "CLOSED_BY_DISCORD" }
        });
        await message.reply("\u{1F512} Ticket closed by Discord in database. Deleting channel in 5 seconds...");
      } else {
        await message.reply("\u{1F9F9} This channel is not linked to a web ticket, but I will delete it anyway in 5 seconds...");
      }
      setTimeout(() => message.channel.delete().catch(() => {
      }), 5e3);
      return;
    }
    if (message.content.startsWith("!transfer")) {
      const mentionedUser = message.mentions.users.first();
      if (!mentionedUser) {
        await message.reply("\u274C Please mention a user. Example: `!transfer @user`");
        return;
      }
      await message.reply(`\u2705 Ticket transferred to ${mentionedUser.toString()}`);
      return;
    }
    const linkedChat = await prisma.chat.findFirst({
      where: { discordChannelId: message.channel.id }
    });
    if (linkedChat) {
      const adminUser = await prisma.user.findFirst({ where: { role: "OWNER" } });
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
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    const orderId = interaction.customId.split("_")[1];
    if (!orderId) return;
    const action = interaction.customId.split("_")[0];
    if (action === "accept") {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "COMPLETED", confirmationSource: "DISCORD", confirmedByName: interaction.user.tag },
        include: { chat: true }
      });
      if (order.chat) {
        await prisma.chat.update({
          where: { id: order.chat.id },
          data: { status: "CLOSED_BY_DISCORD" }
        }).catch(() => {
        });
        await prisma.message.create({
          data: { chatId: order.chat.id, content: `\u2705 Order confirmed by ${interaction.user.tag} via Discord.`, isAi: true }
        }).catch(() => {
        });
      }
      await interaction.reply({ content: `\u2705 Order **${orderId}** confirmed by ${interaction.user.tag}! Ticket will close shortly...`, components: [] });
      await interaction.message.edit({ components: [] }).catch(() => {
      });
    } else if (action === "reject") {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", confirmationSource: "DISCORD", confirmedByName: interaction.user.tag },
        include: { chat: true }
      });
      if (order.chat) {
        await prisma.chat.update({
          where: { id: order.chat.id },
          data: { status: "CLOSED_BY_DISCORD" }
        }).catch(() => {
        });
        await prisma.message.create({
          data: { chatId: order.chat.id, content: `\u274C Order rejected by ${interaction.user.tag} via Discord.`, isAi: true }
        }).catch(() => {
        });
      }
      await interaction.reply({ content: `\u274C Order **${orderId}** rejected by ${interaction.user.tag}. Ticket will close shortly...`, components: [] });
      await interaction.message.edit({ components: [] }).catch(() => {
      });
    }
  } catch (err) {
    console.error("Error in interactionCreate:", err);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: "\u274C Failed to process. Might already be processed.", ephemeral: true }).catch(() => {
      });
    }
  }
});
var isPolling = false;
async function pollDatabase() {
  if (!client.isReady() || isPolling) return;
  isPolling = true;
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return;
    const newChats = await prisma.chat.findMany({
      where: { discordChannelId: null, type: "SUPPORT" },
      include: { buyer: true },
      take: 5
      // Process max 5 at a time to prevent rate limits
    });
    if (newChats.length > 0 && !state.ticketCategoryId) {
      console.warn(`[WARN] \u26A0\uFE0F No ticket category! Run !setup tickets. Missing ${newChats.length} chats.`);
    }
    if (newChats.length > 0 && state.ticketCategoryId) {
      for (const chat of newChats) {
        try {
          const buyerName = chat.buyer?.name || "guest";
          const channelName = `ticket-${buyerName}-${chat.id.slice(-4)}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
          const channel = await guild.channels.create({
            name: channelName,
            type: import_discord.ChannelType.GuildText,
            parent: state.ticketCategoryId,
            topic: `Web Ticket ID: ${chat.id} | User: ${chat.buyer?.email || "N/A"}`
          });
          await prisma.chat.update({
            where: { id: chat.id },
            data: { discordChannelId: channel.id }
          });
          await channel.send(`\u{1F39F}\uFE0F **New Support Ticket Created**
**User:** ${buyerName} (${chat.buyer?.email || "Guest"})
**Type:** ${chat.type}

*Type \`!close\` to close.*`);
          await sleep(1e3);
        } catch (err) {
          console.error(`Failed to create channel for chat ${chat.id}:`, err);
        }
      }
    }
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
      const channel = guild.channels.cache.get(channelId);
      if (channel) {
        try {
          const senderName = msg.sender?.name || "Customer";
          const dMsg = await channel.send(`**[${senderName}]**: ${msg.content || "[Attachment/Image]"}`);
          await prisma.message.update({
            where: { id: msg.id },
            data: { discordMessageId: dMsg.id }
          });
          state.processedMessages.push(msg.id);
          saveState();
          await sleep(500);
        } catch (e) {
          console.error("Message sync error:", e);
        }
      }
    }
    const deletedChats = await prisma.chat.findMany({
      where: { status: "DELETED" },
      take: 5
    });
    for (const chat of deletedChats) {
      if (chat.discordChannelId) {
        const channel = guild.channels.cache.get(chat.discordChannelId);
        if (channel) {
          await channel.delete().catch(() => {
          });
        }
      }
      const logTarget = state.logChannelId || state.orderChannelId;
      if (logTarget) {
        const logChannel = guild.channels.cache.get(logTarget);
        if (logChannel) {
          await logChannel.send(`\u{1F5D1}\uFE0F **Chat Deleted:** A chat (ID: ${chat.id}, Type: ${chat.type}, User: ${chat.buyerId}) was deleted from the website.`);
        }
      }
      await prisma.message.deleteMany({ where: { chatId: chat.id } }).catch(() => {
      });
      await prisma.chat.delete({ where: { id: chat.id } }).catch(() => {
      });
    }
    const webClosedChats = await prisma.chat.findMany({
      where: { status: "CLOSED_BY_WEB", discordChannelId: { not: null } },
      take: 5
    });
    for (const chat of webClosedChats) {
      if (chat.discordChannelId) {
        const channel = guild.channels.cache.get(chat.discordChannelId);
        if (channel) {
          try {
            await channel.send("\u{1F512} **Ticket Closed by Website.** This channel will be deleted in 10 seconds to keep the server clean...");
            setTimeout(() => channel.delete().catch(() => {
            }), 1e4);
          } catch (e) {
          }
        }
      }
      await prisma.chat.update({
        where: { id: chat.id },
        data: { discordChannelId: null }
      }).catch(() => {
      });
    }
    if (state.ticketCategoryId) {
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: "PENDING",
          paymentMethod: { in: ["VODAFONE_CASH", "INSTAPAY", "VODAFONE", "PAYPAL"] },
          discordChannelId: null,
          receiptImageUrl: { not: null }
        },
        include: { user: true, items: { include: { product: true } }, chat: true },
        orderBy: { createdAt: "desc" },
        take: 5
      });
      for (const order of pendingOrders) {
        try {
          const buyerName = order.user?.name || "guest";
          const channelName = `payment-${buyerName}-${order.id.slice(-4)}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
          const channel = await guild.channels.create({
            name: channelName,
            type: import_discord.ChannelType.GuildText,
            parent: state.ticketCategoryId,
            topic: `Payment Order #${order.id} | User: ${order.user?.email || "N/A"} | Chat with customer here`
          });
          await prisma.order.update({
            where: { id: order.id },
            data: { discordChannelId: channel.id }
          });
          if (order.chat) {
            await prisma.chat.update({
              where: { id: order.chat.id },
              data: { discordChannelId: channel.id }
            });
          }
          const itemsStr = order.items.map((i) => `${i.quantity}x ${i.product.name}`).join("\n");
          const embed = new import_discord.EmbedBuilder().setTitle(`\u{1F6A8} Payment Confirmation Required (#${order.id})`).setColor("#00f5ff").addFields(
            { name: "Customer", value: `${buyerName} (${order.user?.email || "Guest"})`, inline: true },
            { name: "Total", value: `${order.total.toFixed(2)} EGP`, inline: true },
            { name: "Method", value: order.paymentMethod, inline: true },
            { name: "Phone", value: order.senderPhoneNumber || "N/A", inline: false },
            { name: "Items", value: itemsStr || "None", inline: false }
          ).setTimestamp();
          let attachment;
          if (order.receiptImageUrl) {
            if (order.receiptImageUrl.startsWith("data:")) {
              embed.addFields({ name: "\u{1F4F7} Receipt", value: "Receipt image uploaded (view on website)", inline: false });
            } else if (order.receiptImageUrl.startsWith("/uploads/")) {
              try {
                const filePath = import_path.default.join(process.cwd(), "public", order.receiptImageUrl);
                if (import_fs.default.existsSync(filePath)) {
                  attachment = new import_discord.AttachmentBuilder(filePath, { name: "receipt.png" });
                  embed.setImage("attachment://receipt.png");
                } else {
                  embed.addFields({ name: "\u{1F4F7} Receipt", value: `[View Receipt Document](${order.receiptImageUrl})`, inline: false });
                }
              } catch (e) {
                console.error("Error reading receipt image:", e);
              }
            } else {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cipherr-store.vercel.app";
              const imageUrl = order.receiptImageUrl.startsWith("http") ? order.receiptImageUrl : `${baseUrl}${order.receiptImageUrl}`;
              embed.setImage(imageUrl);
            }
          }
          const acceptBtn = new import_discord.ButtonBuilder().setCustomId(`accept_${order.id}`).setLabel("\u2705 Confirm Order").setStyle(import_discord.ButtonStyle.Success);
          const rejectBtn = new import_discord.ButtonBuilder().setCustomId(`reject_${order.id}`).setLabel("\u274C Reject Order").setStyle(import_discord.ButtonStyle.Danger);
          const row = new import_discord.ActionRowBuilder().addComponents(acceptBtn, rejectBtn);
          const messageOptions = { content: "@here \u{1F39F}\uFE0F **New Payment Ticket** \u2014 Confirm or chat with the customer below:", embeds: [embed], components: [row] };
          if (attachment) messageOptions.files = [attachment];
          await channel.send(messageOptions);
          await sleep(1e3);
        } catch (e) {
          console.error(`Order payment ticket fail ${order.id}`, e);
        }
      }
    }
    const resolvedOrders = await prisma.order.findMany({
      where: {
        status: { in: ["COMPLETED", "CANCELLED"] },
        discordChannelId: { not: null }
      },
      include: { chat: true },
      take: 5
    });
    for (const order of resolvedOrders) {
      if (order.discordChannelId) {
        const channel = guild.channels.cache.get(order.discordChannelId);
        if (channel) {
          try {
            const source = order.confirmationSource === "DISCORD" ? "Discord Staff" : "Website Admin";
            await channel.send(`\u{1F512} **Order ${order.status} by ${source}**. This ticket will be deleted in 10 seconds...`);
            setTimeout(() => channel.delete().catch(() => {
            }), 1e4);
          } catch (e) {
          }
        }
      }
      await prisma.order.update({
        where: { id: order.id },
        data: { discordChannelId: null }
      }).catch(() => {
      });
      if (order.chat) {
        await prisma.chat.update({
          where: { id: order.chat.id },
          data: { discordChannelId: null }
        }).catch(() => {
        });
      }
    }
  } catch (err) {
    console.error("Polling critical error:", err);
  } finally {
    isPolling = false;
  }
}
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
client.login(TOKEN);
