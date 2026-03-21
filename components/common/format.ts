import { formatDistanceToNowStrict, format } from "date-fns";

export const pct = (n?: number) => {
  const value = n ?? 0;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

export const pnlColor = (n?: number) => ((n ?? 0) >= 0 ? "text-emerald-400" : "text-red-400");

export const usd = (n?: number) => {
  const value = n ?? 0;
  const decimals = Math.abs(value) < 1 ? 4 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const compactUsd = (n?: number) => {
  const value = n ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export const relativeTime = (date?: string) => {
  if (!date) return "just now";
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
};

export const exactTime = (date?: string) => (date ? format(new Date(date), "PPpp") : "Unknown date");

export const cleanText = (text?: string) =>
  (text ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export const truncate = (text?: string, max = 300) => {
  const cleaned = cleanText(text);
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max)}...`;
};
