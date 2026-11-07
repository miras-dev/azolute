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

STYLE="Modern flat vector illustration with soft gradients and subtle grain texture, dark near-black background (#0b0b13) so the image blends into a dark page, violet (#8050f0) and lavender as the dominant palette with small warm amber light accents, clean geometric shapes, simple stylized faceless characters, gentle glow effects, cohesive editorial tech-illustration style like a premium SaaS brand. Any screens or interfaces are abstract shapes and bars only. Strictly no readable text, no words, no letters, no numbers, no logos, no watermarks."

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

# ---------- the 12 images: the client journey ----------
generate card-01 "4:5" "Over-the-shoulder view of a cafe owner behind the counter of a cozy cafe at dusk, holding a tablet that glows softly with a blurred reservation interface, espresso machine and warm cafe lights blurred in the dark background, a new booking arriving"
generate card-02 "4:5" "A customer's hands holding a phone in a dark room at night, the screen glowing with soft blurred chat bubbles of a website support conversation, one bubble pulsing violet as an AI assistant replies instantly"
generate card-03 "4:5" "A small dark office desk seen from above at an angle: on one side a messy pile of paper notes and sticky notes fading into shadow, on the other a laptop whose screen casts a calm violet glow of an orderly flowing diagram, the chaos literally dissolving into light streaming toward the laptop"
generate card-04 "4:5" "Over-the-shoulder view at a salon reception desk in the evening, a screen glowing with a soft blurred calendar filling up with appointment blocks, hair styling tools and warm mirror lights blurred in the dark background"
generate card-05 "4:5" "Morning scene in near darkness: hands holding a warm cup of coffee next to a phone propped on a wooden table, the phone screen glowing softly with a blurred daily report of rising charts, first daylight barely breaking in the dark background"
generate card-06 "4:5" "A restaurant table at night with a small table-tent card, a guest's hand holding a phone scanning it, the phone glowing with a soft violet offer notification, candlelight and dark restaurant ambience around, a returning regular customer"
generate abstract-01 "1:1" "Close-up of two hands in a handshake across a desk in a dark room, lit by a single warm desk lamp and the violet glow of a laptop screen beside them, a deal agreed"
generate abstract-02 "1:1" "Extreme close-up of a phone lying on a dark wooden table lighting up with one soft glowing notification orb, violet glow spilling onto the wood, everything else in darkness"
generate abstract-03 "1:1" "A keychain-sized glowing violet orb levitating above an open palm in darkness, tiny points of light orbiting it, representing a system that runs itself"
generate abstract-04 "1:1" "A small shop storefront at night seen from the dark street, windows glowing warm, one soft violet neon accent, silhouette of the owner inside turning the closed sign, inviting and alive"
generate backdrop-01 "16:9" "Very dark wide interior of a cozy cafe at night, out of focus, only faint warm bokeh lights and a subtle violet glow from a laptop somewhere, almost black, atmospheric backdrop"
generate backdrop-02 "16:9" "Very dark wide view of a small business street at night, out of focus warm shop windows and one violet neon reflection on wet pavement, almost black, atmospheric backdrop"

rm -f "$OUT/.resp.json"
echo
echo "Done. Review the images in $OUT, then:"
echo "  git add img/landing/raw && git commit -m 'Add generated landing images' && git push"
