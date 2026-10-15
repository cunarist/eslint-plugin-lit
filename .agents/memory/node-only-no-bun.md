---
description: Node.js 22+ is the only supported runtime; Bun is deliberately not supported or tested
---

The user decided Bun is not an official target. CI tests node@22 and
node@latest only, and every test, the Oxlint half included, runs on each leg.
The README says "Node.js 22+" with no Bun mention, and the test harness has no
runtime guard or Bun branch. Do not add Bun legs, Bun docs, or Bun-specific
code back without asking.
