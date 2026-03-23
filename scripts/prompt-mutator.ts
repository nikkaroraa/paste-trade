import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import { CaseResult } from "./autoresearch";

export interface PromptMutationInput {
  prompt: string;
  accuracy: number;
  failedCases: CaseResult[];
}

function sanitizePrompt(text: string): string {
  let cleaned = text.trim();

  const codeBlockMatch = cleaned.match(/```[\s\S]*?```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[0].replace(/^```\w*\n?/, "").replace(/```$/, "");
  }

  return cleaned.replace(/[\u2014\u2013]/g, "-").trim();
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

function mutatePromptWithClaude(
  currentPrompt: string,
  accuracy: number,
  failedCases: string
): string {
  const mutationPrompt = `You are optimizing an AI extraction prompt.
Current prompt achieves ${accuracy}% accuracy.
These test cases failed: ${failedCases}

Suggest a specific modification to improve accuracy. Return the FULL modified prompt (not just the diff).`;

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = execSync("claude -p --output-format text", {
        input: `${mutationPrompt}\n\nCurrent prompt:\n${currentPrompt}`,
        encoding: "utf-8",
        timeout: 60000,
      });
      const output = result.trim();
      if (!output) throw new Error("Claude CLI returned empty output");
      return output;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("claude -p mutation failed");
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
  const failedCases = JSON.stringify(
    input.failedCases.map((item) => ({
      id: item.id,
      expected: item.expected,
      predicted: item.predicted,
      text: item.text,
    })),
    null,
    2
  );

  try {
    return sanitizePrompt(mutatePromptWithClaude(input.prompt, input.accuracy, failedCases));
  } catch {
    // fallback to API providers
  }

  let lastError: unknown;
  const providers: Array<() => Promise<string>> = [];
  if (process.env.OPENAI_API_KEY) providers.push(() => mutateWithOpenAI(request));
  if (process.env.ANTHROPIC_API_KEY) providers.push(() => mutateWithAnthropic(request));

  for (const runProvider of providers) {
    try {
      const output = await runProvider();
      return sanitizePrompt(output);
    } catch (error) {
      lastError = error;
    }
  }

  const message = lastError instanceof Error ? lastError.message : "No fallback provider succeeded";
  throw new Error(`Prompt mutation failed: ${message}`);
}
