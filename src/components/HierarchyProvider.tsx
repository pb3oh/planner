"use client";

import { createContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { L0Node } from "@/lib/hierarchy";

type HierarchyContextValue = {
  l0s: L0Node[];
  loading: boolean;
};

export const HierarchyContext = createContext<HierarchyContextValue>({
  l0s: [],
  loading: true,
});

export function HierarchyProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [l0s, setL0s] = useState<L0Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/hierarchy")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        setL0s(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <HierarchyContext.Provider value={{ l0s, loading }}>
      {children}
    </HierarchyContext.Provider>
  );
}
