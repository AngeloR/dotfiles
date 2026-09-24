#!/usr/bin/env bash
# Play ONE idle range of a take at 4x (or SPEED), leave everything else untouched.
# usage: cut-idle.sh <in.webm> <out.webm> <idle_start_s> <idle_end_s> [speed=4]
# Playwright webm has no audio, so only video timestamps are rescaled. Name the range in the README.
set -euo pipefail
IN="$1"; OUT="$2"; S="$3"; E="$4"; SPEED="${5:-4}"
FF="${FFMPEG:-$(command -v ffmpeg || ls "$HOME"/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux | head -1)}"
"$FF" -y -loglevel error -i "$IN" -filter_complex "\
[0:v]trim=0:${S},setpts=PTS-STARTPTS[a];\
[0:v]trim=${S}:${E},setpts=(PTS-STARTPTS)/${SPEED}[b];\
[0:v]trim=${E},setpts=PTS-STARTPTS[c];\
[a][b][c]concat=n=3:v=1:a=0[v]" -map "[v]" -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 "$OUT"
echo "wrote $OUT (range ${S}s–${E}s at ${SPEED}x)"
