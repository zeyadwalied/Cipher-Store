"use client"

import { useState, useEffect, useRef } from "react"
import { Package, Search, CheckCircle, Smartphone, Image as ImageIcon, Trash2, X, MessageSquare, Send, Mail, AlertTriangle, Loader2, ReceiptText, Phone, ExternalLink, Check, CheckCheck } from "lucide-react"

function parseReceiptMessage(content: string) {
  const match = content.match(/^🧾\s+\*\*Buyer uploaded Payment Receipt\*\*\s*\nPhone:\s*([\s\S]+?)\s*\n\[View Receipt\]\(((?:https?:\/\/[^\s\)]+)|\/[^\s\)]+?)\/*\)$/)
  if (!match) return null
  return { phone: match[1].trim(), imageUrl: match[2].trim() }
}

export default function AdminOrdersClient({ initialOrders, currentUserRole }: { initialOrders: any[], currentUserRole: string }) {
  const [orders, setOrders] = useState(initialOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<any | null>(null)
  const [statusUpdatingOrderId, setStatusUpdatingOrderId] = useState<string | null>(null)

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (statusUpdatingOrderId === orderId) return

    try {
      setStatusUpdatingOrderId(orderId)
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
      } else {
        const err = await res.text()
        alert(`Failed to update status: ${err}`)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setStatusUpdatingOrderId(current => current === orderId ? null : current)
    }
  }

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" })
      if (res.ok) {
        setOrders(orders.filter((o: any) => o.id !== orderId))
      } else {
        alert("Failed to delete order")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm("Are you REALLY sure you want to delete ALL orders? This action cannot be undone and will delete all order history.")) return;
    try {
      const res = await fetch(`/api/admin/orders`, { method: "DELETE" })
      if (res.ok) {
        setOrders([])
      } else {
        alert("Failed to delete all orders")
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Orders</h1>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#141417] border border-[#27272a] rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#a855f7]"
            />
          </div>
          <button
            onClick={handleDeleteAll}
            className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 p-2 rounded-lg transition-colors cursor-pointer"
            title="Delete ALL Orders"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-[#141417] border border-[#27272a] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#09090b] border-b border-[#27272a]">
            <tr className="text-gray-400 text-sm">
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No orders found.</td>
              </tr>
            ) : filteredOrders.map((order: any) => (
              <tr key={order.id} className="border-b border-[#27272a] hover:bg-[#27272a]/20">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#a855f7]" />
                    {order.id}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-white font-medium">{order.user?.name || "Unknown"}</div>
                  <div className="text-xs text-gray-500 mb-2">{order.user?.email}</div>

                  {(order.receiptImageUrl || order.senderPhoneNumber) && (
                    <div className="mt-2 bg-[#09090b] border border-[#a855f7]/30 p-2 rounded-lg w-fit">
                      {order.senderPhoneNumber && (
                        <div className="text-xs font-mono text-[#00f5ff] mb-1.5 flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> {order.senderPhoneNumber}
                        </div>
                      )}
                      {order.receiptImageUrl && (
                        <button
                          onClick={() => setSelectedOrderForChat(order)}
                          className="text-[10px] bg-[#a855f7]/20 text-[#a855f7] hover:bg-[#a855f7]/40 px-2 py-1 rounded transition-colors inline-flex items-center gap-1 font-bold cursor-pointer mt-1"
                        >
                          <MessageSquare className="w-3 h-3" /> فتح تفاصيل الطلب والمحادثة
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`bg-transparent text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer ${order.status === 'COMPLETED' ? 'text-green-500 border-green-500/30' :
                        order.status === 'PAID' ? 'text-blue-500 border-blue-500/30' :
                          order.status === 'CANCELLED' ? 'text-red-500 border-red-500/30' :
                            'text-yellow-500 border-yellow-500/30'
                        }`}
                    >
                      <option className="bg-[#141417]" value="PENDING">PENDING</option>
                      <option className="bg-[#141417]" value="PAID">PAID</option>
                      <option className="bg-[#141417]" value="COMPLETED">COMPLETED</option>
                      <option className="bg-[#141417]" value="CANCELLED">CANCELLED</option>
                    </select>

                    {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && order.confirmationSource && (
                      <div className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold border ${order.confirmationSource === 'DISCORD' ? 'bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20' : 'bg-[#00f5ff]/10 text-[#00f5ff] border-[#00f5ff]/20'}`}>
                        By {order.confirmationSource === 'DISCORD' ? 'Discord' : 'Website'}
                      </div>
                    )}

                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusChange(order.id, "COMPLETED")}
                        disabled={statusUpdatingOrderId === order.id}
                        className="bg-green-500/10 hover:bg-green-500/20 text-green-500 p-1 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Quick Confirm Order & Send Emails"
                      >
                        {statusUpdatingOrderId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1 rounded transition-colors"
                      title="Delete Order"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-white font-bold text-right">{order.total.toFixed(2)} EGP</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrderForChat && (
        <OrderChatModal
          order={selectedOrderForChat}
          onClose={() => setSelectedOrderForChat(null)}
          currentUserRole={currentUserRole}
        />
      )}
    </div>
  )
}

function OrderChatModal({ order, onClose, currentUserRole }: { order: any, onClose: () => void, currentUserRole: string }) {
  const [chat, setChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isAlerting, setIsAlerting] = useState(false)
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (order?.id) {
      fetchChat()
    }
  }, [order])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchChat = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/admin/orders/${order.id}/chat`)
      if (res.ok) {
        const data = await res.json()
        setChat(data)
        setMessages(data.messages || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    const tempId = `temp-${Date.now()}`
    const content = newMessage
    
    // Optimistic UI update
    setMessages(prev => [...prev, {
      id: tempId,
      content: content,
      senderId: "ADMIN", // Generic placeholder since we don't have actual senderId directly here, but it's clearly an admin
      createdAt: new Date().toISOString(),
      isAi: false
    }])
    setNewMessage("")

    try {
      setIsSending(true)
      const res = await fetch(`/api/admin/orders/${order.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      })

      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => prev.map(m => m.id === tempId ? msg : m))
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setNewMessage(content)
      }
    } catch (e) {
      console.error(e)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
    } finally {
      setIsSending(false)
    }
  }

  const sendEmailAlert = async () => {
    if (!confirm("Send an email alert to the customer about this order?")) return;
    try {
      setIsAlerting(true)
      const res = await fetch(`/api/admin/orders/${order.id}/alert`, { method: "POST" })
      if (res.ok) {
        alert("Alert email sent successfully!")
      } else {
        alert("Failed to send alert email.")
      }
    } catch (e) {
      console.error(e)
      alert("Error sending email.")
    } finally {
      setIsAlerting(false)
    }
  }

  const deleteMessage = async (msgId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/chat/messages/${msgId}`, { method: "DELETE" })
      if (res.ok) {
        setMessages(messages.filter((m: any) => m.id !== msgId))
      } else {
        alert("Failed to delete message.")
      }
    } catch (e) {
      console.error(e)
      alert("Error deleting message.")
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0a0a0c] border border-[#27272a] rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">

        {/* Left Side: Order Details & Receipt */}
        <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-[#27272a] flex flex-col h-full bg-[#050505]">
          <div className="p-4 border-b border-[#27272a] flex justify-between items-center bg-[#111114]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="text-[#a855f7] w-5 h-5" /> Order #{order.id}
            </h2>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#141417] p-4 rounded-xl border border-[#27272a]">
                <div className="text-xs text-gray-500 mb-1">Customer</div>
                <div className="text-white font-medium">{order.user?.name || "Unknown"}</div>
                <div className="text-xs text-gray-400">{order.user?.email}</div>
              </div>
              <div className="bg-[#141417] p-4 rounded-xl border border-[#27272a]">
                <div className="text-xs text-gray-500 mb-1">Status & Total</div>
                <div className="text-[#00f5ff] font-bold">{order.status}</div>
                <div className="text-white font-medium">{order.total.toFixed(2)} EGP</div>
              </div>
            </div>

            {order.senderPhoneNumber && (
              <div className="bg-[#141417] p-4 rounded-xl border border-[#00f5ff]/30">
                <div className="text-xs text-gray-500 mb-1">Sender Phone Number</div>
                <div className="text-[#00f5ff] font-mono font-bold flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> {order.senderPhoneNumber}
                </div>
              </div>
            )}

            {order.receiptImageUrl && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#a855f7]" /> Transfer Receipt
                </div>
                <div className="bg-black border border-[#27272a] rounded-xl overflow-hidden relative group">
                  <button
                    onClick={() => setFullScreenImage(order.receiptImageUrl)}
                    className="block cursor-zoom-in w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.receiptImageUrl}
                      alt="Receipt"
                      className="w-full h-auto max-h-[400px] object-contain transition-opacity group-hover:opacity-80"
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chat System */}
        <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-auto bg-[#0a0a0c]">
          <div className="p-4 border-b border-[#27272a] flex justify-between items-center bg-[#111114]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="text-[#00f5ff] w-5 h-5" /> Customer Chat
            </h2>
            <button
              onClick={sendEmailAlert}
              disabled={isAlerting}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              {isAlerting ? "Sending..." : "Alert Customer"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-500 animate-pulse">Loading chat history...</div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>No messages yet.</p>
                <p className="text-xs mt-1">Send a message to start the conversation.</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                // Determine if this msg was sent by Admin. (We added "ADMIN" for optimistic messages too).
                const isAdmin = msg.senderId !== order.userId && !msg.isAi;
                const canDelete = currentUserRole === "OWNER" || currentUserRole === "MANAGER";
                const isTempSending = msg.id && msg.id.startsWith("temp-");
                const receipt = parseReceiptMessage(msg.content);

                const hasBeenSeen = messages.slice(i + 1).some((m: any) => m.senderId !== msg.senderId && !m.isAi) || false;

                return (
                  <div key={i} className={`flex flex-col group ${isAdmin ? "items-end" : "items-start"}`}>
                    <div className="text-[10px] text-gray-500 mb-1 px-1 flex items-center gap-2">
                      {isAdmin ? "You (Admin)" : (order.user?.name || "Customer")}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm relative ${isAdmin
                      ? "bg-[#a855f7] text-white rounded-tr-sm"
                      : "bg-[#27272a] text-gray-100 rounded-tl-sm"
                      } ${isTempSending ? "opacity-70" : ""}`}>
                      
                      {receipt ? (
                        <div className={`rounded-xl border p-3 ${isAdmin ? 'border-white/15 bg-white/10' : 'border-[#27272a] bg-[#09090b]'}`}>
                          <div className={`mb-2 flex items-center gap-2 text-xs font-bold ${isAdmin ? 'text-purple-100' : 'text-emerald-300'}`}>
                            <ReceiptText className="h-4 w-4" />
                            إيصال دفع مستلم
                          </div>
                          <div className={`mb-2 flex items-center gap-2 text-xs ${isAdmin ? 'text-purple-100/90' : 'text-gray-300'}`}>
                            <Phone className="h-3.5 w-3.5" />
                            <span dir="ltr">{receipt.phone}</span>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); setFullScreenImage(receipt.imageUrl); }}
                            className="group block w-fit overflow-hidden rounded-lg border border-white/10 cursor-zoom-in"
                          >
                            <img
                              src={receipt.imageUrl}
                              alt="Payment receipt"
                              className="max-h-[140px] w-auto max-w-[180px] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                          </button>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className={`absolute ${isAdmin ? "-left-10" : "-right-10"} top-1/2 -translate-y-1/2 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity`}
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className={`flex items-center gap-1.5 mt-2 text-[9px] ${isAdmin ? 'text-purple-200 justify-end' : 'text-gray-400 justify-start'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        
                        <span className="flex items-center justify-center">
                          {isTempSending ? (
                            <Loader2 className="h-3 w-3 animate-spin text-purple-200" />
                          ) : hasBeenSeen ? (
                            <CheckCheck className={`h-4 w-4 ${isAdmin ? 'text-green-300' : 'text-green-500'}`} />
                          ) : (
                            <Check className={`h-3.5 w-3.5 ${isAdmin ? 'text-purple-200/70' : 'text-gray-500'}`} />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[#27272a] bg-[#111114]">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message to the customer..."
                className="flex-1 bg-black border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00f5ff] transition-colors"
                disabled={isSending || isLoading}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending || isLoading}
                className="bg-[#00f5ff] hover:bg-[#00f5ff]/80 text-black p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-[44px] h-[44px]"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 animate-in fade-in cursor-zoom-out"
          onClick={() => setFullScreenImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullScreenImage}
            alt="Full Screen Receipt"
            className="max-w-full max-h-[95vh] object-contain rounded-xl shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
            onClick={() => setFullScreenImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}
