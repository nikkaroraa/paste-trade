import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
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
  const hasDirection = /(long|short|buy|sell|bullish|bearish|yes|no)/.test(lowered);
  const ticker = (text.match(/\$?([A-Z]{2,6})\b/)?.[1] ?? "").toUpperCase();

  if (!hasDirection || !ticker) return fallbackEmpty;

  const isShort = /(short|sell|bearish)/.test(lowered);

  return {
    has_trade: true,
    ticker,
    asset_type: ["BTC", "ETH", "SOL", "AVAX", "ARB", "DOGE"].includes(ticker) ? "crypto" : "stock",
    direction: isShort ? "short" : "long",
    thesis: "Directional call extracted by rules-based fallback. This signal may be noisy and should be reviewed.",
    confidence: "low",
    timeframe: /(1d|today)/.test(lowered) ? "1d" : /(week|1w)/.test(lowered) ? "1w" : "unknown",
    key_catalysts: ["Momentum", "Narrative flow"],
    risks: ["Extraction fallback used"],
  };
}

export async function extractTrade(text: string): Promise<ExtractedTrade> {
  if (!text.trim()) return fallbackEmpty;

  let prompt = "";
  try {
    prompt = await loadExtractTradePrompt();
  } catch {
    prompt = "";
  }

  if (!prompt) return keywordFallback(text);

  const openKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  try {
    if (openKey) {
      const openai = new OpenAI({ apiKey: openKey });
      const res = await openai.responses.create({
        model: "gpt-4o-mini",
        input: `${prompt}\n\nText:\n${text}`,
      });

      const output = res.output_text.trim();
      return JSON.parse(output) as ExtractedTrade;
    }

    if (anthropicKey) {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const msg = await anthropic.messages.create({
        model: "claude-3-5-haiku-latest",
        max_tokens: 600,
        messages: [{ role: "user", content: `${prompt}\n\nText:\n${text}` }],
      });

      const first = msg.content[0];
      if (first.type === "text") {
        return JSON.parse(first.text) as ExtractedTrade;
      }
    }
  } catch {
    return keywordFallback(text);
  }

  return keywordFallback(text);
}
