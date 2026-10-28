"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Wordmark } from "@/components/Wordmark";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("alex.admin@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const callbackUrl = params.get("callbackUrl") || "/";
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (!res || res.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: 380,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "28px 24px",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <Wordmark />
        </div>
        <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 20px" }}>
          Sign in with a seeded local account. No OAuth required.
        </p>
        <label style={{ display: "block", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
            Email
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="username"
          />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
            Password
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
          />
        </label>
        {error && (
          <div
            style={{
              color: "#b91c1c",
              fontSize: 13,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 7,
              padding: "8px 10px",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "9px 0",
            borderRadius: 8,
            background: "#1d4ed8",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: "14px 0 0", lineHeight: 1.5 }}>
          Seeded: alex.admin@example.com (super admin), morgan.pm@example.com (admin),
          sam.dev@example.com (user) — password <code>password123</code>
        </p>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 7,
  fontSize: 13,
  fontFamily: "var(--font-sans)",
  boxSizing: "border-box",
  color: "#0f172a",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, color: "#94a3b8" }}>Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
