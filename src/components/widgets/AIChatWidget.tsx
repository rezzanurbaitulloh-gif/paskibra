"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, Send, X, MessageSquare } from "lucide-react"
import { streamResponse } from "@/services/aiService"
import { useDraggableFloat } from "@/hooks/useDraggableFloat"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const PANEL_W = 360
const PANEL_H = 440

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const btn = useDraggableFloat("ai-btn", 48, 48)
  const panel = useDraggableFloat("ai-panel", PANEL_W, PANEL_H)

  const toggleChat = () => setIsOpen(!isOpen)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      let assistantMessage = ""
      const assistantMessageId = crypto.randomUUID()

      setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }])

      await streamResponse(input, (chunk) => {
        assistantMessage += chunk
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: assistantMessage } : msg))
        )
      })
    } catch (error) {
      console.error("AI Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  let panelStyle: React.CSSProperties | undefined
  if (panel.pos) {
    panelStyle = { left: panel.pos.x, top: panel.pos.y }
  } else {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024
    const vh = typeof window !== "undefined" ? window.innerHeight : 768
    const w = Math.min(PANEL_W, vw - 32)
    let x: number
    let y: number
    if (btn.pos) {
      x = btn.pos.x + 48 + 8 - w
      x = Math.max(4, Math.min(x, vw - w - 4))
      y = btn.pos.y - PANEL_H - 8
      if (y < 4) y = btn.pos.y + 48 + 8
      y = Math.max(4, Math.min(y, vh - PANEL_H - 4))
    } else {
      x = vw - w - 20
      y = vh - PANEL_H - 80
    }
    panelStyle = { left: x, top: y }
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.25 }}
            className={btn.pos ? "fixed z-[60]" : "fixed bottom-5 right-5 z-[60]"}
            style={btn.pos ? { left: btn.pos.x, top: btn.pos.y } : undefined}
            onPointerDown={btn.onPointerDown}
            title="Tahan & geser untuk memindahkan"
          >
            <button
              onClick={() => {
                if (!btn.movedRef.current) toggleChat()
              }}
              aria-label="Buka chatbot"
              className="relative flex h-12 w-12 cursor-grab touch-none items-center justify-center rounded-full gradient-primary text-white shadow-glow-red active:cursor-grabbing"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-15" />
              <MessageSquare className="relative h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed z-[70]"
            style={panelStyle}
          >
            <div className="flex h-[440px] max-h-[70vh] w-[360px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
              {/* Header (drag handle) */}
              <div
                className="flex cursor-grab touch-none items-center justify-between border-b border-white/[0.08] px-4 py-3 active:cursor-grabbing"
                onPointerDown={panel.onPointerDown}
                title="Tahan & geser untuk memindahkan"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-full gradient-primary">
                    <Bot className="h-4 w-4 text-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-card" />
                  </div>
                  <div className="leading-tight">
                    <p className="font-display text-sm font-bold">Tanya Satria Bot</p>
                    <p className="text-[10px] text-green-400">Online</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleChat}
                  aria-label="Tutup"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                      <Bot className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Tanyakan apa saja tentang Paskibra<br />atau SMKN 1 Kertosono
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                          message.role === "user"
                            ? "bg-white text-black"
                            : "border border-white/[0.08] bg-white/[0.04]"
                        }`}
                      >
                        {message.content || (message.role === "assistant" ? "…" : "")}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/[0.08] p-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Ketik pesan..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={isLoading}
                    className="h-10 border-white/10 bg-white/[0.03] text-[13px] focus-visible:ring-accent"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    aria-label="Kirim"
                    className="h-10 w-10 shrink-0 gradient-primary text-white hover:brightness-110"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}