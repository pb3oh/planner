"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Wordmark } from "@/components/Wordmark";

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname === "/login") return null;

  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "super_admin";

  const links = [
    { href: "/", label: "Request Work", match: (p: string) => p === "/" },
    {
      href: "/plan",
      label: "Plan",
      match: (p: string) => p === "/plan" || p.startsWith("/plan/"),
    },
    ...(isAdmin
      ? [
          {
            href: "/inbox",
            label: "Inbox",
            match: (p: string) => p.startsWith("/inbox") || p.startsWith("/admin"),
          },
        ]
      : []),
  ];

  return (
    <header
      style={{
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 22,
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
        <Wordmark />
      </Link>

      <nav style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {links.map((l) => {
          const active = l.match(pathname);
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? "#0f172a" : "#64748b",
                background: active ? "#f1f5f9" : "transparent",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {status === "authenticated" && session?.user ? (
          <>
            <span
              style={{
                fontSize: 12,
                color: "#64748b",
                fontFamily: "var(--font-sans)",
              }}
            >
              {session.user.name ?? session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: "transparent",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Sign out
            </button>
          </>
        ) : status === "unauthenticated" ? (
          <Link
            href="/login"
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: "#2563eb",
              color: "#fff",
              textDecoration: "none",
              fontFamily: "var(--font-sans)",
            }}
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </header>
  );
}
