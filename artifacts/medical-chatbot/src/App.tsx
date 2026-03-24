import { useState, useRef, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

// ---- Types ----
interface ChatSession {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}
interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "bot";
  content: string;
  createdAt: string;
}
interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

// ---- API calls ----
async function fetchSessions(): Promise<ChatSession[]> {
  const r = await fetch(`${API}/chat/sessions`);
  if (!r.ok) throw new Error("Failed to fetch sessions");
  return r.json();
}
async function createSession(title: string): Promise<ChatSession> {
  const r = await fetch(`${API}/chat/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!r.ok) throw new Error("Failed to create session");
  return r.json();
}
async function fetchSession(id: string): Promise<ChatSessionWithMessages> {
  const r = await fetch(`${API}/chat/sessions/${id}`);
  if (!r.ok) throw new Error("Failed to fetch session");
  return r.json();
}
async function deleteSession(id: string): Promise<void> {
  const r = await fetch(`${API}/chat/sessions/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error("Failed to delete session");
}

// SSE streaming message sender — returns an async iterator of content chunks
async function* streamMessage(sessionId: string, content: string): AsyncGenerator<{ chunk?: string; done?: boolean; message?: ChatMessage; error?: string }> {
  const response = await fetch(`${API}/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    yield { error: "Failed to send message", done: true };
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) yield { chunk: data.content };
          if (data.done) yield { done: true, message: data.message, error: data.error };
        } catch {
          // ignore parse errors
        }
      }
    }
  }
}

// ---- Icons ----
function StethoscopeIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

// ---- Typing Indicator ----
function TypingIndicator() {
  return (
    <div className="message-animate flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: "hsl(210 100% 50%)" }}>
        <StethoscopeIcon size={15} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-md shadow-sm" style={{ background: "hsl(210 100% 95%)" }}>
        <div className="flex gap-1.5 items-center h-5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

// ---- Message Bubble ----
function MessageBubble({ msg, streaming = false }: { msg: ChatMessage; streaming?: boolean }) {
  const isBot = msg.role === "bot";
  return (
    <div className={`message-animate flex items-end gap-2 mb-4 ${isBot ? "" : "flex-row-reverse"}`}>
      {isBot ? (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: "hsl(210 100% 50%)" }}>
          <StethoscopeIcon size={15} className="text-white" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm text-white text-sm font-semibold" style={{ background: "hsl(210 100% 40%)" }}>
          U
        </div>
      )}
      <div
        className={`max-w-[72%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${isBot ? "rounded-bl-md" : "rounded-br-md"}`}
        style={
          isBot
            ? { background: "hsl(210 100% 95%)", color: "hsl(210 100% 20%)" }
            : { background: "hsl(210 40% 90%)", color: "hsl(222 47% 11%)" }
        }
      >
        {msg.content}
        {streaming && <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />}
        {!streaming && (
          <div className={`text-xs mt-1.5 opacity-50 ${isBot ? "text-left" : "text-right"}`}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Empty State ----
function EmptyState({ onQuickStart }: { onQuickStart: (text: string) => void }) {
  const quickStarts = [
    { label: "What are the symptoms of diabetes?", icon: "🩸" },
    { label: "How can I improve my heart health?", icon: "❤️" },
    { label: "What are early signs of Parkinson's?", icon: "🧠" },
    { label: "How do I lower my blood pressure?", icon: "💉" },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "hsl(210 100% 50%)" }}>
        <StethoscopeIcon size={32} className="text-white" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">How can I help you today?</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Ask me about health conditions, symptoms, medications, or get a risk assessment.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {quickStarts.map((q) => (
          <button
            key={q.label}
            onClick={() => onQuickStart(q.label)}
            className="quick-chip flex flex-col items-start gap-1 p-3 rounded-xl border border-border bg-card text-left text-xs font-medium text-foreground cursor-pointer"
          >
            <span className="text-base">{q.icon}</span>
            <span>{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Sidebar Content ----
function SidebarContent({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onQuickDiagnostic,
  onClose,
}: {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onQuickDiagnostic: (text: string) => void;
  onClose?: () => void;
}) {
  const quickDiagnostics = [
    { label: "Check my symptoms", icon: "🩺" },
    { label: "Diabetes risk factors", icon: "🩸" },
    { label: "Heart health tips", icon: "❤️" },
    { label: "Medication information", icon: "💊" },
  ];

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(210 40% 98%)" }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(210 100% 50%)" }}>
            <StethoscopeIcon size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground">MedBot AI</div>
            <div className="text-xs text-muted-foreground">Healthcare Assistant</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
            <CloseIcon />
          </button>
        )}
      </div>

      {/* New Chat */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "hsl(210 100% 50%)" }}
        >
          <PlusIcon />
          New Chat
        </button>
      </div>

      {/* Chat History */}
      <div className="px-3 pb-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">
          Chat History
        </div>
        <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto chat-scroll">
          {sessions.length === 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-2">No conversations yet</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`session-item group flex items-start gap-2 px-2 py-2 rounded-lg cursor-pointer relative ${activeSessionId === s.id ? "active" : ""}`}
                onClick={() => onSelectSession(s.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{s.title}</div>
                  {s.preview && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{s.preview}</div>
                  )}
                  <div className="text-xs text-muted-foreground opacity-60 mt-0.5">{formatDate(s.updatedAt)}</div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-destructive text-muted-foreground transition-opacity flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                  title="Delete chat"
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-border my-2" />

      {/* Quick Diagnostics */}
      <div className="px-3 flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">
          Quick Diagnostics
        </div>
        <div className="flex flex-col gap-1">
          {quickDiagnostics.map((q) => (
            <button
              key={q.label}
              onClick={() => onQuickDiagnostic(q.label)}
              className="quick-chip flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-card text-left text-xs font-medium text-foreground"
            >
              <span>{q.icon}</span>
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground leading-snug">
          For informational use only. Always consult a qualified healthcare professional.
        </p>
      </div>
    </div>
  );
}

// ---- Main Chat ----
function ChatApp() {
  const qc = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<boolean>(false);

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
    refetchInterval: 8000,
  });

  const { data: sessionData } = useQuery({
    queryKey: ["session", activeSessionId],
    queryFn: () => fetchSession(activeSessionId!),
    enabled: !!activeSessionId,
  });

  useEffect(() => {
    if (sessionData) {
      setMessages(sessionData.messages);
    }
  }, [sessionData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  const deleteSessionMut = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
    },
  });

  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // User message shown immediately
    const tempId = `temp-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempId,
      sessionId: activeSessionId ?? "",
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    abortRef.current = false;

    let sessionId = activeSessionId;

    if (!sessionId) {
      const title = content.length > 50 ? content.substring(0, 50) + "…" : content;
      try {
        const newSession = await createSession(title);
        qc.invalidateQueries({ queryKey: ["sessions"] });
        setActiveSessionId(newSession.id);
        sessionId = newSession.id;
      } catch {
        setIsStreaming(false);
        return;
      }
    }

    // Start streaming bot response
    const streamMsg: ChatMessage = {
      id: `stream-${Date.now()}`,
      sessionId,
      role: "bot",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setStreamingMessage(streamMsg);

    try {
      for await (const event of streamMessage(sessionId, content)) {
        if (abortRef.current) break;

        if (event.chunk) {
          setStreamingMessage((prev) =>
            prev ? { ...prev, content: prev.content + event.chunk } : prev
          );
        }

        if (event.done) {
          setStreamingMessage(null);
          if (event.message) {
            setMessages((prev) => {
              // Replace temp user msg with server-confirmed messages
              const withoutTemp = prev.filter((m) => m.id !== tempId);
              return [...withoutTemp, event.message!];
            });
          }
          qc.invalidateQueries({ queryKey: ["sessions"] });
          qc.invalidateQueries({ queryKey: ["session", sessionId] });
          break;
        }
      }
    } catch {
      setStreamingMessage(null);
    } finally {
      setIsStreaming(false);
    }
  }, [input, activeSessionId, isStreaming, qc]);

  function handleSelectSession(id: string) {
    if (isStreaming) return;
    setActiveSessionId(id);
    setMessages([]);
    setStreamingMessage(null);
    setSidebarOpen(false);
  }

  function handleNewChat() {
    if (isStreaming) return;
    setActiveSessionId(null);
    setMessages([]);
    setStreamingMessage(null);
    setSidebarOpen(false);
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const sessionTitle = activeSession?.title ?? "New Conversation";
  const allMessages = streamingMessage ? [...messages, streamingMessage] : messages;

  return (
    <div className="h-screen w-screen flex overflow-hidden relative">
      {/* Medical BG */}
      <div className="medical-bg" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 flex-shrink-0 border-r border-border z-10" style={{ background: "hsl(210 40% 98%)" }}>
        <SidebarContent
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={(id) => deleteSessionMut.mutate(id)}
          onQuickDiagnostic={(text) => handleSend(text)}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 z-50 shadow-2xl">
            <SidebarContent
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onNewChat={handleNewChat}
              onDeleteSession={(id) => deleteSessionMut.mutate(id)}
              onQuickDiagnostic={(text) => { setSidebarOpen(false); handleSend(text); }}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main Chat */}
      <main className="flex flex-col flex-1 min-w-0 z-10">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <button className="md:hidden p-1.5 rounded-lg hover:bg-muted" onClick={() => setSidebarOpen(true)}>
            <MenuIcon />
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground truncate">{sessionTitle}</div>
            {activeSession && (
              <div className="text-xs text-muted-foreground">{activeSession.messageCount} messages</div>
            )}
          </div>
          <button
            onClick={handleNewChat}
            disabled={isStreaming}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: "hsl(210 100% 50%)" }}
          >
            <PlusIcon />
            New
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 flex flex-col">
          <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
            {allMessages.length === 0 && !isStreaming ? (
              <EmptyState onQuickStart={(text) => handleSend(text)} />
            ) : (
              <div className="flex flex-col justify-end flex-1 pt-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {streamingMessage && (
                  <MessageBubble
                    key="streaming"
                    msg={streamingMessage}
                    streaming={streamingMessage.content.length > 0}
                  />
                )}
                {isStreaming && !streamingMessage?.content && <TypingIndicator />}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <div className="max-w-2xl mx-auto flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder={isStreaming ? "MedBot is responding…" : "Ask me about health conditions, symptoms…"}
                rows={1}
                disabled={isStreaming}
                className="w-full resize-none px-4 py-3 pr-4 rounded-2xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 transition-shadow leading-relaxed"
                style={{ maxHeight: "120px", minHeight: "48px" }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="send-btn w-12 h-12 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-all"
              style={{ background: "hsl(210 100% 50%)" }}
            >
              <SendIcon />
            </button>
          </div>
          <div className="max-w-2xl mx-auto mt-1.5">
            <p className="text-center text-xs text-muted-foreground opacity-60">
              Powered by OpenAI · Enter to send · Shift+Enter for newline
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatApp />
    </QueryClientProvider>
  );
}
