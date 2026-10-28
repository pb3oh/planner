"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const LINKS = [
  { href: "/", label: "Submit" },
  { href: "/inbox", label: "Inbox" },
  { href: "/plan", label: "Plan" },
  { href: "/cycle-time", label: "Cycle time" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname === "/login") return null;

  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "super_admin";

  return (
    <header
      style={{
        height: 52,
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 18,
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      <Link
        href="/plan"
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#0f172a",
          textDecoration: "none",
          fontFamily: "var(--font-sans)",
          letterSpacing: -0.2,
        }}
      >
        Planner
      </Link>

      <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {LINKS.map((l) => {
          const active =
            l.href === "/"
              ? pathname === "/"
              : pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? "#1d4ed8" : "#64748b",
                background: active ? "#eff6ff" : "transparent",
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              {l.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin/users"
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: pathname.startsWith("/admin") ? 600 : 500,
              color: pathname.startsWith("/admin") ? "#1d4ed8" : "#64748b",
              background: pathname.startsWith("/admin") ? "#eff6ff" : "transparent",
              textDecoration: "none",
              fontFamily: "var(--font-sans)",
            }}
          >
            Users
          </Link>
        )}
      </nav>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {status === "authenticated" && (
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
                padding: "4px 10px",
                borderRadius: 6,
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
        )}
      </div>
    </header>
  );
}
