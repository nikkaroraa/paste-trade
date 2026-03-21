"use client";

import { useState } from "react";
import { LoaderCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshDataButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const run = async () => {
    setLoading(true);
    setStatus("Running scrape...");
    const res = await fetch("/api/scrape", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setStatus(json.error || "Failed to scrape");
      setLoading(false);
      return;
    }
    setStatus(`Done. Added ${json?.result?.inserted ?? 0} trades.`);
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <Button onClick={run} disabled={loading} className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500">
        {loading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <RefreshCcw className="mr-2 size-4" />} Refresh Data
      </Button>
      {status ? <p className="text-xs text-zinc-400">{status}</p> : null}
    </div>
  );
}
