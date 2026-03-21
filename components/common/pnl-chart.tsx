"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { pct } from "@/components/common/format";

export function PnlChart({ data }: { data: Array<{ t: string; pnl: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="t" tick={{ fill: "#a1a1aa", fontSize: 11 }} label={{ value: "Date", position: "insideBottom", fill: "#71717a", fontSize: 11 }} />
          <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} label={{ value: "P&L %", angle: -90, position: "insideLeft", fill: "#71717a", fontSize: 11 }} />
          <Tooltip formatter={(v) => pct(Number(v))} contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8 }} />
          <Line type="monotone" dataKey="pnl" stroke="#34d399" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
