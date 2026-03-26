import prisma from "@/lib/prisma"

type SupportChatOptions = {
  buyerId: string
  initialMessage?: {
    senderId: string
    content: string
  }
}

export async function getOrCreateOngoingSupportChat(options: SupportChatOptions) {
  return prisma.$transaction(async (tx) => {
    // Serialize support ticket creation per buyer to avoid duplicate open chats during bursts.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`support-chat:${options.buyerId}`}))`

    const existing = await tx.chat.findFirst({
      where: {
        buyerId: options.buyerId,
        type: "SUPPORT",
        status: "ONGOING",
      },
      select: { id: true },
    })

    if (existing) {
      return { chatId: existing.id, created: false }
    }

    const chat = await tx.chat.create({
      data: {
        type: "SUPPORT",
        buyerId: options.buyerId,
        status: "ONGOING",
      } as any,
      select: { id: true },
    })

    if (options.initialMessage) {
      await tx.message.create({
        data: {
          chatId: chat.id,
          senderId: options.initialMessage.senderId,
          content: options.initialMessage.content,
        },
      })
    }

    return { chatId: chat.id, created: true }
  })
}
