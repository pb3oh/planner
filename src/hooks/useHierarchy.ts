"use client";

import { useContext } from "react";
import { HierarchyContext } from "@/components/HierarchyProvider";

export function useHierarchy() {
  return useContext(HierarchyContext);
}
