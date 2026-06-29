---
name: humanize
description: Strip AI-sounding patterns from markdown content and rewrite it to be more direct, human, and legible. Based on the Wikipedia WikiProject AI Cleanup Guide (Signs of AI Writing). Use after generating any markdown artifact — docs, PR descriptions, README sections, changelogs, reports — to remove formulaic phrasing, inflated vocabulary, and structural tics that mark text as machine-generated.
argument-hint: [file path — omit to rewrite the last markdown artifact in the conversation]
allowed-tools: Read, Edit, Write
---

# Humanize

Rewrite the target markdown content to eliminate AI-sounding patterns sourced from the [Wikipedia Signs of AI Writing guide](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).

## Input

If `$ARGUMENTS` is a file path, read that file and rewrite it in place.
If `$ARGUMENTS` is empty, the content to rewrite is the last substantial markdown block in the conversation (a generated doc, PR summary, README section, etc.). Output the rewritten version as a markdown code block.

## What to fix

Work through the content and apply every applicable rule below. Do **not** skip rules because they seem minor — the cumulative effect of many small tics is what makes text feel machine-generated.

### 1. Kill the inflation vocabulary

Remove or replace these words outright — substitute the plain word they were inflating, or restructure the sentence:

**Significance inflation** (replace with concrete claims or delete):
`stands as`, `serves as`, `is a testament to`, `vital role`, `crucial role`, `pivotal role`, `key role`, `underscores`, `underscoring`, `reflects broader`, `symbolizing`, `setting the stage`, `marks a shift`, `key turning point`, `evolving landscape`, `focal point`, `indelible mark`, `deeply rooted`, `deeply`, `profoundly`

**Filler adjectives** (delete or replace with a specific claim):
`boasts`, `vibrant`, `rich`, `profound`, `groundbreaking`, `renowned`, `diverse array`, `natural beauty`, `nestled`, `in the heart of`, `showcasing`, `exemplifies`, `robust`, `seamless`, `comprehensive`, `holistic`

**GPT-era vocabulary** (replace with plain English):
`delve`, `delves into`, `tapestry`, `meticulous`, `meticulously`, `intricacies`, `intricate`, `interplay`, `garner`, `bolstered`, `enduring`, `fostering`, `cultivating`, `encompassing`, `valuable insights`, `align with`, `resonate with`, `enhance`, `enhancement`

**Transitional throat-clearing** (delete entirely or replace with a sentence that actually connects the ideas):
`Moreover,`, `Furthermore,`, `Additionally,`, `In conclusion,`, `In summary,`, `It is worth noting that`, `It is important to note that`, `Notably,`, `Importantly,`

### 2. Stop avoiding "is"

AI replaces simple copulas with elaborate substitutes. Revert them:

| AI form | Human form |
|---------|------------|
| "serves as a foundation" | "is the foundation" |
| "stands as an example" | "is an example" |
| "represents a shift" | "is a shift" |
| "boasts three features" | "has three features" |
| "maintains a focus on" | "focuses on" |
| "offers a way to" | "lets you" or "is a way to" |

### 3. Cut the appendages

AI appends present-participial phrases to justify its own sentences. These add no information and read as padding:

- "…, highlighting the importance of X"
- "…, underscoring the need for Y"
- "…, ensuring that Z"
- "…, reflecting the team's commitment to"
- "…, contributing to a better understanding of"
- "…, demonstrating the value of"

Delete the participial tail. If the underlying point is actually worth making, restate it as its own sentence with a subject.

### 4. Dissolve the rule of three

AI mechanically groups things in threes: "fast, reliable, and scalable." Unless the three items are genuinely distinct and all needed, cut to the most important one or two.

### 5. Remove negative parallelisms

AI overuses "not just X, but also Y" and "not X, but Y" to appear nuanced. Replace with a direct positive statement of what's actually true.

### 6. Flatten "Challenges and Future" boilerplate

Sections structured as "Despite its success, X faces several challenges" followed by "Despite these challenges, the future looks promising" are pure AI formula. Either cut them or replace with specific, concrete statements about actual challenges or plans.

### 7. Fix structural formatting tics

- **Title-cased headings**: Change `## Getting Started With The API` to `## Getting started with the API` (sentence case).
- **Excessive bold**: Remove bold from words that don't need emphasis. Bold is for genuinely critical terms or UI labels, not decoration.
- **Em dash overuse**: Replace `—` used purely for rhetorical pause with a comma or period. Keep it only where a dash is genuinely the right punctuation.
- **Bullet-then-bold-header lists**: Patterns like `- **Feature name**: description` are fine when listing named items; remove when the bold is just fake structure on a prose point that should be a sentence.

### 8. Tighten the lead

AI leads open with context-setting preambles: "In today's rapidly evolving landscape, X plays a crucial role in…". Delete the preamble and start with the actual point.

### 9. Vague attributions

If the content says "experts agree," "industry reports show," "observers note," or "several sources indicate" — either replace with a specific source or delete the claim.

## What NOT to change

- Factual content, numbers, proper nouns, technical terms
- Code blocks, inline code, command syntax
- Bulleted lists that are genuinely lists (steps, options, parameters)
- Table content
- The author's actual opinions or conclusions — only remove the verbal packaging around them
- Deliberate stylistic choices that are project-specific (e.g., a specific doc format from CLAUDE.md)

## Output

Rewrite the content in place. Do not add a preamble like "Here is the rewritten version." Do not add a trailing note explaining what you changed. Just output (or write) the clean text.

If rewriting a file, write the result back to the same path and confirm with one line: `Rewrote <filename> — N changes made.`

If outputting inline, open a fenced markdown code block and close it. Nothing else.
