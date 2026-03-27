"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LifeBuoy, MessageSquare, Clock, CheckCircle2, UserCircle2 } from "lucide-react"

export function SupportChatsClient({ initialChats, currentUser }: { initialChats: any[], currentUser: any }) {
  const [chats, setChats] = useState(initialChats)
  const [activeTab, setActiveTab] = useState<"ONGOING" | "SUCCESS">("ONGOING")

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/admin/support-chats")
      if (res.ok) {
        const data = await res.json()
        setChats(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const runRefresh = () => {
      if (document.visibilityState === "visible") {
        fetchChats()
      }
    }

    const interval = setInterval(runRefresh, 10000)
    window.addEventListener("focus", runRefresh)
    document.addEventListener("visibilitychange", runRefresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", runRefresh)
      document.removeEventListener("visibilitychange", runRefresh)
    }
  }, [])

  const handleAction = async (chatId: string, action: "TAKE" | "RESOLVE") => {
    try {
      const res = await fetch("/api/admin/support-chats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, action })
      })
      if (res.ok) {
        fetchChats()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredChats = chats.filter(c => c.status === activeTab)

  return (
    <>
      <div className="flex gap-4 mb-6 border-b border-[#27272a] pb-4">
        <button
          onClick={() => setActiveTab("ONGOING")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "ONGOING" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30" : "text-gray-500 hover:bg-[#27272a]/50"
          }`}
        >
          <LifeBuoy className="h-4 w-4" /> Ongoing
          <span className="bg-[#141417] px-2 py-0.5 rounded-full text-xs ml-2">{chats.filter(c => c.status === "ONGOING").length}</span>
        </button>
        <button
          onClick={() => setActiveTab("SUCCESS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "SUCCESS" ? "bg-green-500/10 text-green-500 border border-green-500/30" : "text-gray-500 hover:bg-[#27272a]/50"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" /> Resolved (Success)
          <span className="bg-[#141417] px-2 py-0.5 rounded-full text-xs ml-2">{chats.filter(c => c.status === "SUCCESS").length}</span>
        </button>
      </div>

      {filteredChats.length === 0 ? (
        <div className="bg-[#141417] border border-[#27272a] rounded-2xl p-16 text-center text-gray-500">
          {activeTab === "ONGOING" ? (
            <LifeBuoy className="h-14 w-14 mx-auto mb-4 opacity-30 text-yellow-500" />
          ) : (
            <CheckCircle2 className="h-14 w-14 mx-auto mb-4 opacity-30 text-green-500" />
          )}
          <p className="text-lg font-semibold text-white mb-1">No {activeTab.toLowerCase()} support sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChats.map((chat: any) => {
            const lastMsg = chat.messages?.[0]
            const isAssigned = !!chat.sellerId
            const isMine = chat.sellerId === currentUser.id
            const canResolveAnyChat = ["DEV", "OWNER", "MANAGER"].includes(currentUser.role)

            return (
              <div key={chat.id} className="relative group block bg-[#141417] border border-[#27272a] hover:border-yellow-500/40 rounded-xl p-5 transition-colors pr-32">
                <Link href={`/chat/${chat.id}`} aria-label={`Open support chat with ${chat.buyer?.name || "Unknown User"}`} className="absolute inset-0 z-0"></Link>
                
                <div className="flex items-start justify-between gap-4 relative z-10 pointer-events-none">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0">
                      <LifeBuoy className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{chat.buyer?.name || "Unknown User"}</p>
                      <p className="text-xs text-gray-500">{chat.buyer?.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(chat.updatedAt).toLocaleTimeString()}
                    </div>
                    {isAssigned ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-1 rounded">
                        <UserCircle2 className="h-3 w-3" /> Assisting: {chat.seller?.name}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded animate-pulse">
                        Unassigned
                      </div>
                    )}
                  </div>
                </div>

                {lastMsg && (
                  <div className="mt-3 pt-3 border-t border-[#27272a] flex items-center gap-2 text-sm text-gray-400 truncate relative z-10 pointer-events-none">
                    <MessageSquare className="h-4 w-4 shrink-0 text-gray-600" />
                    <span className="font-semibold text-gray-300 shrink-0">
                      {lastMsg.senderId === chat.buyerId ? `${chat.buyer?.name?.split(" ")[0]}:` : "Support:"}
                    </span>
                    <span className="truncate">{lastMsg.content}</span>
                  </div>
                )}

                {/* Quick Actions overlayed */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
                  {!isAssigned && activeTab === "ONGOING" && (
                    <button 
                      onClick={(e) => { e.preventDefault(); handleAction(chat.id, "TAKE"); }}
                      className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg"
                    >
                      Take Chat
                    </button>
                  )}
                  {(isMine || canResolveAnyChat) && activeTab === "ONGOING" && (
                    <button 
                      onClick={(e) => { e.preventDefault(); handleAction(chat.id, "RESOLVE"); }}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg"
                    >
                      Mark Success
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
