---
name: live-demo-recording
description: Record a smooth, self-narrating webm walkthrough of a real web app by driving it with Playwright — captions injected into the page, human pacing, testid waits, one real take. Use when asked to record a demo, capture a screen recording of a feature, produce a narrated walkthrough video, or show a live run on camera (local harness or a real environment). Produces webm + stills + a README timeline stating what was real and what was substituted.
argument-hint: [what to demo, target URL or environment, output folder]
---

# Live demo recording

A demo is a scripted browser session that behaves like a careful human. Playwright records the viewport; captions are DOM the page renders; pacing is written into the script; every state change is awaited on the app's own DOM. No screen recorder, no post-production beyond speeding up idle waits.

Start from [`templates/record-demo.cjs`](templates/record-demo.cjs). Its helpers (`caption`, `shot`, `mark`, `typeSlow`, `waitTestId`, `substitute`) are explained in [`references/pacing-and-captions.md`](references/pacing-and-captions.md). A worked real-environment profile (authenticated ERP session, iframe-hosted embed, one disclosed network substitution) is [`references/example-hosted-enterprise-app.md`](references/example-hosted-enterprise-app.md).

## Steps

1. **Fix the conditions.** Decide viewport (1440×900), `timezoneId`, `locale`, output folder, and how the browser is authenticated (saved `storageState`, or a login the script performs off-camera before the context that records starts). Compute any clock-dependent values (a schedule time, a date) in the script from the pinned zone. *Done when the script can open the first page without a login prompt and the recorded context has `recordVideo` set.*

2. **Probe before you record.** Write short throwaway scripts under `probes/` that open each screen, screenshot it, and print the selectors you will click: prefer `data-testid`, then role/label, then framework classes (`.ant-radio-wrapper`, `.ant-select-dropdown:visible`). Find frames (`page.frames()`), overlays that must be dismissed, and the exact button text of the final action. *Done when every click in the planned story has a selector you have seen work once and a `waitFor` target that proves the next screen is ready.*

3. **Write the beats.** One `async` function per beat in the `BEATS` array: `caption(...)` → wait for the viewer (3–4.5 s) → `shot(label)` → the action(s) with 300–500 ms settles, typed input via `typeSlow` → `waitTestId` for the next screen → `mark(step, detail)`. Where the product itself has to wait (a job, a timer, a poll), keep the camera on the screen that will change, refresh a countdown caption every few seconds, and watch the DOM for the change. Reload nothing; drive nothing through an API. *Done when the story plays end to end in a dry run with `RECORD=0` and every `mark` appears in `live.log`.*

4. **Substitute only what is not there yet, and say so.** If one dependency is missing in the target environment, intercept exactly that request with `substitute(pattern, responder)` (a `context.route` that counts hits) and write the fact into a caption and the README. Everything else stays real. *Done when the substitution counter in `result.json` matches the number of times you expected it to fire.*

5. **Record one take.** Run with `RECORD=1`. On failure the script still saves the partial video as `*.FAILED.webm`; fix the beat and rerun rather than splicing takes. *Done when `<name>.webm`, numbered stills, `live.log`, `timeline.json` and `result.json` sit in the output folder and the log shows every planned `mark`.*

6. **Cut idle time, nothing else.** If the take has a long wait (over ~60 s), run [`templates/cut-idle.sh`](templates/cut-idle.sh) to play that one range at 4×, keeping the full take beside it. Any other edit changes the story, so it is not an edit you make. *Done when the README names the exact range that was accelerated.*

7. **Write the README from the log.** Table of beats with UTC timestamps from `timeline.json`, ids created (schedule, run, batch), and a per-beat "real vs substituted" column. State known limitations and anything you could not show and why. Publish the folder if the environment has a review site. *Done when a reader who did not watch the video can tell from the README what happened and what was staged.*

## Rules that hold every run

- Captions live in the **top document**, are set with `textContent`, and never break the take (`.catch` → log).
- Secrets in logs are **fingerprints only** (sha256 prefix); tokens never appear in captions, stills, README or `result.json`.
- Sandbox or test environments only for anything that writes. Never mutate records beyond the one the story needs.
- Kill every browser and dev server you started; do not commit probe scripts or videos into the product repo.
