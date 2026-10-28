"use client";

import { createContext, useEffect, useState } from "react";
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
  const [l0s, setL0s] = useState<L0Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hierarchy")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setL0s(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <HierarchyContext.Provider value={{ l0s, loading }}>
      {children}
    </HierarchyContext.Provider>
  );
}
