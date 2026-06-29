---
name: pr-dossier
description: Use when the user wants a combined PR review report, wants both a code review and an impact review together, or asks for a "dossier" on a PR. Runs a standard PR review and an impact/aperture review in parallel and opens a single HTML report in the browser.
---

Assemble a **dossier** — a browser-ready HTML report combining a code review pass and an impact review pass.

## Collect

Spawn three parallel agents and wait for all three to return non-empty markdown before continuing.

**Review agent** — review the current PR for correctness. The agent should:
- Run `gh pr diff` to get the diff
- Check for logic errors, edge cases, security issues, performance regressions, missing test coverage
- Flag anything that would block ship as a blocker; label the rest by severity (warning / note)
- Return findings as markdown with a `## Code Review` heading

**Impact agent** — map the aperture of the current PR. The agent should:
- Run `gh pr diff` to get the diff
- For each meaningful change, map two dimensions:
  - **Opened**: new capabilities, lifted constraints, new extension points
  - **Closed**: removed behaviors, broken APIs, silently changed semantics, patterns that depended on prior behavior
- Look past the diff boundary: which callers are affected, what assumptions elsewhere become false, what observability needs updating
- Close with a plain-English paragraph: what the codebase can and cannot do after this lands
- Return findings as markdown with a `## Impact` heading

**Sibling agent** — find open PRs that will be affected by this PR merging. The agent should:
- Run `gh pr diff --name-only` to get the current PR's changed files
- Run `gh pr list --state open --json number,title,url,headRefName,author` to list all open PRs (excluding the current one)
- For each open PR, run `gh pr diff <number> --name-only` to get its changed files
- Flag any open PR that overlaps on at least one file — these are **direct conflicts**
- For open PRs with no file overlap, skim their diff (`gh pr diff <number>`) for semantic interference: shared interfaces, shared constants, migrations, config, or API contracts touched by both
- For each flagged PR, explain specifically what overlaps and what the merge risk is
- If no open PRs are impacted, say so explicitly
- Return findings as markdown with a `## Sibling PRs` heading; each entry should include the PR title, number as a markdown link to its URL, and the reason it's flagged

Completion criterion: all three agents have returned non-empty markdown with their respective headings.

## Assemble

Get PR context: run `gh pr view --json title,number,url,author,headRefName` and extract title, number, URL, author login, and branch. Fall back gracefully if unavailable.

Write the dossier to `/tmp/pr-dossier-$(date +%s).html`. See [HTML spec](#html-spec).

Completion criterion: file exists; `id="code-review"`, `id="impact"`, and `id="siblings"` sections all contain non-empty content.

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
    <nav>     sticky: "Code Review" | "Impact" | "Siblings"  </nav>
    <main>
      <section id="code-review">  review agent output    </section>
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
```
