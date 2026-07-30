---
name: pr-dossier
description: Use when the user wants a combined PR review report, wants both a code review and an impact review together, or asks for a "dossier" on a PR. Runs a problem-fit check against the Linear ticket and PR description, a code review, a dedicated bug-hunting pass, an impact/aperture review, and a sibling-PR scan in parallel, records a headless-browser live run of the change (video embedded inline), and opens a single self-contained HTML report in the browser.
---

Assemble a **dossier** — a browser-ready HTML report combining a problem-fit check (does the PR actually solve its ticket, and is there a better way?), a code review pass, a dedicated bug-hunting pass, an impact review pass, and a recorded **live run** of the change driven through a headless browser, with the video embedded inline for playback.

## Ground rule: the diff is a pointer, not the evidence

A diff hunk only shows a few lines of context around each change. Code just outside that window — a property declared 10 lines above the hunk, a caller in another file, a pre-existing test — is invisible in `gh pr diff` output but is exactly what determines whether a "finding" is real. **Never assert a defect, a missing implementation, or a behavior change from a diff hunk alone.** Before reporting any finding, read the full current version of the file(s) involved and check the rest of the codebase for related usage.

Do this without disturbing the user's working tree or branch:
- `git fetch origin pull/<PR_NUMBER>/head` — fetches the PR's head commit as `FETCH_HEAD`, no checkout, no local branch created.
- `git show FETCH_HEAD:<path/to/file>` — read the **full post-change file**, not just the diff hunk. Do this for every file a finding depends on.
- `git grep -n '<pattern>' FETCH_HEAD -- '<pathspec>'` — search the **entire PR-branch tree** for callers, related definitions, or structurally similar code, without checking anything out.
- `git show origin/main:<path>` — read the pre-change version of a file directly, for a precise before/after comparison (don't infer "before" purely from the diff's `-` lines).
- If you need files on disk (to run a build, typecheck, or test suite), use `git worktree add <disposable-tmp-path> FETCH_HEAD`, run the command there, then `git worktree remove <path>`. **Never `git checkout` the PR branch in the current working directory or the user's primary checkout** — if a branch switch is unavoidable, confirm which directory you're actually in first (`pwd`, `git worktree list`) and restore the original branch afterward.

## Collect

Spawn six parallel agents. The first five (problem-fit, review, bug, impact, sibling) are the *report* — wait for all five to return non-empty markdown before continuing. The sixth (live-run) is **best-effort**: it boots the app and records a browser session, which is slow and can fail for reasons unrelated to the PR (auth wall, boot failure, missing browser deps). Kick it off *first* so its `yarn dev` boot overlaps the static passes, but **never let it block or fail the dossier** — if it doesn't finish or errors out, assemble the report without a video and say why in the live-run section.

**Problem-fit agent** — judge the PR against the problem it set out to solve, and whether it's the right solution. This agent answers two questions the code-focused passes never ask: *did it actually solve the stated problem*, and *is there a better way to solve it*. Steps:
- **Recover the intent.** Get the PR description with `gh pr view --json title,body,commits`. Find the Linear ticket ID — it's usually the `[NOVUS-xxx]` suffix on the PR title or a commit title, or embedded in the branch name (`gh pr view --json headRefName`); per this repo's convention the branch often matches but isn't guaranteed, so cross-check the title/commits too. Fetch the ticket with the Linear MCP tools (search/get issue by identifier) to read its title, description, and acceptance criteria. If no ticket ID can be found, or the Linear MCP isn't authenticated/available, say so explicitly and fall back to the PR description alone as the statement of intent — don't fabricate ticket contents.
- **Extract the stated problem.** From the ticket + PR description, distill: what problem is being solved, what the acceptance criteria / definition of done are (explicit or implied), and any constraints the author committed to. State this back in a few plain sentences so the reader can see what the PR is being held to.
- **Validate the PR against it.** Read the actual change (`gh pr diff`, then `git show FETCH_HEAD:<path>` for full post-change files — the diff is a pointer, not the evidence; see the ground rule above). Determine, criterion by criterion, whether the PR delivers what the ticket/description promised. Call out: requirements fully met, partially met, missed entirely, and anything the PR does that was **not** asked for (scope creep or undisclosed side changes). Also flag mismatches where the PR description claims something the code doesn't actually do.
- **Assess whether it solves the *real* problem.** Beyond literal criteria: does the change address the root cause, or only a symptom? Could the stated problem recur through a path this PR doesn't close? Say so plainly.
- **Propose a better approach if one exists.** If you see a materially different way to solve the same problem (different layer, different data model, reusing an existing mechanism, a simpler or more robust design), describe it concretely. Then give an honest **pros/cons comparison of the PR's approach vs. the alternative** — correctness, complexity, maintainability, blast radius, performance, effort to change now. Don't invent an alternative for its own sake: if the PR's approach is the right one, say that and briefly why the obvious alternatives are worse. Anchor any proposal in this repo's actual patterns (consult `CLAUDE.md`, `api/CLAUDE.md`, `frontend/CLAUDE.md`, `docs/*.md`) rather than generic advice.
- **Verdict.** Open the section with a one-line verdict: does this PR solve its stated problem? (Yes / Partially / No — with the single most important reason.)
- Return findings as markdown with a `## Problem Fit` heading, leading with the verdict line, then the stated problem, the criterion-by-criterion validation, the root-cause assessment, and the approach comparison (pros/cons) last.

**Review agent** — review the current PR for correctness. The agent should:
- Run `gh pr diff` to identify what changed, but treat it only as a map of *where* to look, not as the full evidence
- For each changed file, read the full current file (`git show FETCH_HEAD:<path>`) before drawing conclusions — a hunk showing only an added line can hide a pre-existing declaration a few lines outside the diff context
- Check for logic errors, edge cases, security issues, performance regressions, missing test coverage
- Cross-check any "missing implementation" or "this breaks X" claim against the actual repo: grep (`git grep ... FETCH_HEAD`) for the symbol in question across the whole tree before concluding it doesn't exist
- Where the language/project supports a quick compile or typecheck, verify non-obvious type-level or structural claims empirically (disposable `git worktree`) rather than by inspection alone — this is what catches false positives before they reach the dossier
- Flag anything that would block ship as a blocker; label the rest by severity (warning / note)
- Return findings as markdown with a `## Code Review` heading

**Bug agent** — hunt for bugs, adversarially. Where the review agent evaluates the change on its own terms, this agent's job is to *break* it: assume a bug exists and go find it, both inside the diff and — critically — anywhere in the wider codebase the change can reach. Two zones, both required:
- **Bugs in the change itself**: off-by-one and boundary errors, null/undefined and empty-collection handling, unhandled promise rejections and missing `await`, swallowed or misclassified errors, incorrect error propagation, race conditions and ordering assumptions, mutation of shared/aliased state, resource leaks (unclosed handles, unbounded growth), incorrect conditionals/inverted booleans, type coercion surprises, timezone/locale/encoding assumptions, and — for this repo specifically — multi-tenancy scoping gaps (missing `organizationId` filter, background work not wrapped in `OrganizationContext.run`), idempotency violations, and IDOR. Read the full post-change file (`git show FETCH_HEAD:<path>`), not just the hunk, before asserting any of these.
- **Side-effect bugs in the larger codebase**: this is the part the other agents don't do. For every function, method, export, constant, type, schema, DB column, or API/response shape the diff changes, find its callers and dependents across the **whole tree** (`git grep -n '<symbol>' FETCH_HEAD`) and ask, per call site, whether the change silently breaks it: a changed return shape a caller still destructures the old way, a narrowed/widened type that violates a downstream assumption, a renamed or reordered parameter, a default value change, a new thrown error a caller doesn't catch, a removed field a serializer still emits, a modified query a consumer paginates over, a shared enum/constant other modules switch on, a migration that invalidates cached or in-flight data. Enumerate call sites explicitly and state, for each, whether it is safe or at risk — do not stop at the first file.
- For each suspected bug, give: the concrete trigger (inputs/state that provoke it), the resulting incorrect behavior, the specific file:line, and a confidence level. **Verify before reporting** — read the surrounding code and, where a quick compile/typecheck/test would settle it, use a disposable `git worktree` rather than asserting from inspection. Drop anything you cannot substantiate; a false bug is worse than a missed one here.
- If you find no defensible bugs, say so explicitly rather than padding with speculation.
- Label each finding by severity (blocker / warning / note) and by zone (in-change / side-effect).
- Return findings as markdown with a `## Bug Hunt` heading

**Impact agent** — map the aperture of the current PR. Impact is inherently a before/after comparison: you cannot judge what a change opens or closes without first having a model of the subsystem it lands in. Orient before diffing, not after:
- Run `gh pr diff --name-only` to see which files changed, and use the paths to identify the subsystem/module the PR sits in (e.g. a shared directory, a module boundary, a named layer per the project's own docs)
- **Orient**: before reading the diff itself, build a working model of that subsystem as it exists today — read any project docs that describe it (root/module-level `CLAUDE.md`, `docs/*.md`, or equivalent architecture notes if this repo has them), and read sibling files in the same module *whether or not the diff touched them* (other implementations of the same pattern, the tests that currently pin its behavior, the callers that depend on it). The goal is to know the contracts and invariants this subsystem currently upholds before seeing what the diff does to them — not to reconstruct that understanding reactively from the diff's own vocabulary, which only surfaces things the diff happens to mention
- Only then read the diff in full context (`git show FETCH_HEAD:<path>` for the full post-change file, `git show origin/main:<path>` or the PR's base ref for the true pre-change version — never reconstruct "before" purely from the diff's `-` lines)
- For each meaningful change, map two dimensions against the model you built:
  - **Opened**: new capabilities, lifted constraints, new extension points
  - **Closed**: removed behaviors, broken APIs, silently changed semantics, invariants or contracts the subsystem no longer upholds — including ones no caller happens to exercise yet
- Look past the diff boundary across the **whole codebase**: `git grep` the PR-branch tree for every caller of changed functions/classes/exports, and every other instance of the pattern the diff modifies (e.g. if the diff reclassifies some instances of a pattern, find *all* instances repo-wide and confirm none were missed) — this catches syntactic overlap; the orientation step above is what catches semantic/invariant-level impact that no grep pattern would surface
- Note what observability needs updating
- Close with a plain-English paragraph: what the codebase can and cannot do after this lands
- Return findings as markdown with a `## Impact` heading

**Sibling agent** — find open PRs that will be affected by this PR merging. The agent should:
- Run `gh pr diff --name-only` to get the current PR's changed files
- Run `gh pr list --state open --json number,title,url,headRefName,author` to list all open PRs (excluding the current one)
- For each open PR, run `gh pr diff <number> --name-only` to get its changed files
- Flag any open PR that overlaps on at least one file — these are **direct conflicts**
- For open PRs with no file overlap, skim their diff (`gh pr diff <number>`) for semantic interference: shared interfaces, shared constants, migrations, config, or API contracts touched by both. If a sibling PR's diff references a symbol this PR also touches, read the full current definition of that symbol (`git show FETCH_HEAD:<path>` from this PR's fetch, or the sibling's own head) rather than assuming from the diff alone whether it's actually affected
- For each flagged PR, explain specifically what overlaps and what the merge risk is
- If no open PRs are impacted, say so explicitly
- Return findings as markdown with a `## Sibling PRs` heading; each entry should include the PR title, number as a markdown link to its URL, and the reason it's flagged

**Live-run agent** — boot the change and record a headless-browser session against it, then hand back a video the report can embed. This is the one agent that *runs* the code rather than reading it, so it operates entirely inside a disposable worktree and cleans up after itself. It is best-effort — every step below should be wrapped so a failure produces an explanatory note, not a crash. Steps:

- **Isolate on disk.** `git worktree add <disposable-tmp-path> FETCH_HEAD` (never check the PR out in the user's checkout). This repo has no `node_modules` or env files in a fresh worktree — per the root `CLAUDE.md` "Git Worktrees" section, symlink deps and copy env rather than reinstalling:
  ```bash
  ln -s <main>/node_modules node_modules
  ln -s <main>/api/node_modules api/node_modules
  ln -s <main>/frontend/node_modules frontend/node_modules
  cp <main>/api/.env api/.env
  cp <main>/frontend/.env.local frontend/.env.local
  ```
  `<main>` is the user's primary checkout (the directory the skill was invoked from — resolve it with `git rev-parse --show-toplevel` before adding the worktree). If either env file is missing in `<main>`, stop here and report "no local env — skipping live run" rather than booting a broken instance.
- **Boot.** Start `yarn dev` from the worktree root (root `package.json` `dev` script starts API on `:3001` and frontend on `:3000`) as a background process. Poll until **both** ports answer — the API via `GET http://localhost:3001/health` (a `@Public()` route) and the frontend root `GET http://localhost:3000` returning HTML — with a hard timeout (~180s). If either never comes up, capture the tail of the `yarn dev` output for the note and abort the run.
- **Record.** Drive the app with Playwright (already a dependency in both workspaces — `playwright@^1.58.2`; do **not** add Puppeteer). Follow the existing in-repo launch pattern in `api/src/session-replay/session-frame.service.ts`: deferred import (`const { chromium } = await import("playwright")`), `headless: true`, container-safe args `["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]`. Enable video via the context option:
  ```js
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  ```
  The output is a **WebM/VP8** file. The video only finalizes on context close, and `page.video().path()` is valid **only after** `await context.close()` — so structure it as: interact → `const videoHandle = page.video()` → `await context.close()` → `const videoPath = await videoHandle.path()`. Always close the context in a `finally`.
- **What to drive.** Use `gh pr diff --name-only` to decide what the session should exercise. If the PR touches `frontend/`, navigate to the affected route(s) and walk the changed UI. **Auth reality**: nearly everything sits behind `PendoAuthGuard` and there is no seed/mock-auth path for an unattended run, so a from-scratch headless session will usually only reach `@Public()` surface (the sign-in page, `/health`, `/auth/config`). Record whatever the session *can* legitimately reach, and state plainly in the note what was and wasn't reachable — a 20-second recording of the sign-in page plus an honest "authenticated routes need a real Pendo OAuth session, not available in a disposable worktree" is more useful than a fabricated walkthrough. Never invent interactions that didn't happen.
- **Hand back.** Base64-encode the WebM file and return it, plus a short markdown narration of what the session did and what it could/couldn't reach, under a `## Live Run` heading. If recording failed at any step, return the `## Live Run` heading with a note explaining what failed (and the captured boot/error output) and **no** video payload.
- **Clean up, always.** In a `finally`: kill the `yarn dev` process (and its children), then `git worktree remove <disposable-tmp-path> --force`. Leave no orphaned worktree or dev server behind.

Completion criterion: the five static agents (problem-fit, review, bug, impact, sibling) have returned non-empty markdown with their respective headings. The live-run agent has either returned a `## Live Run` note (with or without a video) or been abandoned on timeout — it does not gate completion.

## Assemble

Get PR context: run `gh pr view --json title,number,url,author,headRefName` and extract title, number, URL, author login, and branch. Fall back gracefully if unavailable.

Write the dossier to `/tmp/pr-dossier-$(date +%s).html`. See [HTML spec](#html-spec).

**Embed the live-run video.** If the live-run agent returned a video payload, inline it as a `data:` URI so the report stays a single self-contained file (no external `.webm` reference):

```html
<video controls muted playsinline width="100%">
  <source src="data:video/webm;base64,<BASE64>" type="video/webm">
</video>
```

`video/webm` is correct for Playwright's output. A `data:`-URI `<video>` plays fine from a `file://`-opened report — it's inline bytes, not a cross-origin fetch, so no CORS restriction applies; `muted` + `controls` guarantees playback regardless of autoplay policy. Put the video at the top of the `#live-run` section, followed by the agent's markdown narration. If the agent returned no video, render the narration/failure note alone under that heading. Be mindful of size: base64 adds ~33%, so keep the recording short — a bloated multi-hundred-MB single HTML file is the practical failure mode, not the browser's `data:`-URL ceiling.

Completion criterion: file exists; `id="problem-fit"`, `id="code-review"`, `id="bug-hunt"`, `id="impact"`, and `id="siblings"` sections all contain non-empty content; `id="live-run"` exists and contains either an embedded `<video>` or an explanatory note.

## Open

Run `open <path>`. Report the file path.

---

## HTML spec

One self-contained file, no external dependencies.

**Structure**

```
<html>
  <head> title, meta charset, <style> block </head>
  <body>
    <header>  PR title · #number · author · branch        </header>
    <nav>     sticky: "Live Run" | "Problem Fit" | "Code Review" | "Bug Hunt" | "Impact" | "Siblings"  </nav>
    <main>
      <section id="live-run">     <video> + live-run narration (or failure note)  </section>
      <section id="problem-fit">  problem-fit agent output (verdict first)  </section>
      <section id="code-review">  review agent output    </section>
      <section id="bug-hunt">     bug agent output       </section>
      <section id="impact">       impact agent output    </section>
      <section id="siblings">     sibling agent output   </section>
    </main>
  </body>
</html>
```

**Markdown → HTML**

Use `pandoc -f markdown -t html --no-highlight` if `which pandoc` succeeds. Otherwise convert inline: `## Heading` → `<h2>`, blank-separated paragraphs → `<p>`, fenced blocks → `<pre><code>`, `**b**` → `<strong>`, `- item` → `<ul><li>`.

**Style**

```css
body { font-family: -apple-system, sans-serif; max-width: 860px; margin: 0 auto; padding: 2rem; color: #1a1a1a; }
nav { position: sticky; top: 0; background: #fff; border-bottom: 1px solid #e0e0e0; padding: .75rem 0; display: flex; gap: 2rem; }
nav a { text-decoration: none; color: #0066cc; font-weight: 500; }
nav a:hover { text-decoration: underline; }
header { margin-bottom: 1.5rem; border-bottom: 2px solid #1a1a1a; padding-bottom: 1rem; }
header h1 { margin: 0 0 .25rem; font-size: 1.4rem; }
header .meta { color: #666; font-size: .85rem; }
section { margin-top: 3rem; padding-top: 1rem; }
section > h2 { font-size: 1.25rem; border-bottom: 1px solid #e0e0e0; padding-bottom: .5rem; }
pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: .85rem; }
code { font-family: 'SF Mono', Menlo, monospace; }
.blocker { color: #c0392b; font-weight: 600; }
.warning { color: #e67e22; }
#problem-fit > p:first-of-type { font-size: 1.05rem; font-weight: 600; background: #f5f7fa; border-left: 4px solid #0066cc; padding: .75rem 1rem; border-radius: 4px; }
#live-run video { display: block; max-width: 100%; border: 1px solid #e0e0e0; border-radius: 4px; margin: 1rem 0; background: #000; }
```
