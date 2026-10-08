#!/usr/bin/env bash
# Build the Astro site and deploy it to Cloudflare.
# Usage: scripts/deploy.sh [--dry-run]
set -euo pipefail
cd "$(dirname "$0")/.."

DRY=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY="--dry-run" ;;
    *) echo "Unknown option: $arg (use --dry-run)" >&2; exit 1 ;;
  esac
done

npm ci
npm run build

# Needs `npx wrangler login` once, or CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in the environment.
npx wrangler deploy $DRY
