import { STATUS_LABEL } from "@/lib/constants";

export function fmt(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status.replaceAll("_", " ");
}

export function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function effortFromLabel(value: string): number {
  const map: Record<string, number> = { XS: 1, S: 2, M: 3, L: 4, XL: 5 };
  return map[value.toUpperCase()] ?? 3;
}
