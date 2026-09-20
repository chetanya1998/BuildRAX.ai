# Day 03 / B02 — Evidence IR and Requirement IR

Implemented and verified locally on 16 September 2026.

## Branch brief

- Branch: `feat/b02-evidence-requirement-ir`
- Base: Day 02 commit `56f26b2` on `feat/b01-structured-input`
- Purpose: preserve where architecture facts came from and distinguish stated, derived, proposed, conflicting, and unknown requirements.
- Delivery state: local contract implementation; not merged, persisted, deployed, or production-verified.

## User outcome

BuildRAX now has versioned contracts for source evidence and normalized requirements without mixing either representation into Architecture IR. Identical inputs receive deterministic IDs. User statements stay labelled `user-provided`; AI suggestions cannot claim observed or verified status; deterministic code evidence can be `verified-within-scope` only when it includes the detector identity, declared scope, and an exact repository location.

Requirement records carry origin, state, confidence, evidence references, and clarifying questions for unknowns. Conflicts identify all participating requirement and evidence records and remain unresolved until an explicit resolution is supplied. Cross-artifact validation rejects missing evidence and requirement references.

## Implementation evidence

| Contract | Evidence |
| --- | --- |
| Versioned evidence, location, verification, confidence, and detector schemas | [intelligence schemas](../src/lib/intelligence/schema.ts) |
| Versioned requirements, unknowns, conflicts, and reference integrity | [intelligence schemas](../src/lib/intelligence/schema.ts) |
| Deterministic IDs and request-to-traceability adapter | [input traceability](../src/lib/intelligence/input.ts) |
| Existing Architecture IR reuses the bounded requirement extractor | [architecture compiler](../src/lib/architecture-ir/compiler.ts) |
| Missing values, conflicts, confidence bounds, AI verification rejection, code-detector scope, broken references, and 3,000-character extraction | [contract fixtures](../src/lib/intelligence/schema.test.ts) |

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — 21 files and 100 tests passed.
- `npm run build` — pass; 24 pages generated.
- `npm run release:scan` — pass.

## Scope boundary and next day

B02 defines and validates in-memory contracts. It deliberately does not add the records to local drafts, immutable snapshots, database tables, migration, cloud saving, or sharing. That work belongs to Day 04 / B03 so existing persistence remains readable and receives one compatible extension instead of a parallel save path.

Day 04 / B03 should link immutable Evidence IR and Requirement IR artifacts to the existing diagram/version graph, add legacy adapters without invented evidence, and verify checksum, save/load, tenant-isolation, and migration behavior.
