"use client"

import dynamic from "next/dynamic"

export const AiChatWidgetLoader = dynamic(
  () => import("@/components/ai-chat").then((mod) => mod.AiChatWidget),
  {
    ssr: false,
    loading: () => null,
  }
)
