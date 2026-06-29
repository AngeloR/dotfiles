---
name: impact-review
description: Custom review that maps the full impact of a change — correctness plus aperture mapping (what's enabled, what's foreclosed, and second-order effects).
disable-model-invocation: true
---

Review a change for correctness, then map its **apertures** — how the change shifts what the codebase can and cannot do.

## Correctness pass

Review for logic errors, edge cases, security issues, performance regressions, and test coverage. Flag anything that would block ship.

## Aperture mapping

For each meaningful change, map two dimensions:

**Opened** — what is now possible that wasn't before?
- New capabilities exposed to callers, users, or downstream systems
- Constraints lifted (auth gates, type restrictions, rate limits, access controls)
- Extension points or hooks created

**Closed** — what is no longer possible?
- Behaviors removed or narrowed
- APIs broken or semantics silently changed
- Patterns elsewhere in the codebase that depended on prior behavior

## Second-order effects

Look past the diff boundary:
- Which callers or consumers are affected by the aperture changes?
- What assumptions elsewhere in the codebase become false?
- What does this change make easier or harder to build next?
- What observability (metrics, alerts, runbooks) needs updating?

## Impact summary

Close with a plain-English paragraph: what the codebase can and cannot do after this lands that it couldn't or could before. This is the deliverable — the correctness pass is table stakes, the aperture map is the signal.
