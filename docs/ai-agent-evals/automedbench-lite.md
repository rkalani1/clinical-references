# AutoMedBench-Lite Gate for Clinical Reference Updates

Use this gate before accepting AI-generated changes to clinical reference text, calculators, evidence summaries, exported handouts, or module navigation.

This gate evaluates process quality. It does not make the repository an official clinical system, patient-care tool, or institutional source of truth.

## Safety Boundary

- Use public, properly cited, synthetic, or de-identified material only.
- Do not add PHI, patient identifiers, real clinical details, restricted research data, learner records, credentials, private screenshots, or internal operational content.
- Do not turn educational reference text into patient-care instructions without approved clinical review and governance.

## S1 Plan

The agent must state:

- Target topic folder, page, calculator, or reference card.
- Exact claim, formula, text, or behavior being changed.
- Public source or existing repo source supporting the change.
- In-scope and out-of-scope work.
- Stop conditions, including source uncertainty, date mismatch, conflicting guidance, or missing validation.

## S2 Setup

The agent must identify:

- Current source files and any mirrored text in other folders.
- Public references, dates, guideline versions, PMIDs, DOIs, NCT IDs, or source URLs.
- Compliance boundary from `COMPLIANCE.md`.
- Manual browser checks needed for changed pages.

## S3 Validate

The agent must complete concrete checks:

- Source fidelity: each claim maps to public or repo-approved source material.
- Date/currency: source dates, guideline versions, and identifiers are exact.
- Contradiction check: new text does not conflict with nearby cards or safety caveats.
- Privacy check: no PHI, restricted data, private screenshots, or realistic fake patient records.
- Format check: HTML, links, anchors, tables, and calculators still render.
- Overclaiming check: no bedside, official, endorsed, regulatory, or clinical-validity claim is introduced.

## S4 Execute

Make only the scoped change after S1-S3 are complete. Preserve educational framing, compliance language, and source traceability.

## S5 Submit

The final response or PR description must include:

- Changed files.
- Source trace with exact dates or identifiers when available.
- Manual checks performed.
- Residual clinical review need.
- Confirmation that no PHI, restricted data, credentials, or confidential institutional content were introduced.

## One-Shot Prompt

```text
Apply the clinical-references AutoMedBench-Lite gate. Write S1 Plan, S2 Setup, and S3 Validate before editing. Then execute the scoped change and submit changed files, source trace, manual checks, residual clinical review need, and no-PHI confirmation. Stop if source fidelity, privacy, or render validation cannot be completed.
```
