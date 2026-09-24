# Pacing and captions

Why the template's helpers are shaped the way they are, and the numbers that make a recording feel human.

## The caption helper

- **Top document, not the app's frame.** Apps hosted in iframes (an embed inside a portal) navigate internally without touching the outer page. Injecting the caption into `page` (the top document) means it survives every inner navigation and is never clipped by an iframe boundary. After a full `page.goto` the DOM is gone; the helper recreates the style and container on the next call.
- **Style once, content replaced per call.** The `<style>` and the container `<div>` are created on first use and found by id afterwards; only the inner text changes. One caption at a time, no flicker.
- **`position: fixed`, `z-index: 2147483647`, `pointer-events: none`.** Pinned to the viewport regardless of scroll, above the app's own overlays and drawers, and never able to swallow a click the script makes underneath it.
- **Three slots and a clock.** `<b>` title, `<span>` sentence, optional `<i>` note (use it for disclosures: "the one substitution in this recording"), `<em>` UTC time captured in Node when the caption is set. The clock is what lets a README table be reconciled to the video to the second.
- **`textContent`, never `innerHTML`, for values.** Captions carry live data (names, ids). Text content cannot be interpreted as markup.
- **Never breaks the take.** `.catch` logs and continues. A caption set mid-navigation loses one caption, not the recording.
- **Every caption is logged** with an ISO timestamp, so the README can be written from `live.log` without re-watching.

## Pacing numbers that read as human

| Moment | Pause |
| --- | --- |
| After a caption, before the next action | 3–4.5 s (`readPauseMs`) |
| After a click, before the next click | 300–500 ms |
| Typing | one keystroke per 70–90 ms (`pressSequentially`) |
| After a dropdown opens, before choosing | ~500 ms |
| After a screen transition completes | 1–1.5 s before captioning it |

Set values by acting, not by assignment: click the radio, open the select and click the option, type into the field. A value that appears without a gesture reads as a cut.

## Waiting on the app, not on timers

Every hop waits on something the next screen renders: a `data-testid` (`waitTestId`), a role/label, a row containing the new item's name. Timers are only for the viewer's reading time. When the product itself has to wait (a scheduler, a job, polling), keep the camera on the screen that will change, refresh a countdown caption every 5 s (`waitFor` with `title`), and watch the DOM. Never reload to "help" the UI: if the app is supposed to update live, the recording must prove it does.

## Finding selectors

Probe first with throwaway scripts that open a screen and screenshot it, then print candidates. Preference order: `data-testid` → `getByRole`/`getByLabel` → framework classes you have confirmed (`.ant-radio-wrapper` with `hasText`, `.ant-select-dropdown:visible .ant-select-item-option`, `.ant-tabs-tab`). Dismiss first-run overlays ("Dismiss", "Take a tour") before the story starts. For iframes, resolve the frame once (`page.frames().find(...)` by name or URL) and run every locator against it.

## Substitutions

Only for a dependency the target environment does not have yet (a service not yet deployed, an operation another team owns). Intercept exactly that URL pattern with `context.route`, fulfil it with the real shape the app expects, count the hits, and disclose it in a caption and the README. If more than one thing needs substituting, the environment is not ready for a live recording; use the app's offline/mock harness instead and label the recording as such.

## Cuts

Playwright's webm is the take. The only acceptable edit is speeding up one idle stretch (`cut-idle.sh`), because it removes waiting without changing order or content, and the README names the range. Keep the unedited full take next to the cut.
