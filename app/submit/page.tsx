"use client";

import { useState } from "react";
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

export default function SubmitPage() {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Extracted | null>(null);
  const [loading, setLoading] = useState(false);

  const extract = async () => {
    setLoading(true);
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, url }),
    });
    const json = await res.json();
    setResult(json.data);
    setLoading(false);
  };

  const confirm = async () => {
    if (!result) return;
    await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, url, confirm: true }),
    });
    setText("");
    setUrl("");
    setResult(null);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Submit Trade Call</h1>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader><CardTitle>Paste URL or text</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Source URL (optional)" className="font-mono" />
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Post text" className="min-h-40" />
          <Button onClick={extract} disabled={loading}>{loading ? "Extracting..." : "Extract Trade"}</Button>
        </CardContent>
      </Card>

      {result ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader><CardTitle>Extraction Preview</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <Badge variant="secondary">{result.ticker || "N/A"}</Badge>
              <Badge variant="secondary">{result.direction}</Badge>
              <Badge variant="secondary">{result.confidence}</Badge>
            </div>
            <p>{result.thesis}</p>
            <Button onClick={confirm} disabled={!result.has_trade}>Confirm and Add</Button>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
