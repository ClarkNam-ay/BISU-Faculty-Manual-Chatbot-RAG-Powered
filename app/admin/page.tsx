"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Upload,
  Lock,
  LogOut,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  ChevronRight,
} from "lucide-react";

type IngestStatus = "idle" | "ingesting" | "done" | "error";

type UploadRecord = {
  filename: string;
  chunks: number;
  timestamp: string;
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [ingestStatus, setIngestStatus] = useState<IngestStatus>("idle");
  const [ingestMessage, setIngestMessage] = useState("");
  const [ingestDetail, setIngestDetail] = useState("");
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin-auth", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data) => setAuthed(Boolean(data.authenticated)))
      .catch(() => setAuthed(false));
  }, []);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Auth failed");
      setAuthed(true);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Authentication failed",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setIngestStatus("error");
      setIngestMessage("Only PDF files are supported");
      return;
    }

    setIngestStatus("ingesting");
    setIngestMessage(`Processing "${file.name}"…`);
    setIngestDetail("Extracting text and creating chunks…");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ingestion failed");

      setIngestStatus("done");
      setIngestMessage(`Successfully indexed "${file.name}"`);
      setIngestDetail(
        `${data.embedded} chunks embedded · ${data.failed} failed`,
      );

      setUploads((prev) => [
        {
          filename: file.name,
          chunks: data.embedded,
          timestamp: new Date().toLocaleString(),
        },
        ...prev,
      ]);
    } catch (err) {
      setIngestStatus("error");
      setIngestMessage("Ingestion failed");
      setIngestDetail(err instanceof Error ? err.message : "Unknown error");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Login Screen ──────────────────────────────────────────
  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "40px 36px",
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "2px solid var(--gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 0 24px var(--gold-glow)",
              }}
            >
              <Lock size={22} color="var(--gold)" />
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}
            >
              Admin Access
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              BISU FACULTY MANUAL · DOCUMENT MANAGER
            </p>
          </div>

          {/* Password input */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                marginBottom: "8px",
              }}
            >
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter admin password"
              autoFocus
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--bg-input)",
                border: `1px solid ${authError ? "#c25a5a" : "var(--border-accent)"}`,
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: "0.95rem",
                fontFamily: "var(--font-body)",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--gold)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = authError
                  ? "#c25a5a"
                  : "var(--border-accent)";
              }}
            />
            {authError && (
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "0.8rem",
                  color: "#c25a5a",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <AlertCircle size={12} /> {authError}
              </p>
            )}
          </div>

          <button
            onClick={handleLogin}
            disabled={authLoading || !password.trim()}
            style={{
              width: "100%",
              padding: "12px",
              background:
                authLoading || !password.trim()
                  ? "var(--border)"
                  : "var(--gold)",
              color:
                authLoading || !password.trim()
                  ? "var(--text-muted)"
                  : "#1a1200",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              cursor:
                authLoading || !password.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            {authLoading ? (
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <ChevronRight size={16} />
            )}
            {authLoading ? "VERIFYING…" : "LOGIN"}
          </button>

          <p
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <Link
              href="/"
              style={{ color: "var(--gold-dim)", textDecoration: "none" }}
            >
              ← Back to Chat
            </Link>
          </p>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Admin Dashboard ───────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-card)",
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
              }}
            >
              Document Manager
            </h1>
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
              }}
            >
              BISU RAG · ADMIN PANEL
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              border: "1px solid var(--border-accent)",
              borderRadius: "6px",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              fontFamily: "var(--font-mono)",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--gold-dim)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-accent)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <BookOpen size={12} /> View Chat
          </Link>
          <button
            onClick={async () => {
              await fetch("/api/admin-auth", {
                method: "DELETE",
                credentials: "same-origin",
              }).catch(() => undefined);
              setAuthed(false);
              setPassword("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              border: "1px solid #4a1a1a",
              borderRadius: "6px",
              background: "transparent",
              color: "#c25a5a",
              fontSize: "0.8rem",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(194,90,90,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={12} /> Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        {/* Upload Zone */}
        <div style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Upload Faculty Manual
          </h2>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              marginBottom: "20px",
            }}
          >
            Uploading a new PDF will replace the existing indexed document.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            style={{ display: "none" }}
            id="admin-file-upload"
          />

          <label
            htmlFor="admin-file-upload"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "48px 24px",
              border: `2px dashed ${dragOver ? "var(--gold)" : ingestStatus === "done" ? "#3a6a3a" : ingestStatus === "error" ? "#6a2a2a" : "var(--border-accent)"}`,
              borderRadius: "12px",
              background: dragOver ? "rgba(201,168,76,0.05)" : "var(--bg-card)",
              cursor: ingestStatus === "ingesting" ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              textAlign: "center",
            }}
          >
            {ingestStatus === "ingesting" ? (
              <>
                <Loader2
                  size={36}
                  color="var(--gold-dim)"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <div>
                  <p
                    style={{
                      color: "var(--gold-dim)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      marginBottom: "4px",
                    }}
                  >
                    {ingestMessage}
                  </p>
                  <p
                    style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}
                  >
                    {ingestDetail}
                  </p>
                </div>
              </>
            ) : ingestStatus === "done" ? (
              <>
                <CheckCircle2 size={36} color="#5a9e5a" />
                <div>
                  <p
                    style={{
                      color: "#5a9e5a",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      marginBottom: "4px",
                    }}
                  >
                    {ingestMessage}
                  </p>
                  <p
                    style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}
                  >
                    {ingestDetail}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Click or drop to upload another
                </span>
              </>
            ) : ingestStatus === "error" ? (
              <>
                <AlertCircle size={36} color="#c25a5a" />
                <div>
                  <p
                    style={{
                      color: "#c25a5a",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      marginBottom: "4px",
                    }}
                  >
                    {ingestMessage}
                  </p>
                  <p
                    style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}
                  >
                    {ingestDetail}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Click or drop to try again
                </span>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: "1px solid var(--border-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bg-input)",
                  }}
                >
                  <Upload size={22} color="var(--text-muted)" />
                </div>
                <div>
                  <p
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      marginBottom: "4px",
                    }}
                  >
                    Drop your PDF here, or{" "}
                    <span style={{ color: "var(--gold)" }}>browse</span>
                  </p>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    PDF files only · Replaces existing index
                  </p>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Upload History */}
        {uploads.length > 0 && (
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Upload History
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {uploads.map((u, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 18px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                >
                  <FileText
                    size={18}
                    color="var(--gold-dim)"
                    style={{ flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.filename}
                    </p>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        marginTop: "2px",
                      }}
                    >
                      {u.chunks} chunks · {u.timestamp}
                    </p>
                  </div>
                  <CheckCircle2
                    size={16}
                    color="#5a9e5a"
                    style={{ flexShrink: 0 }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info box */}
        <div
          style={{
            marginTop: "32px",
            padding: "16px 20px",
            background: "rgba(201,168,76,0.04)",
            border: "1px solid var(--gold-dim)",
            borderRadius: "8px",
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--gold-dim)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.04em",
              marginBottom: "6px",
            }}
          >
            HOW IT WORKS
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
            }}
          >
            Uploading a PDF extracts and splits the text into chunks, embeds
            each chunk using Hugging Face, and stores the vectors in Supabase.
            The chat assistant then uses these vectors to find relevant passages
            before answering questions.
          </p>
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
