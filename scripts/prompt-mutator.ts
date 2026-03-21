import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { CaseResult } from "./autoresearch";

export interface PromptMutationInput {
  prompt: string;
  accuracy: number;
  failedCases: CaseResult[];
}

function sanitizePrompt(text: string): string {
  return text.replace(/[\u2014\u2013]/g, "-").trim();
}

function buildMutationRequest(input: PromptMutationInput): string {
  const failedSummary = input.failedCases.map((item) => ({
    id: item.id,
    text: item.text,
    expected: {
      has_trade: item.expected.has_trade,
      ticker: item.expected.ticker,
      asset_type: item.expected.asset_type,
      direction: item.expected.direction,
      confidence: item.expected.confidence,
      timeframe: item.expected.timeframe,
    },
    predicted: {
      has_trade: item.predicted.has_trade,
      ticker: item.predicted.ticker,
      asset_type: item.predicted.asset_type,
      direction: item.predicted.direction,
      confidence: item.predicted.confidence,
      timeframe: item.predicted.timeframe,
    },
  }));

  return [
    "You are improving a prompt that extracts trades from text.",
    "Return the full updated prompt only. No extra commentary.",
    "Do not use em dash characters. Use standard hyphen only.",
    "Make targeted improvements that address the failures without breaking existing rules.",
    `Current accuracy: ${input.accuracy.toFixed(2)}%`,
    "Current prompt:",
    input.prompt,
    "Failed cases:",
    JSON.stringify(failedSummary, null, 2),
  ].join("\n");
}

async function mutateWithOpenAI(request: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }
  const openai = new OpenAI({ apiKey });
  const res = await openai.responses.create({
    model: "gpt-4o-mini",
    input: request,
  });
  return res.output_text;
}

async function mutateWithAnthropic(request: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  const anthropic = new Anthropic({ apiKey });
  const msg = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 1200,
    messages: [{ role: "user", content: request }],
  });
  const first = msg.content[0];
  if (first?.type !== "text") {
    throw new Error("Anthropic response missing text content");
  }
  return first.text;
}

export async function mutatePrompt(input: PromptMutationInput): Promise<string> {
  const request = buildMutationRequest(input);
  const useOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const useAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      if (useOpenAI) {
        const output = await mutateWithOpenAI(request);
        return sanitizePrompt(output);
      }
      if (useAnthropic) {
        const output = await mutateWithAnthropic(request);
        return sanitizePrompt(output);
      }
      throw new Error("No API key available");
    } catch (error) {
      lastError = error;
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Prompt mutation failed after retry: ${message}`);
}
