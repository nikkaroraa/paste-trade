import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import {
  evaluatePrompt,
  loadPrompt,
  loadTestTrades,
  EvaluationSummary,
} from "./autoresearch";
import { mutatePrompt } from "./prompt-mutator";
import { EXTRACT_TRADE_PROMPT_PATH } from "../lib/ai/load-extract-trade-prompt";

const RESULTS_LOG_PATH = path.join(
  process.cwd(),
  "data/autoresearch-results.tsv"
);

function sanitizePrompt(text: string): string {
  return text.replace(/[\u2014\u2013]/g, "-").trim();
}

function parseIterationsArg(): number {
  const argIndex = process.argv.indexOf("--iterations");
  if (argIndex === -1) return 20;
  const value = Number(process.argv[argIndex + 1]);
  if (!Number.isFinite(value) || value <= 0) return 20;
  return Math.floor(value);
}

async function ensureResultsHeader() {
  try {
    await fs.access(RESULTS_LOG_PATH);
  } catch {
    const header = ["experiment", "timestamp", "accuracy", "status"].join("\t");
    await fs.writeFile(RESULTS_LOG_PATH, `${header}\n`, "utf8");
  }
}

async function appendResult(
  experiment: number,
  accuracy: number,
  status: "kept" | "reverted" | "skipped"
) {
  await ensureResultsHeader();
  const line = [
    experiment,
    new Date().toISOString(),
    accuracy.toFixed(2),
    status,
  ].join("\t");
  await fs.appendFile(RESULTS_LOG_PATH, `${line}\n`, "utf8");
}

async function writePromptFile(prompt: string) {
  const normalized = sanitizePrompt(prompt);
  await fs.writeFile(EXTRACT_TRADE_PROMPT_PATH, `${normalized}\n`, "utf8");
}

function formatAccuracy(accuracy: number): string {
  return `${accuracy.toFixed(2)}%`;
}

function gitAddAndCommit(oldAcc: number, newAcc: number) {
  const status = execSync(
    `git status --porcelain ${EXTRACT_TRADE_PROMPT_PATH}`
  )
    .toString()
    .trim();
  if (!status) return;
  execSync(`git add ${EXTRACT_TRADE_PROMPT_PATH}`);
  execSync(
    `git commit -m "autoresearch: improved accuracy ${formatAccuracy(
      oldAcc
    )} -> ${formatAccuracy(newAcc)}"`
  );
}

function summarizeSummary(summary: EvaluationSummary): string {
  return `${summary.totalScore}/${summary.totalPossible}`;
}

async function run() {
  const iterations = parseIterationsArg();
  const cases = await loadTestTrades();
  let prompt = await loadPrompt();
  let baseline = await evaluatePrompt(prompt, cases);
  let currentAccuracy = baseline.accuracy;
  let keptCount = 0;

  console.log(
    `Baseline accuracy: ${formatAccuracy(currentAccuracy)} (${summarizeSummary(
      baseline
    )})`
  );


  for (let i = 1; i <= iterations; i += 1) {
    let candidatePrompt = "";
    let candidateSummary: EvaluationSummary | null = null;

    try {
      candidatePrompt = await mutatePrompt({
        prompt,
        accuracy: currentAccuracy,
        failedCases: baseline.failed,
      });

      await writePromptFile(candidatePrompt);
      candidateSummary = await evaluatePrompt(candidatePrompt, cases);
    } catch (error) {
      await appendResult(i, currentAccuracy, "skipped");
      await writePromptFile(prompt);
      console.warn(
        `Iteration ${i} skipped due to error:`,
        error instanceof Error ? error.message : error
      );
      continue;
    }

    const candidateAccuracy = candidateSummary.accuracy;
    const improved = candidateAccuracy > currentAccuracy;
    if (improved) {
      const previousAccuracy = currentAccuracy;
      currentAccuracy = candidateAccuracy;
      prompt = candidatePrompt;
      baseline = candidateSummary;
      keptCount += 1;
      await appendResult(i, candidateAccuracy, "kept");

      try {
        gitAddAndCommit(previousAccuracy, candidateAccuracy);
      } catch (error) {
        console.warn(
          `Iteration ${i} improved but commit failed:`,
          error instanceof Error ? error.message : error
        );
      }
    } else {
      await appendResult(i, candidateAccuracy, "reverted");
      await writePromptFile(prompt);
    }

    console.log(
      `Iteration ${i}: ${formatAccuracy(candidateAccuracy)} (${summarizeSummary(
        candidateSummary
      )}) - ${improved ? "kept" : "reverted"}`
    );
  }

  console.log(
    `Final accuracy: ${formatAccuracy(currentAccuracy)} (${summarizeSummary(
      baseline
    )})`
  );
  console.log(`Experiments: ${iterations}`);
  console.log(`Kept: ${keptCount}`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  run().catch((error) => {
    console.error("Autoresearch failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
