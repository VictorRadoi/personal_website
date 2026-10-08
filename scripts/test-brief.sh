#!/usr/bin/env bash
# Manual smoke tests for POST /api/brief against `wrangler dev` (default http://localhost:8787).
# Usage: scripts/test-brief.sh [base-url]
BASE="${1:-http://localhost:8787}"
ORIGIN="http://localhost-not-used"; GOOD="https://rvandrei.com"
T="$(mktemp -d)"
printf '\x89PNG\r\n\x1a\n0000000000' > "$T/s.png"
head -c 2200000 /dev/zero > "$T/big.png"; printf '\x89PNG\r\n\x1a\n' | dd of="$T/big.png" conv=notrunc 2>/dev/null
ANS='{"building":["Mobile app"],"stage":"Just an idea","features":["Sign-in"],"kind":["marketplace"],"timing":"ASAP","notes":"<b>hi</b>","link":""}'
post() { # label, origin, extra curl args...
  local label="$1" origin="$2"; shift 2
  printf '%-14s ' "$label"
  curl -s -o - -w ' [%{http_code}]\n' -X POST "$BASE/api/brief" ${origin:+-H "Origin: $origin"} \
    -F "answers=$ANS" -F "summary=I want a mobile app." -F "cf-turnstile-response=XXXX.DUMMY" "$@"
}
post success "$GOOD" -F name="Test User" -F email=test@example.com -F company=Acme -F sketch=@"$T/s.png;type=image/png"
post honeypot "$GOOD" -F name=Bot -F email=bot@example.com -F website=spam
post bad-email "$GOOD" -F name=X -F email=not-an-email
post big-file "$GOOD" -F name=X -F email=a@b.co -F photo=@"$T/big.png;type=image/png"
post wrong-file "$GOOD" -F name=X -F email=a@b.co -F photo=@"$T/s.png;type=image/gif" -F sketch=@/etc/hosts
post wrong-origin "https://evil.example" -F name=X -F email=a@b.co
post no-origin "" -F name=X -F email=a@b.co
printf '%-14s ' GET; curl -s -w ' [%{http_code}]\n' "$BASE/api/brief"
for i in 1 2 3 4 5 6 7; do post "rate-$i" "$GOOD" -F name=X -F email=a@b.co; done
