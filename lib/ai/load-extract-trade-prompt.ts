import { readFile } from "fs/promises";
import path from "path";

export const EXTRACT_TRADE_PROMPT_PATH = path.join(
  process.cwd(),
  "lib/ai/prompts/extract-trade-prompt.txt"
);

export async function loadExtractTradePrompt(): Promise<string> {
  const contents = await readFile(EXTRACT_TRADE_PROMPT_PATH, "utf8");
  return contents.trim();
}
