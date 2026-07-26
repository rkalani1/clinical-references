# Post-launch design validation

Validated 2026-07-25 against the post-launch design backlog.

## Template-family inventory (OBS-023)

| Family | Guides | Representative checked | Narrow widths | Result |
| --- | ---: | --- | --- | --- |
| Shared dual-view template | 20 | IVT | 320, 360, 390 px | No document-level horizontal overflow |
| Pupillometry custom app | 1 | Pupillometry | 320, 360, 390 px | Controls, diagrams, and content remain contained |
| EVD/ICP custom app | 1 | EVD & ICP | 320, 360, 390 px | Controls and content remain contained |

The representative checks cover every template family. No broader style rollout was needed after those checks.

## Directory and route inventory (OBS-022–028)

- The synthetic-demo scope statement appears before the first reference card.
- The directory exposes search, category filters, a live result count, a clear empty state, and compact mobile details disclosures.
- All 22 directory cards have a unique destination.
- All 22 destination pages contain a route back to the directory.
- Ambiguous card actions are contextualized with their guide title.
- Keyboard focus was checked for the skip link, search/clear flow, mobile detail disclosures, and custom-guide return links.

Run `node tests/verify-post-launch-design.mjs` to recheck the static route and interaction contracts.

## Repeat-use decision (OBS-029)

The audit supplied no analytics, longitudinal usage study, or other evidence that repeat visits concentrate on stable individual guides. A Recent or Favorites feature would therefore be speculative. It was intentionally not added; search and category filtering remain the primary retrieval tools. Revisit this decision only when repeat-use telemetry or structured user research demonstrates demand.
