"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Extracted = {
  has_trade: boolean;
  ticker: string;
  asset_type: string;
  direction: string;
  thesis: string;
  confidence: string;
  timeframe: string;
};

const EXAMPLES = [
  "https://www.reddit.com/r/wallstreetbets/",
  "https://polymarket.com/",
  "https://cointelegraph.com/",
];

export default function SubmitPage() {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Extracted | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const extract = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Extraction failed");
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!result) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, url, confirm: true }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Could not save trade");
      setLoading(false);
      return;
    }
    setText("");
    setUrl("");
    setResult(null);
    setSuccess(true);
    setLoading(false);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Submit Trade Call</h1>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader><CardTitle>Paste URL or text</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Source URL (optional)" className="font-mono" />
          <div className="flex flex-wrap gap-2 text-xs">
            {EXAMPLES.map((example) => (
              <button key={example} className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-400 hover:text-zinc-200" onClick={() => setUrl(example)}>
                Try: {example}
              </button>
            ))}
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Post text" className="min-h-40" />
          <Button onClick={extract} disabled={loading}>{loading ? "Extracting trade..." : "Extract Trade"}</Button>
        </CardContent>
      </Card>

      {error ? <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"><AlertCircle className="size-4" /> {error}</div> : null}
      {success ? <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"><CheckCircle2 className="size-4" /> Trade added to the feed.</div> : null}

      {result ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader><CardTitle>Extraction Preview</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="text-xl font-bold tracking-tight">
              {result.ticker || "N/A"}
              <span className={`ml-2 rounded px-2 py-0.5 text-xs ${result.direction === "long" || result.direction === "yes" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                {result.direction}
              </span>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{result.confidence}</Badge>
              <Badge variant="secondary">{result.timeframe}</Badge>
              <Badge variant="secondary">{result.asset_type}</Badge>
            </div>
            <p className="text-zinc-300">{result.thesis}</p>
            <Button onClick={confirm} disabled={!result.has_trade || loading}>Confirm and Add</Button>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
