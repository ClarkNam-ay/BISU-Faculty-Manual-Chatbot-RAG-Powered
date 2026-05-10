"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Loader2,
  Send,
  Settings,
  X,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { content: string; similarity: number }[];
  error?: boolean;
};

const NYEL_LOGO_SRC = "/nyel-logo.png";

function LogoMark({
  size,
  rounded = "50%",
}: {
  size: number;
  rounded?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        border: "2px solid var(--gold)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#050505",
        boxShadow: "0 0 24px var(--gold-glow)",
        flexShrink: 0,
      }}
    >
      <Image
        src={NYEL_LOGO_SRC}
        alt="NYEL logo"
        width={size}
        height={size}
        priority={size > 40}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
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
          <LogoMark size={42} rounded="10px" />
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              NYEL
            </h1>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
              }}
            >
              FACULTY MANUAL ASSISTANT
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            title="About NYEL"
            aria-label="About NYEL"
            onClick={() => setAboutOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Info size={14} />
          </button>
          <a
            href="/admin"
            title="Admin"
            aria-label="Admin"
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
          >
            <Settings size={14} />
          </a>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: 640, margin: "0 auto", paddingTop: "40px" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <LogoMark size={86} rounded="14px" />
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
                Ask NYEL
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                }}
              >
                I search the BISU Faculty Manual to answer your questions
                accurately.
              </p>
            </div>

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
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
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
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                {msg.role === "assistant" && (
                  <div style={{ marginTop: "20px" }}>
                    <LogoMark size={34} />
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: msg.role === "user" ? "82%" : "calc(82% - 44px)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.08em",
                      color:
                        msg.role === "user" ? "#5a9a5a" : "var(--gold-dim)",
                      marginBottom: "5px",
                      paddingLeft: msg.role === "user" ? 0 : "4px",
                    }}
                  >
                    {msg.role === "user" ? "YOU" : "NYEL"}
                  </span>

                  <div
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      borderRadius:
                        msg.role === "user"
                          ? "12px 12px 4px 12px"
                          : "12px 12px 12px 4px",
                      background:
                        msg.role === "user"
                          ? "var(--user-bubble)"
                          : "var(--ai-bubble)",
                      border: `1px solid ${
                        msg.role === "user"
                          ? "var(--user-border)"
                          : msg.error
                            ? "#4a1a1a"
                            : "var(--ai-border)"
                      }`,
                      color: msg.error ? "#c25a5a" : "var(--text-primary)",
                      fontSize: "0.95rem",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.content}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ width: "100%", marginTop: "6px" }}>
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
                              key={`${msg.id}-${i}`}
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
              </div>
            ))}

            {loading && (
              <div
                className="message-enter"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div style={{ marginTop: "20px" }}>
                  <LogoMark size={34} />
                </div>
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.68rem",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.08em",
                      color: "var(--gold-dim)",
                      marginBottom: "5px",
                      paddingLeft: "4px",
                    }}
                  >
                    NYEL
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
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {aboutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-nyel-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 20,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setAboutOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              background: "var(--bg-card)",
              border: "1px solid var(--border-accent)",
              borderRadius: "10px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
              padding: "22px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <LogoMark size={48} rounded="10px" />
                <div>
                  <h2
                    id="about-nyel-title"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.35rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "2px",
                    }}
                  >
                    About NYEL
                  </h2>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    BISU FACULTY MANUAL ASSISTANT
                  </p>
                </div>
              </div>
              <button
                type="button"
                title="Close"
                aria-label="Close about modal"
                onClick={() => setAboutOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 30,
                  height: 30,
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                color: "var(--text-secondary)",
                fontSize: "0.94rem",
                lineHeight: 1.7,
              }}
            >
              <p>
                NYEL is an AI-powered BISU Faculty Assistant designed to help
                faculty members quickly access information from the BISU Faculty
                Manual. It provides fast, accurate, and user-friendly responses
                to questions related to policies, guidelines, academic
                procedures, and faculty concerns.
              </p>
              <p>
                Built with modern AI and Retrieval-Augmented Generation (RAG)
                technology, NYEL simplifies the process of searching through
                lengthy documents by delivering relevant answers instantly. Its
                goal is to support faculty members with convenient access to
                important information anytime and anywhere.
              </p>
              <p>
                NYEL was developed to promote efficiency, accessibility, and
                smarter academic support within the BISU community.
              </p>
              <p
                style={{
                  padding: "12px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  background: "var(--bg-input)",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.74rem",
                  letterSpacing: "0.03em",
                }}
              >
                Use the admin panel to update the indexed PDF source.
              </p>
            </div>
          </div>
        </div>
      )}

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
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the BISU Faculty Manual..."
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
            ENTER to send | SHIFT+ENTER for new line | Answers grounded in the
            BISU Faculty Manual 2022 Edition
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
