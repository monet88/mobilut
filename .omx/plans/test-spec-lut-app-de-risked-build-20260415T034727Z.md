# Test Spec: LUT App De-risked Build Plan

Status: Approved paired test spec via ralplan consensus on 2026-04-15
Paired PRD: `.omx/plans/prd-lut-app-de-risked-build-20260415T034727Z.md`
Date: 2026-04-15

## Scope

This test spec covers the phased build plan derived from `PLAN.md`, with emphasis on the reviewed high-risk areas: LUT parsing/encoding, GPU shader correctness, CPU fallback, import safety, purchase entitlement handling, and the core mobile editing flow. Evidence: `PLAN.md:243-258`, `PLAN.md:361-385`, `PLAN.md:397-419`.

## Test Objectives

1. Prove the rendering pipeline is correct before UI breadth increases.
2. Catch file-import crashes and wrong-color outputs at the parser boundary.
3. Prove the first vertical slice end to end before catalog/commerce scaling.
4. Verify monetization and asset strategy without allowing entitlement drift or first-launch freezes.
5. Enforce release-readiness checks for memory, performance, and regression coverage.

## Test Matrix

### Phase 0: Business/commercial gates

- Review `docs/market-validation.md` for the promised 20-response evidence or explicit no-go result.
- Review `docs/licensing.md` for rights to bundle paid/free LUTs.
- Review `docs/brand.md` for working naming and store constraints.

Pass condition:
- No execution handoff to `ralph` or `team` until these documents exist and are internally consistent.

### Phase 1a: Rendering core specification

Unit/spec tests:
- `.cube` parser accepts supported sizes and rejects unsupported or malformed files.
- HaldCLUT parser validates dimensions before expensive decode paths.
- Encoding spec tests assert texel-centering math and index layout against known fixtures.

Fixture coverage:
- Identity LUT fixture from `tools/identity_test.cube`.
- Identity HaldCLUT PNG from `tools/identity_hald_test.png`.
- Sample 33 and 64 cube fixtures.
- Malformed `.cube` fixture with missing `LUT_3D_SIZE`.
- Oversized/invalid PNG fixtures for bounds testing.

Pass condition:
- Core spec package exists, supported LUT sizes are explicit, and no unresolved correctness gap remains in parsing/encoding/interpolation behavior.

### Phase 1b: Production-stack runtime harness

Runtime/device checks:
- Expo bare + Skia harness boots on at least one target Android device profile.
- Shader compile success path is verified in the real runtime.
- Shader compile failure path triggers the expected fallback/rescue behavior.
- GPU output equals CPU fallback output within defined tolerance on identity and sample LUTs.

Pass condition:
- Runtime harness evidence exists and the agreed GPU-to-CPU parity tolerance is met.

### Phase 2: App scaffold and minimal import path

Unit tests:
- `LUTEngine` contract tests run against both GPU and CPU implementations.
- `EditState` tests cover undo/redo depth limits and memory budget behavior.
- Storage/persistence tests cover imported LUT metadata and recent/favorite state handling if introduced.

Tooling checks:
- Typecheck passes.
- App boots in local simulator/device environment.
- Engine test suite passes before UI work is merged forward.
- Minimal supported LUT import reaches the validated engine path.

Pass condition:
- Identity round-trip and engine contract tests are green in CI/local verification.

### Phase 3: Vertical editor slice

Integration tests:
- User selects photo, applies LUT, changes intensity, toggles before/after, and exports successfully.
- Rescue flows show non-crashing UI for malformed LUT, shader compile failure, OOM guard, and export failure.
- Slider pipeline order is covered so result math does not drift silently.

E2E tests:
- One happy-path mobile flow on Android-first target.
- One rejected-input flow for bad import.
- One recovery flow for temporary purchase/network or export/storage issues as applicable.

Manual checks:
- Dark mode readability, touch targets, and obvious accessibility regressions.
- In-editor LUT selection feels coherent; no separate browse detour for core apply flow.

Pass condition:
- Core editor flow is repeatable and rescue states are visible/non-fatal.

### Phase 4a: Catalog-independent expansion

Integration tests:
- `.cube` and `.png` import happy path plus rejection path for unsupported dimensions or dangerous size.
- Import-led editing flow remains useful without the full bundled catalog.

Security/resilience tests:
- Android content URI sanitization.
- Pre-decode dimension checks prevent oversized PNG memory blowups.

Localization checks:
- Vietnamese and English strings both load for the import/editor/settings path.

Pass condition:
- Import-first product path is complete, localized, and resilient.

### Phase 4b: Bundled catalog, monetization, and thumbnail scale-up

Integration tests:
- RevenueCat sandbox purchase and restore flows.
- Paid/free gating based on SDK-backed entitlement state.
- Thumbnail load tests for initial catalog open.

Security/resilience tests:
- Local toggles alone cannot unlock paid presets.

Localization checks:
- Vietnamese and English strings both load for core surfaces.
- No untranslated fallback strings remain on editor, paywall, or settings screens.

Pass condition:
- Commerce and bundled-catalog flows are correct and responsive with no known gating bypass.

### Phase 5: Hardening and release prep

Performance tests:
- 12MP preview and export memory budget stays within agreed device envelope.
- Preview render latency and export timing are measured against product goals.

Regression checks:
- Full unit/integration/E2E suite passes.
- Crash reporting and staged-rollout wiring are verified in non-production environments.
- Release checklist and privacy-policy review are complete.

Pass condition:
- Android-first release candidate is supported by fresh test evidence and checklist signoff.

## Non-Functional Checks

- Performance: preview and export metrics aligned to `PLAN.md:177-182`.
- Stability: no unrescued crash path remains from the critical-gap registry in `PLAN.md:243-258`.
- Security: import and entitlement boundaries reviewed against `PLAN.md:376-378`.
- UX consistency: design issues from `PLAN.md:347-353` are explicitly checked before release.

## Verification Commands / Evidence Expectations

Because the repo is not yet scaffolded, exact commands will be finalized during Phase 1b and Phase 2. Minimum evidence categories required before completion claims:

- Typecheck/build success for the mobile project.
- Automated test evidence for parser/spec/engine/editor flows.
- E2E evidence for pick → edit → export.
- Manual or screenshot evidence for rescue UX and dark-mode interaction quality.
- Performance evidence for 12MP preview/export.

## Exit Rule

No execution lane should mark the product build complete unless both of these are true:

1. The paired PRD phase exit criteria are satisfied.
2. The corresponding tests in this spec have fresh passing evidence.
