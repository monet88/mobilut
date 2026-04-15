# PRD: LUT App De-risked Build Plan

Status: Approved via ralplan consensus on 2026-04-15
Source artifacts: `PLAN.md`, `TODOS.md`, `tools/cube_to_hald.py`, `.omx/context/plan-md-20260415T034727Z.md`
Date: 2026-04-15

## Requirements Summary

- Build a mobile photo color grading app for Vietnamese creators with built-in presets, LUT import, core editing controls, and a one-time purchase unlock model. Evidence: `PLAN.md:14-16`, `PLAN.md:161-166`.
- Keep the chosen product/technical direction of React Native + Expo bare + Skia, but re-sequence the work around current blockers and engineering gaps rather than executing the original sprint list unchanged. Evidence: `PLAN.md:18-52`, `PLAN.md:54-120`, `PLAN.md:282-283`, `PLAN.md:380-385`.
- Treat market validation, LUT licensing, and app naming as explicit pre-build gates instead of background TODOs. Evidence: `PLAN.md:188-199`, `TODOS.md:3-24`.
- Plan from the actual repo state: this is a greenfield codebase with no app source yet and one reusable LUT conversion tool. Evidence: `PLAN.md:234-238`, repo root listing, `tools/cube_to_hald.py:19-109`.
- Bake in the reviewed design and engineering corrections from day 1: in-editor LUT selection, dark-first UI, CPU fallback, signed RevenueCat entitlement state, early E2E coverage, pre-generated thumbnails, support for 33 and 64 cube sizes, and explicit slider order. Evidence: `PLAN.md:347-353`, `PLAN.md:361-385`, `PLAN.md:408-419`.

## RALPLAN-DR Summary

### Principles

1. Gate irreversible product build work behind validation and licensing proof.
2. De-risk the rendering pipeline before broad UI scaffolding.
3. Keep the first build vertically testable, not just horizontally complete.
4. Prefer reversible architecture boundaries over optimistic single-path implementation.
5. Preserve the reviewed product decisions already accepted unless new evidence invalidates them.

### Decision Drivers

1. The repo is still greenfield, so sequencing errors now create pure rework later. Evidence: `PLAN.md:237-238`.
2. The highest-risk unknown is the LUT/rendering pipeline, not navigation or screen scaffolding. Evidence: `PLAN.md:189-190`, `PLAN.md:361-385`, `TODOS.md:14-16`.
3. Commercial blockers are real launch gates, not polish items. Evidence: `PLAN.md:195-201`, `TODOS.md:3-10`.

### Viable Options

#### Option A: Execute the original 5-sprint plan largely as written

Pros:
- Fastest path to visible app screens.
- Lowest planning overhead because `PLAN.md` already lays out sprints.

Cons:
- Front-loads app scaffolding before the shader/spec/fallback risks are retired.
- Treats market validation and licensing as side work even though both are explicit blockers.
- Increases rework risk if asset bundling, fallback behavior, or monetization assumptions change.

#### Option B: Reframe the work into gated phases: blockers, rendering spike, vertical slice, growth features, release hardening

Pros:
- Matches the reviewed findings that shader correctness, fallback, encoding spec, and asset bundling are top risks.
- Lets the team prove one end-to-end editor slice before multiplying surface area.
- Makes later `ralph` or `team` execution easier because each phase has clear exit criteria.

Cons:
- Delays visible “full app” progress.
- Requires more upfront docs/spec work than the original sprint list.

#### Option C: Build only a narrow import-and-preview prototype before committing to the full product

Pros:
- Smallest engineering commitment.
- Good if market validation is likely to invalidate the product premise.

Cons:
- Undershoots the current accepted product direction.
- Defers key monetization and UX decisions instead of shaping them.
- Risks producing a prototype that is not reusable enough for the launch build.

### Recommendation

Choose Option B, refined into a two-step de-risking path: Phase 1a pure spec/core work, then Phase 1b proof inside a thin Expo bare + Skia runtime harness on Android before broader editor implementation. This preserves the accepted React Native + Skia direction while correcting the original plan’s biggest weakness: broad feature scheduling before blocker closure and real runtime proof.

## Acceptance Criteria

1. Validation/commercial gate artifacts exist and are reviewable:
   - `docs/market-validation.md` records the 20-response evidence set or an explicit stop/go decision.
   - `docs/licensing.md` records the commercial LUT source and bundling rights.
   - `docs/brand.md` records the working app name and store-facing naming constraints.
2. A rendering-spec and runtime-proof phase is complete before broad app build-out:
   - `docs/lut-encoding-spec.md` defines cube indexing, texel centering, strip layout, supported LUT sizes, and round-trip expectations.
   - `docs/adr/0001-rendering-pipeline.md` documents GPU-first rendering plus CPU fallback.
   - A thin Expo bare + Skia harness proves shader correctness, compile-failure handling, and GPU/CPU parity against identity and sample LUT fixtures before editor implementation is declared ready.
   - Preview decode policy and launch-grade export policy are decided before the app shell expands.
3. The first runnable mobile slice is vertical:
   - User can pick a photo, import one LUT, apply one LUT, adjust intensity, compare before/after, and export one image.
   - Failure modes for malformed LUTs, shader compile failure, oversized imports, and export/storage errors have explicit rescue UX.
4. Monetization and catalog work is gated by earlier proof:
   - RevenueCat entitlement source of truth is signed cache or SDK-backed state, not a local boolean.
   - Thumbnail generation strategy is pre-generated or otherwise proven not to block first launch.
5. Release hardening is measurable:
   - 12MP image handling passes defined memory/performance checks.
   - E2E coverage exists for the core pick → edit → export flow before store submission work starts.

## Implementation Steps

### Phase 0: Business and commercial gates

Objective:
Close the non-code blockers that the current plan already marks as launch-critical.

Likely touchpoints:
- `docs/market-validation.md`
- `docs/licensing.md`
- `docs/brand.md`
- `PLAN.md`
- `TODOS.md`

Actions:
- Run and document the validation pass described in `TODOS.md:3-6`.
- Resolve LUT licensing before any decision to bundle 200 presets. Evidence: `PLAN.md:87`, `PLAN.md:188`, `PLAN.md:197`.
- Record a working product name and store submission constraints. Evidence: `PLAN.md:199-201`, `TODOS.md:10`.

Exit criteria:
- Either a clear go decision with evidence, or a stop/pivot decision that halts app implementation.

### Phase 1a: Rendering core specification

Objective:
Retire the highest-risk technical unknowns before broad app scaffolding.

Likely touchpoints:
- `docs/lut-encoding-spec.md`
- `docs/adr/0001-rendering-pipeline.md`
- `docs/adr/0002-lut-asset-bundling.md`
- `packages/lut-core/`
- `tools/cube_to_hald.py`
- `tools/identity_test.cube`
- `tools/identity_hald_test.png`

Actions:
- Establish one explicit architecture boundary: parsing, encoding, interpolation math, and fixture-based correctness tests live in a reusable pure TypeScript core under `packages/lut-core/`; app-specific image IO, rendering, and state stay in `src/`.
- Port or formally specify the reusable behavior in `tools/cube_to_hald.py:19-109`, including parse rules, layout assumptions, and trilinear interpolation math.
- Decide supported LUT sizes up front, with 33 and 64 required. Evidence: `PLAN.md:369`, `PLAN.md:416`.
- Decide asset strategy for built-in LUTs and thumbnails before catalog implementation. Evidence: `PLAN.md:371-373`, `PLAN.md:383`, `PLAN.md:415`.
- Decide preview decode policy, full-resolution export strategy, and whether tiled/background export is mandatory for launch. Evidence: `PLAN.md:190`, `PLAN.md:286`, `PLAN.md:375`.

Exit criteria:
- Encoding spec approved.
- `packages/lut-core/` ownership boundary approved.
- Asset-bundling ADR approved.
- A supported/unsupported LUT matrix exists for `.cube` and HaldCLUT imports.
- Export/decode policy is documented before runtime harness work starts.

### Phase 1b: Production-stack runtime harness

Objective:
Retire the real runtime risk inside the actual target stack before broader editor implementation.

Likely touchpoints:
- `package.json`
- `app.json`
- `babel.config.js`
- `tsconfig.json`
- `android/`
- `ios/`
- `src/app/`
- `src/harness/`
- `src/engine/lut/`
- `packages/lut-core/`
- `__tests__/engine/`

Actions:
- Initialize the minimal Expo bare shell required to exercise Skia on Android.
- Wire `packages/lut-core/` into a thin Skia harness that loads fixtures, runs the shader path, and exposes CPU fallback comparison results.
- Validate shader compile success and failure handling on at least one target Android device profile.
- Record a concrete GPU-to-CPU parity tolerance and prove it on identity and sample LUT fixtures.

Exit criteria:
- The Expo bare + Skia harness runs on Android.
- Compile failure and fallback behavior are verified, not assumed.
- GPU-to-CPU parity tolerance is documented and met on fixture comparisons.
- The runtime harness is stable enough to host the first vertical slice.

### Phase 2: App scaffold and minimal import path

Objective:
Create the actual app skeleton only after the rendering constraints are known and the target runtime is proven.

Likely touchpoints:
- `package.json`
- `app.json`
- `babel.config.js`
- `tsconfig.json`
- `android/`
- `ios/`
- `src/app/`
- `src/engine/lut/`
- `src/engine/image/`
- `src/state/edit/`
- `src/services/storage/`
- `__tests__/engine/`

Actions:
- Expand the validated harness into the actual app shell and baseline tooling. Evidence: `PLAN.md:60-61`, `PLAN.md:126-136`.
- Implement an interface-based `LUTEngine` so GPU and CPU paths share one contract, while keeping parsing/encoding in `packages/lut-core/`. Evidence: `PLAN.md:291`, `PLAN.md:384`.
- Create the `EditState` contract with undo/redo budget before wiring UI. Evidence: `PLAN.md:263`, `PLAN.md:368`, `PLAN.md:285`.
- Add parser and encoder tests as soon as the TS implementation exists. Evidence: `PLAN.md:67`, `PLAN.md:292`, `PLAN.md:397`.
- Move minimal import-path support into this phase so the app still has a viable product path if bundled catalog licensing slips. Evidence: `PLAN.md:14-16`, `PLAN.md:91`, `TODOS.md:8`.

Exit criteria:
- App boots locally.
- Engine contract is test-covered.
- Identity LUT round-trip passes in automated tests.
- The app can import a supported user LUT and feed it into the validated harness path.

### Phase 3: Vertical editor slice

Objective:
Ship one complete editing flow before building the full catalog and paywall surfaces.

Likely touchpoints:
- `src/features/editor/`
- `src/components/editor/`
- `src/theme/`
- `src/i18n/`
- `src/components/state/`
- `__tests__/integration/editor/`
- `e2e/editor-flow/`

Actions:
- Build the editor with in-editor LUT selection, dark-first design, before/after interaction, import-first fallback support, and explicit loading/error/empty states. Evidence: `PLAN.md:347-353`, `PLAN.md:408-410`.
- Apply the accepted slider order and verify the transform pipeline. Evidence: `PLAN.md:374`, `PLAN.md:419`.
- Add rescue UX for the six critical gaps already identified in the plan. Evidence: `PLAN.md:243-258`.

Exit criteria:
- Pick → apply LUT → adjust → compare → export works on at least one supported device profile.
- Integration tests cover the happy path and top failure paths.

### Phase 4a: Catalog-independent expansion

Objective:
Complete the import-led product path and supporting UX even if bundled licensing or full catalog scale is still unresolved.

Likely touchpoints:
- `src/features/import/`
- `src/features/editor/`
- `src/features/settings/`
- `src/i18n/locales/`
- `__tests__/integration/import/`

Actions:
- Harden `.cube` and `.png` import with pre-decode size checks and Android path sanitization. Evidence: `PLAN.md:376-378`, `PLAN.md:417`.
- Ensure the product remains valuable with imported LUTs plus the minimal built-in set if full catalog bundling is deferred.
- Localize all strings in Vietnamese and English for the core import/editor/settings surfaces. Evidence: `PLAN.md:168-173`.

Exit criteria:
- Import-first product path is complete and test-covered.
- Core localized surfaces are usable without the full paid catalog.

### Phase 4b: Bundled catalog, monetization, and thumbnail scale-up

Objective:
Add the product surfaces that depend on the proven editor and engine.

Likely touchpoints:
- `src/features/catalog/`
- `src/features/import/`
- `src/features/purchases/`
- `src/features/settings/`
- `src/services/revenuecat/`
- `src/services/files/`
- `assets/luts/`
- `assets/thumbnails/`
- `src/i18n/locales/`
- `__tests__/integration/purchases/`

Actions:
- Add free/paid gating only after the RevenueCat entitlement contract is defined around signed cache or SDK state. Evidence: `PLAN.md:372`, `PLAN.md:414`.
- Pre-generate or otherwise prove thumbnail strategy before bundling full preset inventory. Evidence: `PLAN.md:373`, `PLAN.md:415`.
- Bundle licensed presets only after Phase 0 validation/licensing gates remain green.

Exit criteria:
- Paid/free gating is verifiably correct.
- Catalog remains responsive on first open.
- Licensed bundled assets are compliant and fit the approved asset strategy.

### Phase 5: Hardening, observability, and release prep

Objective:
Turn the feature-complete build into a releasable Android-first product.

Likely touchpoints:
- `src/observability/`
- `src/features/settings/`
- `e2e/`
- `docs/release-checklist.md`
- `docs/privacy-policy.md`
- store metadata assets

Actions:
- Add crash reporting and staged rollout support. Evidence: `PLAN.md:294-295`.
- Run 12MP memory/performance verification and tile/export stress tests. Evidence: `PLAN.md:190`, `PLAN.md:375`.
- Finalize permission text, privacy policy, and store-submission checklists. Evidence: `PLAN.md:111-120`, `PLAN.md:200-201`, `PLAN.md:218-220`.

Exit criteria:
- Release checklist is green for Android-first launch.
- Core E2E flow, regression suite, and performance thresholds all pass.

## Risks and Mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Market demand remains unproven | Building the wrong product is costlier than delaying the scaffold | Treat Phase 0 as a hard gate, not a side task |
| Shader correctness/fallback complexity | Can cause wrong colors or device-specific crashes | Require Phase 1 prototype, identity round-trip tests, and CPU fallback before editor work |
| Asset bundle size / first-launch performance | 200 LUTs and thumbnails can hurt APK size and UX | Approve bundling ADR before catalog build, pre-generate thumbnails, stage asset rollout |
| Import security and memory failures | Malformed LUTs or large PNGs can crash the app | Validate file size, decode bounds, and content URIs before parsing |
| Monetization state drift | Local boolean state can be bypassed or desync | Use RevenueCat entitlement-backed state from the start |
| UI/product fragmentation | Separate browse flows and unspecified states weaken the experience | Keep LUT selection inside editor and define error/loading/empty states in Phase 3 |

## Verification Steps

1. Review gate:
   - Confirm Phase 0 artifacts exist and are approved before any “build the app” execution starts.
2. Rendering gate:
   - Run parser round-trip tests against identity fixtures and supported LUT sizes.
   - Compare GPU and CPU outputs on the same fixtures within agreed tolerance.
3. Vertical slice gate:
   - Run integration and E2E checks for pick → edit → export.
   - Manually verify before/after interaction, rescue UX, and dark-mode readability.
4. Commerce/import gate:
   - Verify paid/free gating with RevenueCat sandbox flows.
   - Verify rejected-input flows for malformed `.cube`, invalid HaldCLUTs, and oversized PNG imports.
5. Release gate:
   - Run 12MP performance tests, regression suite, and store-prep checklist before submission work.

## ADR

### Decision

Replace the original flat 5-sprint execution order with a gated, de-risked build plan: Phase 0 blocker closure, Phase 1a rendering core/spec, Phase 1b Expo bare + Skia runtime harness, Phase 2 app scaffold plus minimal import support, Phase 3 vertical editor slice, Phase 4a import-led expansion, Phase 4b bundled catalog/commerce scale-up, Phase 5 release hardening.

### Drivers

- Greenfield repo state with almost no reusable code. Evidence: `PLAN.md:237-238`.
- Rendering/fallback/spec problems are the dominant engineering risk. Evidence: `PLAN.md:361-385`.
- Validation and licensing are explicit blockers in both `PLAN.md` and `TODOS.md`. Evidence: `PLAN.md:195-201`, `TODOS.md:3-10`.

### Alternatives Considered

- Keep the original sprint plan and address gaps inside each sprint.
- Build only a narrow prototype and defer the full product plan.

### Why Chosen

This option preserves the accepted product direction while reducing predictable rework. It also avoids a false distinction between “prototype proof” and “real runtime proof,” while producing clean handoff checkpoints for future `ralph` or `team` execution.

### Consequences

- More up-front planning and proof work before visible UI breadth.
- Cleaner execution boundaries and better testability once coding starts.
- Potential early stop point if validation or licensing fails, which is desirable.
- A viable import-first product path exists even if bundled catalog licensing lags.

### Follow-ups

- Convert this PRD into execution only after Architect/Critic approval.
- Pair it with a test-spec artifact and execution staffing plan.
- Update `PLAN.md` only if this gated plan becomes the new canonical product plan.

## Available-Agent-Types Roster

- `explore`: fast repo/file/symbol mapping
- `analyst`: requirements clarification and hidden constraints
- `planner`: task sequencing and execution planning
- `architect`: system boundaries and tradeoffs
- `executor`: implementation work
- `debugger`: failure/root-cause analysis
- `test-engineer`: test planning and coverage work
- `designer`: UX/UI structure and interaction definition
- `writer`: docs, migration notes, user-facing guidance
- `security-reviewer`: import, entitlement, and trust-boundary review
- `critic`: plan/design challenge and quality review
- `verifier`: evidence gathering and completion validation
- `build-fixer`: toolchain/build resolution when setup fails

## Follow-up Staffing Guidance

### Ralph path

Recommended lane shape:
- `executor` at high reasoning for Phase 1a-3 implementation.
- `test-engineer` at medium reasoning for parser/spec, integration, and E2E coverage.
- `designer` at high reasoning for Phase 3 interaction/state decisions.
- `security-reviewer` at medium reasoning for import and entitlement boundaries.
- `verifier` at high reasoning for pre-completion evidence.

Suggested launch hint:
- `$ralph ".omx/plans/prd-lut-app-de-risked-build-20260415T034727Z.md"`

Ralph verification expectation:
- Do not leave Phase 1a without approved specs and core ownership boundaries.
- Do not leave Phase 1b without runtime harness evidence on Android.
- Do not leave Phase 3 without an end-to-end editor proof.
- Do not declare completion without the paired test spec passing.

### Team path

Recommended headcount:
- 3 lanes minimum.

Suggested lane allocation:
- Lane 1: `executor` high reasoning, owns `packages/lut-core/`, specs, and runtime harness work.
- Lane 2: `designer` high reasoning plus `executor` support, owns Phase 2-3 editor interaction/state flow.
- Lane 3: `test-engineer` medium reasoning plus `verifier` high reasoning, owns regression, E2E, and release evidence.
- Optional lane 4: `security-reviewer` medium reasoning for import + purchase trust boundaries.

Suggested launch hints:
- `$team 3:executor "Execute .omx/plans/prd-lut-app-de-risked-build-20260415T034727Z.md with the paired test spec and keep one lane on verification evidence"`
- `omx team 3:executor "Execute .omx/plans/prd-lut-app-de-risked-build-20260415T034727Z.md with the paired test spec and keep one lane on verification evidence"`

Team verification path:
- Team proves the active phase deliverables, tests, and evidence before shutdown, especially the Phase 1b runtime-harness gate.
- A final `verifier` or later Ralph follow-up confirms cross-phase regression and release readiness.

## Change Log

- Reframed the source plan from broad sprint scheduling into gated execution phases.
- Promoted market validation and licensing from TODOs to explicit build gates.
- Pulled accepted design/engineering corrections into the base plan instead of leaving them as review notes.
- Added an explicit pure-TS `packages/lut-core/` ownership boundary.
- Split the rendering risk work into Phase 1a spec/core and Phase 1b Expo bare + Skia runtime proof.
- Moved import-path viability earlier so the product is not blocked on full bundled-catalog licensing.
- Aligned PRD fixture references to the existing repo source of truth under `tools/`.
