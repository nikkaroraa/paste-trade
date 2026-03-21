import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { ExtractedTrade } from "../lib/types";
import {
  EXTRACT_TRADE_PROMPT_PATH,
  loadExtractTradePrompt,
} from "../lib/ai/load-extract-trade-prompt";

export interface TestTradeCase {
  id: string;
  text: string;
  expected: ExtractedTrade;
}

export interface CaseResult {
  id: string;
  text: string;
  expected: ExtractedTrade;
  predicted: ExtractedTrade;
  score: number;
  total: number;
}

export interface EvaluationSummary {
  runId: string;
  accuracy: number;
  totalScore: number;
  totalPossible: number;
  cases: CaseResult[];
  failed: CaseResult[];
}

const LOG_PATH = path.join(process.cwd(), "data/autoresearch-log.tsv");
const TEST_CASES_PATH = path.join(process.cwd(), "data/test-trades.json");

const emptyTrade: ExtractedTrade = {
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

function normalizeTicker(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeEnum(value: string): string {
  return value.trim().toLowerCase();
}

function safeParseTrade(text: string): ExtractedTrade | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(slice) as ExtractedTrade;
    return parsed;
  } catch {
    return null;
  }
}

function coerceTrade(value: ExtractedTrade | null): ExtractedTrade {
  if (!value) return { ...emptyTrade };
  return {
    has_trade: Boolean(value.has_trade),
    ticker: value.ticker ?? "",
    asset_type: (value.asset_type ?? "crypto") as ExtractedTrade["asset_type"],
    direction: (value.direction ?? "long") as ExtractedTrade["direction"],
    thesis: value.thesis ?? "",
    confidence: (value.confidence ?? "low") as ExtractedTrade["confidence"],
    timeframe: value.timeframe ?? "unknown",
    key_catalysts: Array.isArray(value.key_catalysts) ? value.key_catalysts : [],
    risks: Array.isArray(value.risks) ? value.risks : [],
  };
}

export async function loadTestTrades(): Promise<TestTradeCase[]> {
  const raw = await fs.readFile(TEST_CASES_PATH, "utf8");
  return JSON.parse(raw) as TestTradeCase[];
}

export async function loadPrompt(): Promise<string> {
  return loadExtractTradePrompt();
}

async function extractWithOpenAI(prompt: string, text: string): Promise<ExtractedTrade | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const openai = new OpenAI({ apiKey });
  const res = await openai.responses.create({
    model: "gpt-4o-mini",
    input: `${prompt}\n\nText:\n${text}`,
  });
  return safeParseTrade(res.output_text.trim());
}

async function extractWithAnthropic(prompt: string, text: string): Promise<ExtractedTrade | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const anthropic = new Anthropic({ apiKey });
  const msg = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 600,
    messages: [{ role: "user", content: `${prompt}\n\nText:\n${text}` }],
  });
  const first = msg.content[0];
  if (first?.type !== "text") return null;
  return safeParseTrade(first.text.trim());
}

export async function extractTradeForEval(
  prompt: string,
  text: string
): Promise<ExtractedTrade> {
  try {
    const openaiResult = await extractWithOpenAI(prompt, text);
    if (openaiResult) return coerceTrade(openaiResult);

    const anthropicResult = await extractWithAnthropic(prompt, text);
    if (anthropicResult) return coerceTrade(anthropicResult);
  } catch {
    return { ...emptyTrade };
  }

  return { ...emptyTrade };
}

export function scoreCase(expected: ExtractedTrade, predicted: ExtractedTrade): {
  score: number;
  total: number;
} {
  const expectedHasTrade = expected.has_trade;
  const total = expectedHasTrade ? 8 : 2;
  let score = 0;

  if (predicted.has_trade === expectedHasTrade) {
    score += 2;
  }

  if (!expectedHasTrade) {
    return { score, total };
  }

  if (normalizeTicker(predicted.ticker) === normalizeTicker(expected.ticker)) {
    score += 2;
  }

  if (normalizeEnum(predicted.direction) === normalizeEnum(expected.direction)) {
    score += 2;
  }

  if (normalizeEnum(predicted.asset_type) === normalizeEnum(expected.asset_type)) {
    score += 1;
  }

  if (normalizeEnum(predicted.confidence) === normalizeEnum(expected.confidence)) {
    score += 1;
  }

  return { score, total };
}

async function ensureLogHeader() {
  try {
    await fs.access(LOG_PATH);
  } catch {
    const header = [
      "run_id",
      "timestamp",
      "case_id",
      "score",
      "total",
      "expected_has_trade",
      "pred_has_trade",
      "expected_ticker",
      "pred_ticker",
      "expected_direction",
      "pred_direction",
      "expected_asset_type",
      "pred_asset_type",
      "expected_confidence",
      "pred_confidence",
    ].join("\t");
    await fs.writeFile(LOG_PATH, `${header}\n`, "utf8");
  }
}

async function appendLog(summary: EvaluationSummary) {
  await ensureLogHeader();
  const timestamp = new Date().toISOString();
  const lines = summary.cases.map((result) =>
    [
      summary.runId,
      timestamp,
      result.id,
      result.score,
      result.total,
      result.expected.has_trade,
      result.predicted.has_trade,
      normalizeTicker(result.expected.ticker),
      normalizeTicker(result.predicted.ticker),
      normalizeEnum(result.expected.direction),
      normalizeEnum(result.predicted.direction),
      normalizeEnum(result.expected.asset_type),
      normalizeEnum(result.predicted.asset_type),
      normalizeEnum(result.expected.confidence),
      normalizeEnum(result.predicted.confidence),
    ].join("\t")
  );
  await fs.appendFile(LOG_PATH, `${lines.join("\n")}\n`, "utf8");
}

export async function evaluatePrompt(
  prompt: string,
  cases: TestTradeCase[]
): Promise<EvaluationSummary> {
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const results: CaseResult[] = [];

  for (const testCase of cases) {
    const predicted = await extractTradeForEval(prompt, testCase.text);
    const { score, total } = scoreCase(testCase.expected, predicted);
    results.push({
      id: testCase.id,
      text: testCase.text,
      expected: testCase.expected,
      predicted,
      score,
      total,
    });
  }

  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const totalPossible = results.reduce((sum, result) => sum + result.total, 0);
  const accuracy = totalPossible === 0 ? 0 : (totalScore / totalPossible) * 100;
  const failed = results.filter((result) => result.score < result.total);

  const summary: EvaluationSummary = {
    runId,
    accuracy,
    totalScore,
    totalPossible,
    cases: results,
    failed,
  };

  await appendLog(summary);
  return summary;
}

export async function evaluateCurrentPrompt(): Promise<EvaluationSummary> {
  const prompt = await loadPrompt();
  const cases = await loadTestTrades();
  return evaluatePrompt(prompt, cases);
}

function formatCaseFailure(result: CaseResult): string {
  const expected = result.expected;
  const predicted = result.predicted;
  return [
    `- ${result.id}`,
    `  expected has_trade=${expected.has_trade} ticker=${expected.ticker} direction=${expected.direction} asset_type=${expected.asset_type} confidence=${expected.confidence}`,
    `  predicted has_trade=${predicted.has_trade} ticker=${predicted.ticker} direction=${predicted.direction} asset_type=${predicted.asset_type} confidence=${predicted.confidence}`,
  ].join("\n");
}

async function runCli() {
  const promptPath = EXTRACT_TRADE_PROMPT_PATH;
  const summary = await evaluateCurrentPrompt();

  console.log(`Prompt: ${promptPath}`);
  console.log(
    `Accuracy: ${summary.accuracy.toFixed(2)}% (${summary.totalScore}/${summary.totalPossible})`
  );
  console.log(`Cases: ${summary.cases.length}`);
  console.log(`Failed: ${summary.failed.length}`);

  if (summary.failed.length > 0) {
    console.log("Failed cases:");
    console.log(summary.failed.map(formatCaseFailure).join("\n"));
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  runCli().catch((error) => {
    console.error("Evaluation failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
