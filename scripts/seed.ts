import { runFullScrape, refreshPrices } from "../lib/ingest";

async function main() {
  const scrape = await runFullScrape();
  const prices = await refreshPrices();
  console.log({ scrape, prices });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
