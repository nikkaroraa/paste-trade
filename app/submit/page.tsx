"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  "https://www.reddit.com/r/wallstreetbets/comments/1bhj6p8/nvda_yolo_update/",
  "https://www.reddit.com/r/CryptoCurrency/comments/1bi1c1n/why_i_am_still_bullish_on_solana/",
  "Bought SOL here. Looking for a breakout over the next week.",
];

export default function SubmitPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Extracted | null>(null);
  const [sourceText, setSourceText] = useState("");
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
      setSourceText(json.sourceText || text);
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
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText || text, url, confirm: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save trade");
      setText("");
      setUrl("");
      setSourceText("");
      setResult(null);
      setSuccess(true);
      router.push("/feed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Submit Trade Call</h1>
        <p className="text-sm text-zinc-400">Paste a URL or raw text. We fetch, extract, preview, then save it.</p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>Paste URL or text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Source URL" className="font-mono" />
          <div className="flex flex-wrap gap-2 text-xs">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                onClick={() => (example.startsWith("http") ? setUrl(example) : setText(example))}
              >
                Try: {example.length > 52 ? `${example.slice(0, 52)}...` : example}
              </button>
            ))}
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Post text" className="min-h-40" />
          <Button onClick={extract} disabled={loading || (!text.trim() && !url.trim())} className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500">
            {loading ? "Extracting trade..." : "Extract Trade"}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle className="size-4" /> {error}
        </div>
      ) : null}
      {success ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="size-4" /> Trade added to the feed.
        </div>
      ) : null}

      {result ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>Extraction Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-3xl font-bold tracking-tight">{result.ticker || "N/A"}</div>
              <Badge variant="secondary" className={result.direction === "long" || result.direction === "yes" ? "text-emerald-400" : "text-red-400"}>
                {result.direction}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{result.confidence}</Badge>
              <Badge variant="secondary">{result.timeframe}</Badge>
              <Badge variant="secondary">{result.asset_type}</Badge>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                  Source <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
            <p className="leading-relaxed text-zinc-300">{result.thesis || "No thesis extracted."}</p>
            {sourceText ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-400">
                <div className="mb-2 font-semibold text-zinc-200">Extracted source text</div>
                <p className="line-clamp-3 leading-relaxed">{sourceText}</p>
              </div>
            ) : null}
            <Button onClick={confirm} disabled={!result.has_trade || loading} className="bg-emerald-600 text-zinc-950 hover:bg-emerald-500">
              Confirm and Add
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
