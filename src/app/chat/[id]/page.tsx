"use client"

import { use, useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { MessageSquare, Send, ArrowLeft, LifeBuoy, Package, User, Repeat, ShieldAlert, Loader2, ChevronDown, ReceiptText, Phone, ExternalLink } from "lucide-react"
import Link from "next/link"
import StaffSelect from "@/components/admin/staff-select"
import { CyberBackgroundBranches } from "@/components/CyberBackgroundBranches"

function parseReceiptMessage(content: string) {
  const match = content.match(/^🧾\s+\*\*Buyer uploaded Payment Receipt\*\*\s*\nPhone:\s*([\s\S]+?)\s*\n\[View Receipt\]\((https?:\/\/[\s\S]+)\)$/)

  if (!match) {
    return null
  }

  return {
    phone: match[1].trim(),
    imageUrl: match[2].trim(),
  }
}

export default function ChatWindow({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [chat, setChat] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const [staff, setStaff] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasAppliedDraftRef = useRef(false)
  const hasTriedAutoSendRef = useRef(false)
  const canManageChat = !!session?.user && ["DEV", "OWNER", "MANAGER", "SUPPORT"].includes(session.user.role)
  const draftMessage = searchParams.get("draft") || ""
  const shouldAutoSendDraft = searchParams.get("autoSend") === "1"

  useEffect(() => {
    if (!canManageChat) return

    fetch("/api/admin/staff")
      .then(async (res) => {
        if (!res.ok) return []
        return res.json()
      })
      .then(data => setStaff(data))
      .catch(console.error)
  }, [canManageChat])

  useEffect(() => {
    fetchChat()

    // Simple polling for new messages every 3 seconds
    const interval = setInterval(() => {
      fetchChat(true)
    }, 3000)

    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    // Scroll to bottom when messages load
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat?.messages?.length])

  useEffect(() => {
    if (hasAppliedDraftRef.current || !draftMessage) return

    setNewMessage(draftMessage)
    hasAppliedDraftRef.current = true
  }, [draftMessage])

  useEffect(() => {
    if (!chat || !draftMessage || !shouldAutoSendDraft || hasTriedAutoSendRef.current) {
      return
    }

    if (chat.status?.startsWith("CLOSED_") || chat.order?.status === "COMPLETED" || chat.order?.status === "CANCELLED") {
      return
    }

    const alreadySent = chat.messages?.some((msg: any) => msg.senderId === session?.user?.id && msg.content === draftMessage)
    if (alreadySent) {
      hasTriedAutoSendRef.current = true
      return
    }

    hasTriedAutoSendRef.current = true

    const sendDraft = async () => {
      setIsSending(true)
      try {
        const res = await fetch(`/api/chats/${id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: draftMessage })
        })

        if (res.ok) {
          setNewMessage("")
          fetchChat()
        } else {
          setNewMessage(draftMessage)
        }
      } catch (e) {
        console.error("Failed to auto-send draft", e)
        setNewMessage(draftMessage)
      } finally {
        setIsSending(false)
      }
    }

    void sendDraft()
  }, [chat, draftMessage, shouldAutoSendDraft, id, session?.user?.id])

  const fetchChat = async (silent = false) => {
    try {
      const res = await fetch(`/api/chats/${id}/messages`)
      if (res.ok) {
        setChat(await res.json())
      } else if (!silent) {
        window.location.href = "/chat"
      }
    } catch (e) {
      console.error(e)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const content = newMessage
    setNewMessage("") // Optmistic clear

    try {
      const res = await fetch(`/api/chats/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      })
      if (res.ok) {
        fetchChat()
      } else {
        setNewMessage(content) // Restore on fail
      }
    } catch (e) {
      console.error("Failed to send", e)
      setNewMessage(content)
    } finally {
      setIsSending(false)
    }
  }

  const handleTransfer = async (newType: string, assignedToId?: string | null) => {
    setIsManaging(true)
    try {
      const res = await fetch(`/api/admin/chats/transfer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: chat.id,
          type: newType,
          assignedToId: assignedToId === undefined ? undefined : assignedToId
        })
      })
      if (res.ok) fetchChat()
    } catch (e) { console.error(e) }
    finally { setIsManaging(false) }
  }

  const handleBlockUser = async () => {
    if (!chat.buyerId) return
    if (!confirm("Are you sure you want to BLOCK this user? They will be logged out and banned immediately.")) return

    setIsManaging(true)
    try {
      const res = await fetch(`/api/admin/users/${chat.buyerId}/block`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: true })
      })
      if (res.ok) alert("User has been blocked.")
    } catch (e) { console.error(e) }
    finally { setIsManaging(false) }
  }

  if (!chat) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a855f7]"></div>
    </div>
  )

  const isSupport = chat.type === "SUPPORT"
  const title = isSupport ? "جلسة دعم فني" : `طلب #${chat.orderId || "تفاصيل"}`
  const OtherUser = isSupport ? null : (session?.user?.id === chat.buyerId ? chat.seller : chat.buyer)

  return (
    <CyberBackgroundBranches
      primaryColor="#00f5ff"
      secondaryColor="#ff0090"
      accentColor="#a855f7"
      opacity={0.15}
      className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 py-12"
    >
      <div className="w-full max-w-[800px] h-[80vh] flex flex-col shadow-2xl relative mx-auto">
        <div className="bg-[#141417] border border-[#27272a] rounded-t-xl p-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <Link href="/chat" aria-label="Back to messages" title="Back to messages" className="text-gray-400 hover:text-white transition-colors bg-[#27272a]/50 p-2 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isSupport ? "bg-yellow-500/20 text-yellow-500" : "bg-[#a855f7]/20 text-[#a855f7]"}`}>
              {isSupport ? <LifeBuoy className="h-5 w-5" /> : <Package className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">{title}</h1>
              <p className="text-xs text-gray-400">
                {isSupport ? "دعم Cipher Store" : (OtherUser ? `مع ${OtherUser.name || "مستخدم"}` : "جاري تحميل المشاركين...")}
              </p>
            </div>
          </div>

          {/* Staff Controls */}
          {canManageChat && (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-1">
                {chat.assignedToId && (
                  <span className="text-[10px] text-[#a855f7] font-bold bg-[#a855f7]/10 px-2 py-0.5 rounded-full border border-[#a855f7]/20">
                    Assigned: {staff.find(s => s.id === chat.assignedToId)?.name || "Unknown"}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {/* Type Switcher */}
                  <div className="flex items-center gap-1 bg-[#09090b] border border-[#27272a] rounded-lg px-2 py-1">
                    <Repeat className="h-3 w-3 text-gray-400" />
                    <select
                      value={chat.type}
                      onChange={(e) => handleTransfer(e.target.value)}
                      disabled={isManaging}
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
                    onChange={(val) => handleTransfer(chat.type, val)}
                    disabled={isManaging}
                  />
                </div>
              </div>

              <button
                onClick={handleBlockUser}
                disabled={isManaging}
                title="Block User"
                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20 disabled:opacity-50 h-[34px] w-[34px] flex items-center justify-center"
              >
                {isManaging ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 bg-[#09090b] border-x border-[#27272a] overflow-y-auto p-6 space-y-6 relative">
          {chat.status?.startsWith('CLOSED_') && (
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 justify-center sticky top-0 z-10 m-2 shadow-lg backdrop-blur-sm flex-row-reverse" dir="rtl">
              <ShieldAlert className="h-4 w-4" />
              تم إغلاق هذه التذكرة رسمياً
              {chat.status === 'CLOSED_BY_DISCORD' ? " (من قبل فريق الدعم)" : " (من قبل الإدارة)"}.
            </div>
          )}
          {chat.order?.status === 'COMPLETED' && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 justify-center sticky top-0 z-10 m-2 shadow-lg backdrop-blur-sm flex-row-reverse" dir="rtl">
              ✅ تم تأكيد الطلب — {chat.order.confirmationSource === 'DISCORD'
                ? `تم التأكيد عبر ديسكورد${chat.order.confirmedByName ? ` (${chat.order.confirmedByName})` : ''}`
                : 'تم التأكيد عبر الموقع'}
            </div>
          )}
          {chat.order?.status === 'CANCELLED' && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 justify-center sticky top-0 z-10 m-2 shadow-lg backdrop-blur-sm flex-row-reverse" dir="rtl">
              ❌ تم إلغاء الطلب — {chat.order.confirmationSource === 'DISCORD'
                ? `تم الإلغاء عبر ديسكورد${chat.order.confirmedByName ? ` (${chat.order.confirmedByName})` : ''}`
                : 'تم الإلغاء عبر الموقع'}
            </div>
          )}
          {chat.messages?.map((msg: any) => {
            let isMe = msg.senderId === session?.user?.id
            // Force customer messages to left, staff to right for support chats
            if (isSupport) {
              isMe = msg.senderId !== chat.buyerId
            }

            if (msg.isAi) {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-xs bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold">AI</span>
                    </div>
                    <div className="bg-[#27272a] border border-[#3f3f46] text-white p-4 rounded-2xl rounded-tl-sm shadow-md prose prose-invert max-w-none">
                      <div className="text-[10px] mb-1 font-bold text-left text-blue-400">AI Assistant</div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <div className="text-[10px] text-gray-500 mt-2">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            // For the sender name: staff/admin messages = "Cipher Store", customer = actual name
            const isStaffMsg = msg.senderId !== chat.buyerId
            const senderName = isStaffMsg ? "Cipher Store" : (msg.sender?.name || chat.buyer?.name || "Customer")
            const receipt = parseReceiptMessage(msg.content)

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row' : 'flex-row-reverse'}`} dir="rtl">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden ${isMe ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-700/50 text-gray-400'}`}>
                    {isMe ? <LifeBuoy className="h-4 w-4 text-yellow-500" /> : (msg.sender?.image ? <img src={msg.sender.image} alt="User" className="h-full w-full object-cover" /> : <User className="h-4 w-4" />)}
                  </div>
                  <div className={`p-4 shadow-md text-sm whitespace-pre-wrap leading-relaxed flex flex-col ${isMe
                    ? 'bg-[#a855f7] text-white rounded-2xl rounded-tr-sm'
                    : 'bg-[#141417] border border-[#27272a] text-gray-200 rounded-2xl rounded-tl-sm'
                    }`}>
                    <span className={`text-[10px] uppercase tracking-wider mb-1 font-bold ${isMe ? 'text-purple-200 text-right' : 'text-gray-400 text-right'}`} dir="rtl">
                      {senderName}
                    </span>
                    {receipt ? (
                      <div className={`mt-1 rounded-2xl border p-3 ${isMe ? 'border-white/15 bg-white/10' : 'border-[#27272a] bg-[#09090b]'}`}>
                        <div className={`mb-3 flex items-center gap-2 text-xs font-bold ${isMe ? 'text-purple-100' : 'text-emerald-300'}`}>
                          <ReceiptText className="h-4 w-4" />
                          Payment Receipt
                        </div>
                        <div className={`mb-3 flex items-center gap-2 text-xs ${isMe ? 'text-purple-100/90' : 'text-gray-300'}`}>
                          <Phone className="h-3.5 w-3.5" />
                          <span dir="ltr">{receipt.phone}</span>
                        </div>
                        <a
                          href={receipt.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group block w-fit overflow-hidden rounded-2xl border border-white/10"
                        >
                          <img
                            src={receipt.imageUrl}
                            alt="Payment receipt"
                            className="max-h-[180px] w-auto max-w-[220px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        </a>
                        <a
                          href={receipt.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${isMe ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Full Receipt
                        </a>
                      </div>
                    ) : (
                      <span dir="rtl">{msg.content}</span>
                    )}
                    <div className={`text-[10px] mt-2 ${isMe ? 'text-purple-200 text-left' : 'text-gray-500 text-left'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="bg-[#141417] border border-[#27272a] rounded-b-xl p-4 flex gap-3 flex-row-reverse text-right">
          <input
            type="text"
            placeholder={chat.status?.startsWith('CLOSED_') ? "هذه التذكرة مغلقة..." : "اكتب رسالتك..."}
            className="flex-1 bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a855f7] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-right"
            dir="rtl"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            disabled={isSending || chat.status?.startsWith('CLOSED_') || chat.order?.status === 'COMPLETED' || chat.order?.status === 'CANCELLED'}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim() || chat.status?.startsWith('CLOSED_') || chat.order?.status === 'COMPLETED' || chat.order?.status === 'CANCELLED'}
            className="bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-xl px-6 font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            {isSending ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5 rotate-180" />
            )}
          </button>
        </form>
      </div>
    </CyberBackgroundBranches>
  )
}
