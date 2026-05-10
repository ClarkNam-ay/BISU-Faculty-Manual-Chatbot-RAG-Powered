"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Settings,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { content: string; similarity: number }[];
  error?: boolean;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<
    Record<string, boolean>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.content }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Request failed");

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          err instanceof Error
            ? err.message
            : "An error occurred. Please try again.",
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSources = (id: string) => {
    setExpandedSources((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const suggestedQuestions = [
    "What are the teaching load requirements for regular faculty?",
    "How does the grading system work at BISU?",
    "What scholarships are available for faculty members?",
    "What are the grounds for disciplinary action?",
    "How are faculty members evaluated and ranked?",
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-card)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "2px solid var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={16} color="var(--gold)" />
          </div>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "0.01em",
              }}
            >
              BISU Faculty Manual
            </h1>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
              }}
            >
              RAG-POWERED ASSISTANT
            </p>
          </div>
        </div>
        <a
          href="/admin"
          title="Admin"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "6px",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--gold-dim)";
            e.currentTarget.style.color = "var(--gold-dim)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <Settings size={14} />
        </a>
      </header>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: 640, margin: "0 auto", paddingTop: "40px" }}>
            {/* Welcome */}
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  border: "2px solid var(--gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 0 30px var(--gold-glow)",
                }}
              >
                <BookOpen size={28} color="var(--gold)" />
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.9rem",
                  fontWeight: 300,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                  fontStyle: "italic",
                }}
              >
                Ask the Faculty Manual
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                }}
              >
                Powered by RAG — I search the BISU Faculty Manual to answer your
                questions accurately.
              </p>
            </div>

            {/* Suggested questions */}
            <div>
              <p
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  marginBottom: "12px",
                }}
              >
                SUGGESTED QUESTIONS
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    style={{
                      padding: "11px 16px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "var(--font-body)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.borderColor = "var(--gold-dim)";
                      el.style.color = "var(--text-primary)";
                      el.style.background = "rgba(201,168,76,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.borderColor = "var(--border)";
                      el.style.color = "var(--text-secondary)";
                      el.style.background = "var(--bg-card)";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              maxWidth: 760,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="message-enter"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {/* Role label */}
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    color: msg.role === "user" ? "#5a9a5a" : "var(--gold-dim)",
                    marginBottom: "5px",
                    paddingLeft: msg.role === "user" ? 0 : "4px",
                  }}
                >
                  {msg.role === "user" ? "YOU" : "BISU ASSISTANT"}
                </span>

                {/* Bubble */}
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "14px 18px",
                    borderRadius:
                      msg.role === "user"
                        ? "12px 12px 4px 12px"
                        : "12px 12px 12px 4px",
                    background:
                      msg.role === "user"
                        ? "var(--user-bubble)"
                        : "var(--ai-bubble)",
                    border: `1px solid ${msg.role === "user" ? "var(--user-border)" : msg.error ? "#4a1a1a" : "var(--ai-border)"}`,
                    color: msg.error ? "#c25a5a" : "var(--text-primary)",
                    fontSize: "0.95rem",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ maxWidth: "82%", marginTop: "6px" }}>
                    <button
                      onClick={() => toggleSources(msg.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.05em",
                        padding: "4px 0",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--gold-dim)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                    >
                      <FileText size={11} />
                      {msg.sources.length} SOURCE EXCERPTS
                      {expandedSources[msg.id] ? (
                        <ChevronUp size={11} />
                      ) : (
                        <ChevronDown size={11} />
                      )}
                    </button>

                    {expandedSources[msg.id] && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          marginTop: "6px",
                        }}
                      >
                        {msg.sources.map((src, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "10px 14px",
                              background: "rgba(201,168,76,0.03)",
                              border: "1px solid var(--border)",
                              borderLeft: "2px solid var(--gold-dim)",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              color: "var(--text-secondary)",
                              lineHeight: 1.6,
                            }}
                          >
                            <div
                              style={{
                                marginBottom: "4px",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.68rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              MATCH {src.similarity}%
                            </div>
                            {src.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div
                className="message-enter"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    color: "var(--gold-dim)",
                    marginBottom: "5px",
                    paddingLeft: "4px",
                  }}
                >
                  BISU ASSISTANT
                </span>
                <div
                  style={{
                    padding: "14px 20px",
                    background: "var(--ai-bubble)",
                    border: "1px solid var(--ai-border)",
                    borderRadius: "12px 12px 12px 4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "16px 24px 20px",
          background: "var(--bg-card)",
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-end",
              padding: "4px 4px 4px 16px",
              border: "1px solid var(--border-accent)",
              borderRadius: "10px",
              background: "var(--bg-input)",
              transition: "border-color 0.2s",
            }}
            onFocus={() => {}}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the BISU Faculty Manual…"
              rows={1}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: "0.95rem",
                fontFamily: "var(--font-body)",
                lineHeight: 1.6,
                resize: "none",
                padding: "8px 0",
                maxHeight: "120px",
                overflowY: "auto",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: "7px",
                border: "none",
                background:
                  loading || !input.trim() ? "var(--border)" : "var(--gold)",
                color:
                  loading || !input.trim() ? "var(--text-muted)" : "#1a1200",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginBottom: "4px",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <p
            style={{
              fontSize: "0.68rem",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              marginTop: "8px",
              textAlign: "center",
              letterSpacing: "0.04em",
            }}
          >
            ENTER to send · SHIFT+ENTER for new line · Answers grounded in the
            BISU Faculty Manual
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
