#!/usr/bin/env bash
#
# Azolute landing-2 before/after image generation (run on your own machine).
#
# Generates 5 "before" scenes, then creates each "after" by EDITING the
# before image (image + prompt), so the composition matches and the
# scroll wipe lines up. Finds GEMINI_API_KEY the same way as
# generate-landing-images.sh and never prints it.
#
# Usage, from the repository root:
#   bash scripts/generate-landing2-images.sh
# Then:
#   git add img/landing2/raw && git commit -m "Add landing-2 scene pairs" && git push
#
set -u +x

KEY="${GEMINI_API_KEY:-}"
SOURCE="environment variable"
if [ -z "$KEY" ] && command -v security >/dev/null 2>&1; then
    KEY="$(security find-generic-password -a "$USER" -s GEMINI_API_KEY -w 2>/dev/null || true)"
    SOURCE="macOS Keychain"
fi
if [ -z "$KEY" ] && [ -f "$HOME/Desktop/shorts-lab/.env" ]; then
    KEY="$(sed -n 's/^GEMINI_API_KEY=//p' "$HOME/Desktop/shorts-lab/.env" | head -1 | tr -d '"')"
    SOURCE="shorts-lab/.env"
fi
[ -z "$KEY" ] && { echo "GEMINI_API_KEY not found" >&2; exit 1; }
KEY="$(printf '%s' "$KEY" | tr -d '[:space:]')"
echo "Key found in $SOURCE, ${#KEY} characters."

OUT="img/landing2/raw"
mkdir -p "$OUT"
URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent"

STYLE="Modern flat vector illustration with soft gradients and subtle grain texture, clean geometric shapes, simple stylized faceless characters, cohesive editorial tech-illustration style. Wide cinematic 16:9 composition. Strictly no readable text, no words, no letters, no numbers, no logos."
BEFORE_MOOD="Cold, drained color palette: grey-blue tones, dim lighting, tired and heavy mood, near-black background."
AFTER_MOOD="Keep the exact same composition, characters, camera angle and scene, but transform the mood: warm violet (#8050f0) and soft amber glow, alive and relaxed, screens glowing gently, near-black background."

extract() {
    python3 - "$1" "$2" <<'PY'
import base64, json, sys
resp = json.load(open(sys.argv[1]))
for cand in resp.get("candidates", []):
    for part in cand.get("content", {}).get("parts", []):
        data = part.get("inlineData", {}).get("data")
        if data:
            open(sys.argv[2], "wb").write(base64.b64decode(data))
            sys.exit(0)
sys.exit(1)
PY
}

gen_before() {
    name="$1"; prompt="$2"
    [ -s "$OUT/$name-before.png" ] && { echo "skip $name-before"; return 0; }
    body="$(python3 - "$prompt $BEFORE_MOOD $STYLE" <<'PY'
import json, sys
print(json.dumps({"contents":[{"parts":[{"text":sys.argv[1]}]}],
 "generationConfig":{"responseModalities":["TEXT","IMAGE"],"imageConfig":{"aspectRatio":"16:9"}}}))
PY
)"
    status="$(curl -sS -o "$OUT/.resp.json" -w "%{http_code}" -H "x-goog-api-key: $KEY" \
        -H "Content-Type: application/json" -X POST "$URL" -d "$body")"
    [ "$status" = "200" ] && extract "$OUT/.resp.json" "$OUT/$name-before.png" \
        && echo "ok   $name-before" || echo "FAIL $name-before: HTTP $status"
}

gen_after() {
    name="$1"; prompt="$2"
    [ -s "$OUT/$name-after.png" ] && { echo "skip $name-after"; return 0; }
    [ -s "$OUT/$name-before.png" ] || { echo "FAIL $name-after: no before image"; return 1; }
    # The request body embeds the before image (megabytes of base64), far
    # beyond the OS argument-size limit, so it must go through a file,
    # never through curl's argv.
    python3 - "$OUT/$name-before.png" "$prompt $AFTER_MOOD $STYLE" "$OUT/.req.json" <<'PY'
import base64, json, sys
img = base64.b64encode(open(sys.argv[1], "rb").read()).decode()
json.dump({"contents":[{"parts":[
  {"inlineData":{"mimeType":"image/png","data":img}},
  {"text":sys.argv[2]}]}],
 "generationConfig":{"responseModalities":["TEXT","IMAGE"]}}, open(sys.argv[3], "w"))
PY
    status="$(curl -sS -o "$OUT/.resp.json" -w "%{http_code}" -H "x-goog-api-key: $KEY" \
        -H "Content-Type: application/json" -X POST "$URL" --data-binary @"$OUT/.req.json")"
    rm -f "$OUT/.req.json"
    [ "$status" = "200" ] && extract "$OUT/.resp.json" "$OUT/$name-after.png" \
        && echo "ok   $name-after" || echo "FAIL $name-after: HTTP $status"
}

# scene-0: the cafe, wide (used for the turn)
gen_before scene-0 "Wide view of a small cozy cafe interior in the evening, an owner figure behind the counter, a few empty tables, a phone on the counter."
gen_after  scene-0 "Edit this image: the same cafe now alive, several tables with guests, the owner relaxed, the phone screen and a tablet glowing softly."

# scene-1: bookings
gen_before scene-1 "A cafe counter with an old paper reservation book lying empty, a landline phone with a missed-call feel, the owner figure looking stretched."
gen_after  scene-1 "Edit this image: the paper book is replaced by a glowing tablet calendar filling with abstract booking blocks, the phone calm, the owner at ease."

# scene-2: messages
gen_before scene-2 "A dark closed shop at night, a phone on the counter with a tall stack of abstract unread message bubbles piling above it."
gen_after  scene-2 "Edit this image: the message bubbles now flow neatly into a glowing chat panel that answers them, one bubble handed to the owner's phone."

# scene-3: busywork
gen_before scene-3 "A desk buried in sticky notes and paper stacks, a tired owner figure hunched over a dim laptop late at night."
gen_after  scene-3 "Edit this image: the desk is clean, morning light, the owner relaxed holding a coffee, the laptop showing one calm glowing summary panel."

# scene-4: regulars
gen_before scene-4 "A cafe doorway with a single customer figure walking away into the night, empty chairs inside."
gen_after  scene-4 "Edit this image: several customer figures returning through the doorway, one scanning a small table card with a phone, warm and busy inside."

rm -f "$OUT/.resp.json"
echo
echo "Done. Review $OUT, then:"
echo "  git add img/landing2/raw && git commit -m 'Add landing-2 scene pairs' && git push"
