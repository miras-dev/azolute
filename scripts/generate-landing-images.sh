#!/usr/bin/env bash
#
# Azolute landing page image generation (run on your own machine).
#
# Finds GEMINI_API_KEY (env var, then macOS Keychain, then
# ~/Desktop/shorts-lab/.env), generates the 12 landing images with
# gemini-2.5-flash-image and saves them to img/landing/raw/.
# The key is never printed, logged or written to disk by this script.
#
# Usage, from the repository root:
#   bash scripts/generate-landing-images.sh
# Then review the images and:
#   git add img/landing/raw && git commit -m "Add generated landing images" && git push
#
set -u +x

# ---------- locate the key (never echoed) ----------
KEY="${GEMINI_API_KEY:-}"
SOURCE="environment variable"

if [ -z "$KEY" ] && command -v security >/dev/null 2>&1; then
    KEY="$(security find-generic-password -a "$USER" -s GEMINI_API_KEY -w 2>/dev/null || true)"
    SOURCE="macOS Keychain"
fi

if [ -z "$KEY" ] && [ -f "$HOME/Desktop/shorts-lab/.env" ]; then
    KEY="$(sed -n 's/^GEMINI_API_KEY=//p' "$HOME/Desktop/shorts-lab/.env" | head -1 | tr -d '"' )"
    SOURCE="shorts-lab/.env"
fi

if [ -z "$KEY" ]; then
    echo "GEMINI_API_KEY not found in env, Keychain or ~/Desktop/shorts-lab/.env" >&2
    exit 1
fi

KEY="$(printf '%s' "$KEY" | tr -d '[:space:]')"
echo "Key found in $SOURCE, ${#KEY} characters after trimming whitespace."

OUT="img/landing/raw"
mkdir -p "$OUT"

MODEL="gemini-2.5-flash-image"
URL="https://generativelanguage.googleapis.com/v1beta/models/$MODEL:generateContent"

STYLE="Premium dark 3D render on a near-black deep charcoal background, glowing violet (#8050f0) and soft lavender accent lighting, glassy translucent surfaces, faint blueprint grid, cinematic rim light, volumetric glow, high detail, octane render style. Strictly no text, no words, no letters, no numbers, no logos, no watermarks."

generate() {
    name="$1"; ratio="$2"; prompt="$3"
    [ -s "$OUT/$name.png" ] && { echo "skip $name (exists)"; return 0; }

    body="$(python3 - "$prompt. $STYLE" "$ratio" <<'PY'
import json, sys
print(json.dumps({
  "contents": [{"parts": [{"text": sys.argv[1]}]}],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"],
    "imageConfig": {"aspectRatio": sys.argv[2]}
  }
}))
PY
)"

    status="$(curl -sS -o "$OUT/.resp.json" -w "%{http_code}" \
        -H "x-goog-api-key: $KEY" -H "Content-Type: application/json" \
        -X POST "$URL" -d "$body")"

    if [ "$status" != "200" ]; then
        # retry once without imageConfig in case the API rejects it
        body="$(python3 - "$prompt. $STYLE" <<'PY'
import json, sys
print(json.dumps({
  "contents": [{"parts": [{"text": sys.argv[1]}]}],
  "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
}))
PY
)"
        status="$(curl -sS -o "$OUT/.resp.json" -w "%{http_code}" \
            -H "x-goog-api-key: $KEY" -H "Content-Type: application/json" \
            -X POST "$URL" -d "$body")"
    fi

    if [ "$status" != "200" ]; then
        echo "FAIL $name: HTTP $status (see $OUT/.resp.json, it contains no secrets)"
        return 1
    fi

    python3 - "$OUT/.resp.json" "$OUT/$name.png" <<'PY'
import base64, json, sys
resp = json.load(open(sys.argv[1]))
for cand in resp.get("candidates", []):
    for part in cand.get("content", {}).get("parts", []):
        data = part.get("inlineData", {}).get("data")
        if data:
            open(sys.argv[2], "wb").write(base64.b64decode(data))
            sys.exit(0)
print("no image in response", file=sys.stderr)
sys.exit(1)
PY
    if [ $? -eq 0 ]; then
        echo "ok   $name ($(wc -c < "$OUT/$name.png" | tr -d ' ') bytes)"
    else
        echo "FAIL $name: response had no image"
        return 1
    fi
}

# ---------- the 12 images ----------
generate card-01 "4:5" "A sleek floating glassy website browser window, abstract modern landing page layout with hero block, rounded content cards and a glowing violet call-to-action button, slight 3D perspective tilt"
generate card-02 "4:5" "A floating glass chat interface panel with glowing rounded message bubbles and a small luminous AI orb assistant hovering beside it, slight 3D perspective tilt"
generate card-03 "4:5" "An abstract automation workflow: glowing connected nodes joined by flowing light lines forming a clean pipeline, small gears and arrows made of light, slight 3D perspective tilt"
generate card-04 "4:5" "A sleek floating calendar booking interface, one date slot glowing violet with a checkmark orb, subtle clock element, glassy 3D panel with perspective tilt"
generate card-05 "4:5" "A floating analytics dashboard panel with glowing bar charts, a rising line graph and small stat tiles, glassy dark UI, slight 3D perspective tilt"
generate card-06 "4:5" "A luminous core sphere orbited by three small glowing satellites on tilted rings, representing always-on support, glassy materials"
generate abstract-01 "1:1" "Abstract composition of floating translucent glass shards catching violet rim light, deep dark background"
generate abstract-02 "1:1" "A flowing ribbon of violet and blue light forming a smooth wave through darkness, long exposure feel"
generate abstract-03 "1:1" "A glassy wireframe dodecahedron glowing from within, violet edge light, floating in darkness"
generate abstract-04 "1:1" "A field of small luminous particles swirling into a gentle vortex, violet and lavender tones"
generate backdrop-01 "16:9" "A vast dark nebula of violet and deep blue gradients with faint particles, cinematic wide atmospheric backdrop, very subtle"
generate backdrop-02 "16:9" "A wide dark horizon of faint glowing circuit-like lines fading into atmospheric violet haze, cinematic, very subtle"

rm -f "$OUT/.resp.json"
echo
echo "Done. Review the images in $OUT, then:"
echo "  git add img/landing/raw && git commit -m 'Add generated landing images' && git push"
