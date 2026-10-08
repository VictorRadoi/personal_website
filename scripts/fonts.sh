#!/usr/bin/env bash
# Rebuilds the self-hosted font subsets in public/fonts/ (design-system §3.1).
# Inputs (from github.com/google/fonts, SIL OFL 1.1), placed next to this script's working dir:
#   ofl/youngserif/YoungSerif-Regular.ttf
#   ofl/schibstedgrotesk/SchibstedGrotesk[wght].ttf
#   ofl/kalam/Kalam-Regular.ttf
# Output file names never change in place: public/fonts/* is cached "immutable" (public/_headers).
# If a font ever changes, write it under a new name and update src/styles/fonts.css + Base.astro preloads.
set -euo pipefail

OUT="${OUT:-public/fonts}"
pip install fonttools brotli >/dev/null

fonttools varLib.instancer "SchibstedGrotesk[wght].ttf" wght=400:700 -o schibsted-400-700.ttf

# Latin + Latin Extended-A + Romanian comma-below ș ț + punctuation, arrows, euro, trademark, minus.
U="U+0000-00FF,U+0100-017F,U+0218-021B,U+02C6,U+02DA,U+02DC,U+2010-2027,U+2030-203A,U+2044,U+20AC,U+2122,U+2190-2199,U+2212"

for p in "YoungSerif-Regular.ttf:young-serif-400" "schibsted-400-700.ttf:schibsted-grotesk-var" "Kalam-Regular.ttf:kalam-400"; do
  pyftsubset "${p%%:*}" --unicodes="$U" \
    --layout-features='kern,liga,calt,tnum,lnum,case,frac' \
    --flavor=woff2 --output-file="$OUT/${p##*:}.woff2"
done

ls -l "$OUT"/*.woff2
