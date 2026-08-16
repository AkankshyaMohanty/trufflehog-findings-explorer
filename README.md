# SecretScope — TruffleHog Findings Explorer

A frontend-only security triage dashboard for turning raw TruffleHog findings
into an actionable remediation queue.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Browser localStorage

No backend, database, cloud account, or external component library is required.

## Features

- Import TruffleHog JSON or JSONL reports
- Local-only browser parsing
- Normalize findings across Git, filesystem, S3, and CloudWatch metadata
- Deduplicate repeated findings by detector/value/source
- Verified vs unverified triage
- Severity classification
- Search and filter by detector, severity, status, verification, and source
- Mark findings as:
  - Open
  - Investigating
  - False Positive
  - Accepted Risk
  - Resolved
- Analyst notes persisted in localStorage
- Likely false-positive heuristics
- Finding details drawer
- Remediation guidance
- CSV export
- JSON export
- Responsive dashboard
- Sanitized sample data

## Sample report

A sanitized import example is included at:

```text
sample-data/trufflehog-demo.json
```

## Run locally

Vite 8 requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Project structure

```text
src/
├── components/
│   ├── FindingDrawer.tsx
│   ├── Icon.tsx
│   └── MetricCard.tsx
├── data/
│   └── mockFindings.ts
├── hooks/
│   └── useLocalStorage.ts
├── lib/
│   └── normalizer.ts
├── App.tsx
├── index.css
├── main.tsx
└── types.ts
```

## Data flow

```text
TruffleHog JSON / JSONL
          |
          v
Browser parser
          |
          v
Normalization
          |
          v
Deduplication
          |
          +----> Verification status
          +----> Severity
          +----> False-positive hints
          |
          v
Triage queue
          |
          +----> Analyst status / notes
          +----> CSV / JSON report
```

## Important security note

Do not commit real secrets or unsanitized production scan reports to a public
GitHub repository.

The included sample data uses fake/redacted credentials.

## False-positive heuristic

The demo contains one intentionally narrow example: UUID-shaped values detected
as HubSpot API keys in CloudWatch context are flagged as possible false positives
for analyst review.

This is not authoritative verification and should not be generalized without
context.

## Suggested next milestones

- Findings grouped by repository and detector
- Side-by-side raw vs normalized finding view
- Bulk triage actions
- Ownership / assignee field
- Remediation SLA tracking
- Detector suppression rules
- Saved filter presets
- Trend charts across multiple scans
- Compare two scan reports
- Unit tests for normalization and deduplication
