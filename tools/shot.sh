#!/bin/bash
# Screenshot one lesson step with motion disabled, for checking diagram alignment.
# usage: tools/shot.sh "http://127.0.0.1:8000/learn/ckks.html#step-3" out.png [width] [height]
# Serve docs/ first:  cd docs && python3 -m http.server 8000
SH=${CHROME:-$(find ~/.cache/ms-playwright -name chrome-headless-shell -type f 2>/dev/null | head -1)}
timeout 60 "$SH" --no-sandbox --disable-gpu --hide-scrollbars --force-prefers-reduced-motion \
  --window-size=${3:-1000},${4:-760} --virtual-time-budget=3000 --screenshot="$2" "$1" >/dev/null 2>&1
