#!/bin/bash
# Run scrape + price update
cd ~/projects/paste-trade

# Scrape new trades
curl -s "http://localhost:3100/api/scrape?secret=dev" > /dev/null 2>&1

# Update prices
curl -s "http://localhost:3100/api/prices" > /dev/null 2>&1

echo "$(date): scrape + price update complete"
