"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MessageSquare, Package, LifeBuoy, Trash2, Clock, CheckCircle, Loader2, Search, Repeat, User, ChevronDown } from "lucide-react"
import StaffSelect from "@/components/admin/staff-select"

export default function AdminChatsClient({ chats: initialChats, currentUserRole, initialStaff }: { chats: any[], currentUserRole: string, initialStaff: any[] }) {
  const [chats, setChats] = useState(initialChats)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"ALL" | "ORDER" | "SUPPORT">("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const [transferringId, setTransferringId] = useState<string | null>(null)
  const [staff] = useState<any[]>(initialStaff)

  const handleDelete = async (chatId: string) => {
    if (!confirm("Delete this chat and all its messages? This cannot be undone.")) return
    setDeletingId(chatId)
    try {
      const res = await fetch(`/api/admin/chats/${chatId}`, { method: "DELETE" })
      if (res.ok) {
        setChats(chats.filter(c => c.id !== chatId))
      } else {
        alert("Failed to delete chat.")
      }
    } catch {
      alert("Error deleting chat.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete all ${filter !== "ALL" ? filter : ""} chats? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/admin/chats/all?type=${filter}`, { method: "DELETE" })
      if (res.ok) {
        if (filter === "ALL") {
          setChats([])
        } else {
          setChats(chats.filter(c => c.type !== filter))
        }
      } else {
        alert("Failed to delete chats.")
      }
    } catch {
      alert("Error deleting chats.")
    }
  }

  const handleTransfer = async (chatId: string, newType: string, assignedToId?: string | null) => {
    setTransferringId(chatId)
    try {
      const res = await fetch(`/api/admin/chats/transfer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: chatId,
          type: newType,
          assignedToId: assignedToId === undefined ? undefined : assignedToId
        })
      })
      if (res.ok) {
        setChats(chats.map(c => c.id === chatId ? { ...c, type: newType, assignedToId: assignedToId || c.assignedToId } : c))
      } else {
        alert("Failed to update chat.")
      }
    } catch {
      alert("Error updating chat.")
    } finally {
      setTransferringId(null)
    }
  }

  const [closingId, setClosingId] = useState<string | null>(null)

  const handleCloseChat = async (chatId: string) => {
    if (!confirm("Are you sure you want to officially close this chat?")) return
    setClosingId(chatId)
    try {
      const res = await fetch(`/api/admin/chats/${chatId}/close`, { method: "POST" })
      if (res.ok) {
        setChats(chats.map(c => c.id === chatId ? { ...c, status: "CLOSED_BY_WEB" } : c))
      } else {
        alert("Failed to close chat")
      }
    } catch (err) {
      alert("Error closing chat")
    } finally {
      setClosingId(null)
    }
  }

  const filtered = (filter === "ALL" ? chats : chats.filter(c => c.type === filter)).filter(c =>
    (c.buyer?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.buyer?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.orderId || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      {/* Filter & Search */}
      <div className="flex flex-row gap-4 mb-6">
        <div className="flex gap-2">
          {(["ALL", "ORDER", "SUPPORT"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${filter === tab
                ? "bg-[#a855f7] text-white"
                : "bg-[#27272a] text-gray-400 hover:text-white"
                }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={handleDeleteAll}
            className="px-4 py-1.5 rounded-full text-sm font-bold transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20 ml-2"
          >
            DELETE ALL
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141417] border border-[#27272a] rounded-lg py-1.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#a855f7]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#141417] border border-[#27272a] rounded-2xl p-16 text-center text-gray-500">
          <MessageSquare className="h-14 w-14 mx-auto mb-4 opacity-30 text-[#a855f7]" />
          <p className="text-white font-semibold mb-1">No chats found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(chat => {
            const lastMsg = chat.messages[0]
            const isSupport = chat.type === "SUPPORT"
            const isDone = chat.order?.status === "COMPLETED" || chat.order?.status === "CANCELLED"

            return (
              <div
                key={chat.id}
                className={`bg-[#141417] border rounded-xl p-5 transition-colors flex items-start gap-4 ${isDone || chat.status.startsWith("CLOSED_") ? "border-[#27272a] opacity-70" : "border-[#27272a] hover:border-[#a855f7]/40"
                  }`}
              >
                {/* Icon */}
                <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isSupport ? "bg-yellow-500/15" : "bg-[#a855f7]/15"
                  }`}>
                  {isSupport
                    ? <LifeBuoy className="h-5 w-5 text-yellow-500" />
                    : <Package className="h-5 w-5 text-[#a855f7]" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <span className="text-white font-bold truncate">
                      {isSupport ? `Support — ${chat.buyer?.name}` : `Order #${chat.orderId?.slice(-8).toUpperCase()}`}
                    </span>
                    {chat.status === "CLOSED_BY_DISCORD" && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20">
                        Closed by Discord
                      </span>
                    )}
                    {chat.status === "CLOSED_BY_WEB" && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        Closed by Website
                      </span>
                    )}
                    {chat.order && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${chat.order.status === "COMPLETED" ? "bg-green-500/10 text-green-400" :
                        chat.order.status === "CANCELLED" ? "bg-red-500/10 text-red-400" :
                          "bg-yellow-500/10 text-yellow-400"
                        }`}>
                        {chat.order.status}
                      </span>
                    )}
                    {isDone && (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                    <span className="ml-auto flex items-center gap-1 text-xs text-gray-500 shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    {chat.buyer?.name} ({chat.buyer?.email})
                    {chat.assignedToId && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20">
                        Staff: {staff.find(s => s.id === chat.assignedToId)?.name || "Assigned"}
                      </span>
                    )}
                    {chat.seller && ` → ${chat.seller.name}`}
                    {chat.order && ` | ${chat.order.total?.toFixed(2)} EGP`}
                  </p>

                  {lastMsg && (
                    <p className="text-sm text-gray-400 truncate">
                      <span className="text-gray-300 font-semibold">
                        {lastMsg.isAi ? "AI: " : lastMsg.senderId === chat.buyerId ? `${chat.buyer?.name?.split(" ")[0]}: ` : "Support/Seller: "}
                      </span>
                      {lastMsg.content}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Type Switcher */}
                    <div className="flex items-center gap-1 bg-[#09090b] border border-[#27272a] rounded-lg px-2 py-1">
                      <Repeat className="h-3 w-3 text-gray-400" />
                      <select
                        value={chat.type}
                        onChange={(e) => handleTransfer(chat.id, e.target.value)}
                        disabled={transferringId === chat.id}
                        className="bg-transparent text-[10px] font-bold text-gray-300 outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="ORDER">ORDER</option>
                        <option value="SUPPORT">SUPPORT</option>
                      </select>
                    </div>

                    {/* Staff Switcher */}
                    <StaffSelect
                      value={chat.assignedToId}
                      staff={staff}
                      onChange={(val) => handleTransfer(chat.id, chat.type, val)}
                      disabled={transferringId === chat.id}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/chat/${chat.id}`}
                      className="flex-1 text-center bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-bold"
                    >
                      Open Chat
                    </Link>
                    {!chat.status.startsWith("CLOSED_") && (
                      <button
                        onClick={() => handleCloseChat(chat.id)}
                        disabled={closingId === chat.id}
                        className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 text-xs px-3 py-1.5 rounded-lg transition-colors font-bold whitespace-nowrap"
                      >
                        {closingId === chat.id ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Close"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(chat.id)}
                      disabled={deletingId === chat.id}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete chat"
                    >
                      {deletingId === chat.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
