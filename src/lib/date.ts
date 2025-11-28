import { format } from "date-fns";
import { ja } from "date-fns/locale";

export function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(
  value: Date | string | null | undefined,
  fmt: string,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  try {
    return format(d, fmt, { locale: ja });
  } catch {
    return fallback;
  }
}
