export const pct = (n?: number) => `${(n ?? 0).toFixed(2)}%`;
export const usd = (n?: number) => `$${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
