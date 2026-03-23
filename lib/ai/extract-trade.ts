import { execFileSync } from "node:child_process";
import { ExtractedTrade } from "../types";
import { loadExtractTradePrompt } from "./load-extract-trade-prompt";

const fallbackEmpty: ExtractedTrade = {
  has_trade: false,
  ticker: "",
  asset_type: "crypto",
  direction: "long",
  thesis: "",
  confidence: "low",
  timeframe: "unknown",
  key_catalysts: [],
  risks: [],
};

function keywordFallback(text: string): ExtractedTrade {
  const lowered = text.toLowerCase();
  const hasDirection = /(long|short|buy|sell|bullish|bearish|yes|no|calls|puts)/.test(lowered);
  const ticker = (text.match(/\$?([A-Z]{2,6})\b/)?.[1] ?? "").toUpperCase();

  if (!hasDirection || !ticker) return fallbackEmpty;

  const isShort = /(short|sell|bearish|puts)/.test(lowered);

  return {
    has_trade: true,
    ticker,
    asset_type: ["BTC", "ETH", "SOL", "AVAX", "ARB", "DOGE", "ADA", "XRP"].includes(ticker) ? "crypto" : "stock",
    direction: isShort ? "short" : "long",
    thesis: "Directional call extracted by keyword fallback. Review before trusting it with real money.",
    confidence: "low",
    timeframe: /(1d|today|tomorrow)/.test(lowered) ? "1d" : /(week|1w)/.test(lowered) ? "1w" : /(month|30d)/.test(lowered) ? "1m" : "unknown",
    key_catalysts: ["Momentum", "Narrative flow"],
    risks: ["Keyword fallback used"],
  };
}

function parseClaudeResponse(result: string): ExtractedTrade {
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<ExtractedTrade>;
  return {
    ...fallbackEmpty,
    ...parsed,
    ticker: String(parsed.ticker ?? "").toUpperCase(),
    thesis: String(parsed.thesis ?? ""),
    timeframe: String(parsed.timeframe ?? "unknown"),
    key_catalysts: Array.isArray(parsed.key_catalysts) ? parsed.key_catalysts.map(String) : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
  };
}

function extractWithClaude(text: string, prompt: string): ExtractedTrade {
  const fullPrompt = `${prompt}\n\nText to analyze:\n${text}\n\nReturn ONLY valid JSON. No markdown fences, no explanation.`;

  const result = execFileSync("claude", ["-p", "--output-format", "text"], {
    input: fullPrompt,
    encoding: "utf-8",
    timeout: 45_000,
    maxBuffer: 1024 * 1024,
  });

  return parseClaudeResponse(result);
}

export async function extractTrade(text: string): Promise<ExtractedTrade> {
  if (!text.trim()) return fallbackEmpty;

  try {
    const prompt = await loadExtractTradePrompt();
    if (!prompt.trim()) {
      return keywordFallback(text);
    }

    return extractWithClaude(text, prompt);
  } catch {
    return keywordFallback(text);
  }
}
