# Compliance and Data Boundary

Public-use boundary: Public GitHub Pages deployment is educational and synthetic only. Real patient-care use requires an approved controlled environment, governance, storage, and security review.

This repository is not an official clinical, educational, institutional, staffing, finance, recruitment, or operational system. Public deployments are for synthetic, educational, or public-reference use only.

Do not commit, upload, paste, or test with:

- PHI, patient identifiers, or real clinical details;
- research participant identifiers or restricted research data;
- learner, trainee, assessor, personnel, staffing, finance, contract, or credentialing records;
- confidential/restricted operational, strategic, partner, or contract information;
- credentials, tokens, keys, secrets, screenshots of private systems, or exported source documents.

Allowed public content:

- synthetic examples clearly labeled as synthetic;
- public-domain or properly cited public reference material;
- aggregate methods examples that cannot identify people, sites, partners, contracts, or internal operations.

Deployment rule: real clinical, patient-facing, trainee-record, research-participant, or internal-planning use must move to an approved controlled environment with access control, approved storage, security review, incident-response path, and owner governance.

Review cadence: review before every public Pages deployment and after any change that adds forms, uploads, local storage, exports, contact workflows, clinical recommendations, study recruitment language, or organizational branding.

## AI-Assisted Reference Update Gate

Before accepting AI-generated changes to clinical reference text, calculators, evidence summaries, or module navigation, apply `docs/ai-agent-evals/automedbench-lite.md`.

The gate requires S1 Plan, S2 Setup, S3 Validate, S4 Execute, and S5 Submit with source fidelity checks, date/currency checks, contradiction checks, render checks, and no-PHI confirmation. It evaluates workflow discipline only; it does not convert this repository into an official clinical system or source of truth.
