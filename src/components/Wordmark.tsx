import { APP_NAME, APP_TAGLINE, APP_VERSION } from "@/lib/constants";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <LogoMark />
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: 0.2,
              fontFamily: "var(--font-sans)",
            }}
          >
            {APP_NAME}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: "#94a3b8",
              letterSpacing: 0.1,
              fontFamily: "var(--font-sans)",
            }}
          >
            {APP_TAGLINE}
          </span>
        </span>
        {!compact && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "#cbd5e1",
              fontFamily: "var(--font-sans)",
              marginTop: 1,
            }}
          >
            v{APP_VERSION}
          </span>
        )}
      </span>
    </span>
  );
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#2563eb" />
      <path
        d="M16 5.5L26 11.2V20.8L16 26.5L6 20.8V11.2L16 5.5Z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 11.2L21.2 14.2V20.2L16 23.2L10.8 20.2V14.2L16 11.2Z"
        fill="#93c5fd"
      />
    </svg>
  );
}
