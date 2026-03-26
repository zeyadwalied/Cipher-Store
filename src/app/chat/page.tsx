"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MessageSquare, Package, LifeBuoy, ReceiptText } from "lucide-react"
import { CyberBackgroundBranches } from "@/components/CyberBackgroundBranches"

function getMessagePreview(content?: string) {
  if (!content) return ""

  if (content.includes("Buyer uploaded Payment Receipt")) {
    return "Payment receipt uploaded."
  }

  return content
}

export default function ChatListPage() {
  const [chats, setChats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats")
      if (res.ok) {
        setChats(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const createSupportChat = async () => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SUPPORT" })
      })
      if (res.ok) {
        const chat = await res.json()
        window.location.href = `/chat/${chat.id}`
      }
    } catch (e) {
      console.error("Failed to create support chat", e)
    }
  }

  return (
    <CyberBackgroundBranches 
      primaryColor="#a855f7" 
      secondaryColor="#00f5ff" 
      accentColor="#ffd700"
      opacity={0.3}
      className="min-h-screen"
    >
      <div className="mx-auto min-h-[70vh] w-full max-w-5xl px-4 py-12">
      <div className="mx-auto mb-8 flex w-full max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-[#a855f7]" /> Your Messages
        </h1>
        <button 
          onClick={createSupportChat}
          className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20 font-bold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <LifeBuoy className="h-5 w-5" /> Contact Support
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading your chats...</div>
      ) : chats.length === 0 ? (
        <div className="mx-auto w-full max-w-3xl text-center py-12 bg-[#141417] border border-[#27272a] rounded-xl text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p>You have no active chats.</p>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-3xl gap-4">
          {chats.map(chat => (
            <Link key={chat.id} href={`/chat/${chat.id}`} className="block w-full rounded-2xl border border-[#27272a] bg-[#141417]/95 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5 hover:border-[#a855f7]/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center ${chat.type === "SUPPORT" ? "bg-yellow-500/20 text-yellow-500" : "bg-[#a855f7]/20 text-[#a855f7]"}`}>
                    {chat.type === "SUPPORT" ? <LifeBuoy /> : <Package />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 truncate text-lg font-bold text-white">
                       {chat.type === "SUPPORT" ? "Support Chat" : `Order #${chat.order?.id || "Unknown"}`}
                    </h2>
                    <p className="truncate text-sm text-gray-400">
                      {chat.type === "ORDER" && chat.seller ? `With: ${chat.seller.name || chat.buyer.name}` : "Cipher Store Support Team"}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-xs text-gray-500">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </div>
              </div>
              {chat.messages && chat.messages.length > 0 && (
                <div className="mt-4 border-t border-[#27272a] pt-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2 truncate">
                    {chat.messages[0].content?.includes("Buyer uploaded Payment Receipt") && (
                      <ReceiptText className="h-4 w-4 shrink-0 text-emerald-400" />
                    )}
                    <span className="font-semibold text-gray-300">{chat.messages[0].senderId === chat.buyerId ? "You:" : "Them:"}</span>
                    <span className="truncate">{getMessagePreview(chat.messages[0].content)}</span>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
      </div>
    </CyberBackgroundBranches>
  )
}
