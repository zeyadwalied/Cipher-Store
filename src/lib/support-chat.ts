import prisma from "@/lib/prisma"

type SupportChatOptions = {
  buyerId: string
  initialMessage?: {
    senderId: string
    content: string
  }
}

async function appendInitialMessage(
  db: Pick<typeof prisma, "message">,
  chatId: string,
  initialMessage?: SupportChatOptions["initialMessage"]
) {
  if (!initialMessage?.senderId || !initialMessage.content) {
    return
  }

  await db.message.create({
    data: {
      chatId,
      senderId: initialMessage.senderId,
      content: initialMessage.content,
    },
  })
}

async function createOrReuseSupportChatWithLock(options: SupportChatOptions) {
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
      await appendInitialMessage(tx, existing.id, options.initialMessage)
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

    await appendInitialMessage(tx, chat.id, options.initialMessage)

    return { chatId: chat.id, created: true }
  })
}

async function createOrReuseSupportChatFallback(options: SupportChatOptions) {
  const existing = await prisma.chat.findFirst({
    where: {
      buyerId: options.buyerId,
      type: "SUPPORT",
      status: "ONGOING",
    },
    select: { id: true },
  })

  if (existing) {
    await appendInitialMessage(prisma, existing.id, options.initialMessage)
    return { chatId: existing.id, created: false }
  }

  const chat = await prisma.chat.create({
    data: {
      type: "SUPPORT",
      buyerId: options.buyerId,
      status: "ONGOING",
    } as any,
    select: { id: true },
  })

  await appendInitialMessage(prisma, chat.id, options.initialMessage)

  return { chatId: chat.id, created: true }
}

export async function getOrCreateOngoingSupportChat(options: SupportChatOptions) {
  try {
    return await createOrReuseSupportChatWithLock(options)
  } catch (error) {
    console.error("Support chat locked creation failed, using fallback:", error)
    return createOrReuseSupportChatFallback(options)
  }
}
