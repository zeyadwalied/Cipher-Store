"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, X, Send, LifeBuoy, AlertCircle } from "lucide-react"

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatSession, setChatSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isUnauth, setIsUnauth] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch or create the user's active support chat
  const fetchChat = async () => {
    try {
      const res = await fetch('/api/chats/support')
      if (res.status === 401) {
        setIsUnauth(true)
        return
      }
      if (res.ok) {
        const data = await res.json()
        setChatSession(data)
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Failed to fetch support chat:", error)
    }
  }

  // Initial load when opened
  useEffect(() => {
    if (isOpen && !chatSession && !isUnauth) {
      setIsLoading(true)
      fetchChat().finally(() => setIsLoading(false))
    }
  }, [isOpen])

  // Polling for new messages
  useEffect(() => {
    if (!isOpen || isUnauth) return
    const interval = setInterval(fetchChat, 3000)
    return () => clearInterval(interval)
  }, [isOpen, isUnauth])

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !chatSession) return

    const tempMsg = {
      id: "temp-" + Date.now(),
      content: input,
      senderId: chatSession.buyerId, // Optimistic UI
      createdAt: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, tempMsg])
    const currentInput = input
    setInput("")

    try {
      const res = await fetch(`/api/chats/${chatSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentInput })
      })
      if (res.ok) {
        fetchChat() // Refresh messages to get true ID
      }
    } catch (error) {
      console.error("SendMessage error", error)
    }
  }

  const isAssigned = !!chatSession?.sellerId
  const agentName = chatSession?.seller?.name || "Support Agent"

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0ea5e9] text-white shadow-lg transition-transform hover:scale-105 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl border border-[#27272a] bg-[#141417] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#27272a] bg-[#09090b] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6]">
                <LifeBuoy className="h-5 w-5 text-white" />
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#141417] ${isAssigned ? 'bg-green-500' : 'bg-orange-500'}`}></span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{isAssigned ? agentName : "Live Support"}</h3>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  {isAssigned ? "Assisting You" : "Waiting for agent..."}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-[#27272a] p-1.5 rounded-full">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isUnauth ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-3">
                <AlertCircle className="h-10 w-10 text-orange-500 opacity-50" />
                <p className="text-sm">Please log in to your account to contact live support.</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="h-6 w-6 rounded-full border-2 border-[#0ea5e9] border-t-transparent animate-spin"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-2">
                <LifeBuoy className="h-8 w-8 opacity-20" />
                <p className="text-xs">Send a message to start a live support session.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === chatSession?.buyerId
                const senderName = isMe ? (chatSession?.buyer?.name || "You") : (msg.sender?.name || agentName)
                
                return (
                  <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isMe ? 'text-[#0ea5e9] mr-1' : 'text-gray-500 ml-1'}`}>
                      {senderName}
                    </span>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      isMe 
                        ? 'bg-[#0ea5e9] text-white rounded-tr-sm' 
                        : 'bg-[#27272a] text-gray-200 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-[#27272a] bg-[#09090b] p-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isUnauth}
                placeholder={isUnauth ? "Login required" : "Type your message..."}
                className="w-full rounded-full border border-[#27272a] bg-[#141417] py-2.5 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-1 focus:ring-[#0ea5e9] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isUnauth}
                className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0ea5e9] text-white transition-colors hover:bg-[#0284c7] disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {chatSession?.status === "SUCCESS" && (
              <p className="text-[10px] text-center text-green-500 mt-2 font-bold bg-green-500/10 py-1 rounded">
                This session has been marked as resolved.
              </p>
            )}
          </form>
        </div>
      )}
    </>
  )
}
