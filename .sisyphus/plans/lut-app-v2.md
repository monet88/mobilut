# LUT App V2 — Full Build Work Plan

## TL;DR

> **Quick Summary**: Build a mobile photo color grading app for Vietnamese creators with 50-100 free LUTs, core editing tools, AI-powered style transfer (Gemini API) as PRO subscription feature, and AdMob banner ads for free users. React Native + Expo dev-client + Skia, both Android + iOS.
> 
> **Deliverables**:
> - Cross-platform mobile app (Android + iOS)
> - 50-100 bundled free LUTs with category browse
> - Full editor: LUT apply, brightness/contrast/saturation/temperature/sharpen, crop, undo/redo, before/after, export
> - AI style transfer via Gemini API (PRO subscription)
> - Subscription monetization (monthly/yearly/lifetime) via RevenueCat
> - AdMob banner ads (free tier)
> - Vietnamese + English localization
> 
> **Estimated Effort**: XL (8-12 weeks)
> **Parallel Execution**: YES — 7 waves
> **Critical Path**: T1→T3→T8→T10→T14→T20→T22→F1-F4→user okay

---

## Context

### Original Request
User has an existing PRD (`.omx/plans/prd-lut-app-de-risked-build-20260415T034727Z.md`) and original plan (`PLAN.md`). After review, user decided to:
1. Skip Phase 0 business gates (validate post-MVP)
2. Change monetization: subscription + ads instead of $2.99 one-time
3. Promote AI style transfer from deferred Phase 3 to launch requirement
4. Make ALL LUTs free (no paid/free split)
5. Develop both platforms simultaneously

### Interview Summary
**Key Discussions**:
- Phase 0 skip: User will use free .cube downloads, validate market post-launch
- Cross-platform: React Native = code once, test both. "Android first" = store submission order only
- LUT source: 50-100 free .cube files from internet, converted to PNG via existing `tools/cube_to_hald.py`
- AI feature: User picks reference photo → Gemini API analyzes style → generates matching LUT for target photo
- Monetization: Free (all features + ads) vs PRO (AI style transfer + no ads) via subscription
- App name: placeholder for now, decide before store submission
- Test strategy: TDD (test first)

**Research Findings (from PRD review + Metis)**:
- Repo is greenfield: only `PLAN.md`, `TODOS.md`, `docs/` (empty templates), `tools/cube_to_hald.py`
- SKSL shader estimated 12h but likely 24-40h (eng review)
- 6 critical failure modes need rescue UX (malformed LUT, shader crash, OOM, etc.)
- CPU fallback needed for Mali GPU shader failures
- Skia has NO built-in LUT API — custom SKSL shader required (confirmed by Skia issue #1101)
- Community examples exist (Discussion #1436, #2950) for HaldCLUT shader approach
- RuntimeShader needs supersampling for high-DPI screens
- Gemini CAN return structured JSON output → technically feasible but needs spike
- Android can kill MainActivity after image picker → need `getPendingResultAsync()`
- `react-native-iap` deprecated → RevenueCat is correct abstraction
- BannerAd component doesn't forward style props → must wrap in View
- All color processing assumes sRGB (P3 photos clipped)
- MUST use Expo dev-client/prebuild, NOT Expo Go (native modules required)

### Metis Review
**Identified Gaps (addressed)**:
- Gemini API output format unvalidated → Added API spike task (T12) before AI UI work
- Backend needed for API key security → Added API key strategy in T12 (Google AI SDK + app restrictions)
- Old plan ~60% invalidated → Writing entirely new plan from scratch
- Subscription pricing unspecified → Deferred as placeholder (user decides before store submission)
- Expo dev-client vs bare → Resolved: Expo dev-client/prebuild
- Supersampling for RuntimeShader → Added to shader task (T8)
- getPendingResultAsync() for Android → Added to image pipeline task (T11)

---

## Work Objectives

### Core Objective
Ship a cross-platform (Android + iOS) photo color grading app with free LUTs, full editor, and AI-powered PRO style transfer subscription.

### Concrete Deliverables
- Runnable app on Android emulator/device + iOS Simulator
- `packages/lut-core/` — reusable LUT parsing/encoding/interpolation library (TDD)
- Custom SKSL shader for GPU LUT rendering + CPU fallback
- 50-100 categorized free LUTs bundled as assets
- Full editor: LUT apply, 5 adjustment sliders, crop, undo/redo, before/after, export
- AI style transfer service (Gemini API) behind PRO subscription
- RevenueCat subscription flow (monthly/yearly/lifetime)
- AdMob banner integration
- Vietnamese + English localization
- Rescue UX for all critical failure modes
- Test suite: unit (TDD), integration, E2E

### Definition of Done
- [ ] App builds and runs on Android emulator + iOS Simulator
- [ ] Identity LUT round-trip test passes (GPU and CPU paths)
- [ ] Pick photo → apply LUT → adjust → compare → export works end-to-end
- [ ] AI style transfer returns usable LUT from reference photo
- [ ] Subscription purchase + restore works in sandbox
- [ ] AdMob banner renders correctly
- [ ] All 6 critical failure modes have rescue UX
- [ ] TDD test suite passes with 80%+ coverage
- [ ] E2E test passes for core flow
- [ ] Vietnamese + English strings load correctly

### Must Have
- LUT rendering correctness (identity round-trip)
- GPU rendering + CPU fallback with documented parity tolerance
- AI style transfer via Gemini API
- Subscription gating for PRO features
- Rescue UX for shader compile failure, malformed LUT, OOM, export failure
- Both platform support from day 1
- Dark-first UI theme

### Must NOT Have (Guardrails)
- NO Expo Go — must use dev-client/prebuild (native modules required)
- NO Graphite backend for Skia (experimental, not production-ready)
- NO embedded Gemini API key in app binary (use restricted key or proxy)
- NO local boolean for purchase state (RevenueCat SDK-backed entitlement only)
- NO paid/free LUT split (all LUTs are free)
- NO batch processing, live camera preview, community features (deferred)
- NO wide-gamut/P3 color space handling (assume sRGB, document limitation)
- NO market validation or licensing gates blocking development

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield — setup in T2)
- **Automated tests**: TDD (test first for all implementation tasks)
- **Framework**: Jest + React Native Testing Library (unit/integration) + Detox (E2E)
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **LUT rendering**: Bash — identity round-trip fixture comparison
- **Editor UI**: Playwright or Detox — navigate, interact, assert
- **AI feature**: Bash (curl) — send test image to Gemini API, assert structured response
- **Subscription**: Detox — sandbox purchase flow
- **API/Services**: Bash (Jest) — unit test assertions

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — 7 parallel tasks):
├── T1: Expo project init + dev-client + tooling [quick]
├── T2: Test infrastructure (Jest + RNTL + Detox config) [quick]
├── T3: packages/lut-core/ .cube parser (TDD) [deep]
├── T4: packages/lut-core/ HaldCLUT parser (TDD) [deep]
├── T5: packages/lut-core/ LUT encoder 3D→2D strip (TDD) [deep]
├── T6: Type definitions + contracts (EditState, LUTEngine, etc.) [quick]
└── T7: Theme system (dark-first tokens + base components) [visual-engineering]

Wave 2 (Rendering Engine — 6 parallel tasks, after Wave 1):
├── T8:  SKSL shader + supersampling (depends: T5, T6) [ultrabrain]
├── T9:  CPU fallback LUTEngine (depends: T3, T4, T5, T6) [deep]
├── T10: LUTEngine parity tests GPU vs CPU (depends: T8, T9) [deep]
├── T11: Image pipeline: picker + resize + export (depends: T1, T6) [unspecified-high]
├── T12: Gemini API spike — prove style analysis (depends: T1) [deep]
└── T13: AdMob setup + banner wrapper (depends: T1, T7) [quick]

Wave 3 (Editor UI — 6 parallel tasks, after Wave 2):
├── T14: Editor screen layout + navigation (depends: T7, T11) [visual-engineering]
├── T15: In-editor LUT browse (bottom sheet/strip) (depends: T8, T14) [visual-engineering]
├── T16: Adjustment sliders pipeline (depends: T8, T14) [visual-engineering]
├── T17: Before/after comparison (depends: T14) [visual-engineering]
├── T18: Crop tool + aspect ratios (depends: T11, T14) [visual-engineering]
└── T19: Undo/redo (EditState implementation) (depends: T6, T14) [deep]

Wave 4 (AI + Monetization — 5 parallel tasks, after Wave 3):
├── T20: AI style transfer service (depends: T12, T3, T5) [deep]
├── T21: AI style transfer UI (depends: T20, T14) [visual-engineering]
├── T22: RevenueCat subscription setup (depends: T1) [unspecified-high]
├── T23: Paywall/subscription UI (depends: T22, T7) [visual-engineering]
└── T24: Free/PRO gating + ad integration (depends: T13, T22, T23) [unspecified-high]

Wave 5 (Content + Polish — 7 parallel tasks, after Wave 4):
├── T25: LUT catalog bundle (50-100 LUTs + categories) [unspecified-high]
├── T26: Settings screen (language, about, restore, subscription) [visual-engineering]
├── T27: Localization vi + en [quick]
├── T28: Import hardening (size checks, URI sanitization) [unspecified-high]
├── T29: Rescue UX for all 6 failure modes [visual-engineering]
├── T30: Onboarding + empty states [visual-engineering]
└── T31: E2E tests (Detox — core flow) [deep]

Wave 6 (Release Hardening — 5 parallel tasks, after Wave 5):
├── T32: Performance profiling (12MP images) [deep]
├── T33: Crash reporting (Sentry) + staged rollout [quick]
├── T34: App icon + splash screen [visual-engineering]
├── T35: Store prep (privacy policy, permissions, metadata) [writing]
└── T36: LUT import feature (.cube + .png from device) [unspecified-high]

Wave FINAL (4 parallel reviews, then user okay):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real QA on device (unspecified-high)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| T1 | — | T8-T13, T22 | 1 |
| T2 | — | All TDD tasks | 1 |
| T3 | — | T9, T20 | 1 |
| T4 | — | T9 | 1 |
| T5 | — | T8, T9, T20 | 1 |
| T6 | — | T8, T9, T11, T14, T19 | 1 |
| T7 | — | T13, T14, T23 | 1 |
| T8 | T5, T6 | T10, T15, T16 | 2 |
| T9 | T3, T4, T5, T6 | T10 | 2 |
| T10 | T8, T9 | T14 | 2 |
| T11 | T1, T6 | T14, T18 | 2 |
| T12 | T1 | T20 | 2 |
| T13 | T1, T7 | T24 | 2 |
| T14 | T7, T10, T11 | T15-T19, T21 | 3 |
| T15 | T8, T14 | T25 | 3 |
| T16 | T8, T14 | — | 3 |
| T17 | T14 | — | 3 |
| T18 | T11, T14 | — | 3 |
| T19 | T6, T14 | — | 3 |
| T20 | T12, T3, T5 | T21 | 4 |
| T21 | T20, T14 | T24 | 4 |
| T22 | T1 | T23, T24 | 4 |
| T23 | T22, T7 | T24 | 4 |
| T24 | T13, T22, T23 | — | 4 |
| T25 | T15 | — | 5 |
| T26-T31 | Wave 4 done | — | 5 |
| T32-T36 | Wave 5 done | — | 6 |
| F1-F4 | ALL done | User okay | FINAL |

### Agent Dispatch Summary

| Wave | Tasks | Categories |
|------|-------|-----------|
| 1 | 7 | T1,T2→`quick`, T3-T5→`deep`, T6→`quick`, T7→`visual-engineering` |
| 2 | 6 | T8→`ultrabrain`, T9-T10→`deep`, T11→`unspecified-high`, T12→`deep`, T13→`quick` |
| 3 | 6 | T14-T18→`visual-engineering`, T19→`deep` |
| 4 | 5 | T20→`deep`, T21,T23→`visual-engineering`, T22,T24→`unspecified-high` |
| 5 | 7 | T25,T28→`unspecified-high`, T26,T29,T30→`visual-engineering`, T27→`quick`, T31→`deep` |
| 6 | 5 | T32→`deep`, T33→`quick`, T34→`visual-engineering`, T35→`writing`, T36→`unspecified-high` |
| FINAL | 4 | F1→`oracle`, F2,F3→`unspecified-high`, F4→`deep` |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.

### Wave 1: Foundation

- [ ] 1. Expo Project Init + Dev-Client Setup

  **What to do**:
  - Initialize Expo project with TypeScript template using `npx create-expo-app@latest`
  - Configure as dev-client build (NOT Expo Go) — add `expo-dev-client` dependency
  - Setup `app.json` / `app.config.ts` with correct bundle ID, version, Android package
  - Add `packages/lut-core/` as workspace package (yarn workspaces or npm workspaces)
  - Configure `tsconfig.json` with path aliases (`@/` for src, `@lut-core/` for packages/lut-core)
  - Setup `.gitignore`, `.prettierrc`, `.eslintrc`
  - Verify `npx expo prebuild` generates both `android/` and `ios/` directories
  - Verify dev-client builds on Android emulator AND iOS Simulator

  **Must NOT do**:
  - Do NOT use Expo Go (native modules won't work)
  - Do NOT use Graphite backend for Skia
  - Do NOT add any app features in this task

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`react-native-dev`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2-T7)
  - **Blocks**: T8, T9, T10, T11, T12, T13, T22
  - **Blocked By**: None

  **References**:
  - `PLAN.md:60-61` — Original project init spec
  - `PLAN.md:126-136` — Tech stack table (Expo bare, Skia, etc.)
  - Expo docs: `https://docs.expo.dev/develop/development-builds/create-a-build/`
  - Metis finding: Use Expo dev-client/prebuild, NOT Expo Go or bare workflow

  **Acceptance Criteria**:
  - [ ] `npx expo prebuild` succeeds, generates `android/` and `ios/`
  - [ ] `npx expo run:android` boots app on Android emulator
  - [ ] `npx expo run:ios` boots app on iOS Simulator
  - [ ] `packages/lut-core/` exists and is linked via workspaces
  - [ ] `npx tsc --noEmit` passes with zero errors

  **QA Scenarios**:
  ```
  Scenario: App boots on Android emulator
    Tool: Bash
    Steps:
      1. Run `npx expo run:android`
      2. Wait for bundler to complete (timeout: 120s)
      3. Assert process exits 0 or app shows default Expo screen
    Expected Result: App renders without crash
    Evidence: .sisyphus/evidence/task-1-android-boot.txt

  Scenario: App boots on iOS Simulator
    Tool: Bash
    Steps:
      1. Run `npx expo run:ios`
      2. Wait for bundler to complete (timeout: 120s)
      3. Assert process exits 0 or app shows default Expo screen
    Expected Result: App renders without crash
    Evidence: .sisyphus/evidence/task-1-ios-boot.txt

  Scenario: Workspace package resolves
    Tool: Bash
    Steps:
      1. Run `node -e "require.resolve('@lut-core/index')"`
      2. Assert no MODULE_NOT_FOUND error
    Expected Result: Path resolves to packages/lut-core/
    Evidence: .sisyphus/evidence/task-1-workspace-resolve.txt
  ```

  **Commit**: YES
  - Message: `feat(core): init expo project with dev-client and lut-core workspace`
  - Files: `package.json, app.config.ts, tsconfig.json, packages/lut-core/package.json, .gitignore, .prettierrc, .eslintrc.js`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 2. Test Infrastructure Setup (Jest + RNTL + Detox)

  **What to do**:
  - Install and configure Jest with `jest-expo` preset
  - Install React Native Testing Library (`@testing-library/react-native`)
  - Install and configure Detox for E2E (Android emulator + iOS Simulator configs)
  - Create `jest.config.ts` with moduleNameMapper for workspace packages
  - Create `detox.config.js` with `android.emu.debug` and `ios.sim.debug` configurations
  - Add test scripts to `package.json`: `test`, `test:watch`, `test:coverage`, `test:e2e`
  - Write one smoke test that verifies test infrastructure works: `__tests__/smoke.test.ts`
  - Verify coverage reporter works

  **Must NOT do**:
  - Do NOT write any feature tests (just infrastructure smoke test)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`react-native-dev`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3-T7)
  - **Blocks**: All TDD tasks (T3-T5, T8-T10, etc.)
  - **Blocked By**: None (can start before T1 finishes, merges after)

  **References**:
  - `PLAN.md:135-136` — Jest + RNTL + Detox stack choice
  - jest-expo docs: `https://docs.expo.dev/develop/unit-testing/`
  - Detox docs: `https://wix.github.io/Detox/docs/introduction/getting-started`

  **Acceptance Criteria**:
  - [ ] `npx jest --ci` passes smoke test
  - [ ] `npx jest --coverage` reports coverage percentage
  - [ ] `detox.config.js` exists with Android + iOS configs
  - [ ] `npm run test:e2e` command exists (may skip actual run until app has screens)

  **QA Scenarios**:
  ```
  Scenario: Jest smoke test passes
    Tool: Bash
    Steps:
      1. Run `npx jest --ci`
      2. Assert exit code 0
      3. Assert output contains "1 passed"
    Expected Result: Smoke test passes
    Evidence: .sisyphus/evidence/task-2-jest-smoke.txt

  Scenario: Coverage reporter works
    Tool: Bash
    Steps:
      1. Run `npx jest --coverage --ci`
      2. Assert output contains coverage table ("Stmts", "Branch", "Funcs", "Lines")
    Expected Result: Coverage table rendered
    Evidence: .sisyphus/evidence/task-2-coverage.txt
  ```

  **Commit**: YES
  - Message: `test(infra): setup jest, RNTL, and detox test infrastructure`
  - Files: `jest.config.ts, detox.config.js, __tests__/smoke.test.ts, package.json`
  - Pre-commit: `npx jest --ci`

- [ ] 3. packages/lut-core: .cube Parser (TDD)

  **What to do**:
  - RED: Write tests first for `.cube` file parsing
    - Parse valid 33x33x33 .cube file
    - Parse valid 64x64x64 .cube file
    - Reject unsupported sizes (e.g., 17, 128)
    - Reject malformed .cube (missing LUT_3D_SIZE, truncated data, non-numeric values)
    - Reject files >10MB
    - Parse header: TITLE, DOMAIN_MIN, DOMAIN_MAX, LUT_3D_SIZE
    - Output: Float32Array in correct index order (R outer, G middle, B inner per .cube spec)
  - GREEN: Implement `parseCube(content: string): CubeParseResult`
  - REFACTOR: Extract shared types to `packages/lut-core/src/types.ts`
  - Use `tools/identity_test.cube` as fixture for identity LUT test

  **Must NOT do**:
  - Do NOT implement HaldCLUT parsing (that's T4)
  - Do NOT implement encoding (that's T5)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`dart-flutter-patterns`] — No, use no skills. Pure TypeScript.
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4-T7)
  - **Blocks**: T9, T20
  - **Blocked By**: None (pure TS, no native deps)

  **References**:
  - `tools/cube_to_hald.py:19-55` — Reference Python parser implementation (parse_cube function)
  - `tools/identity_test.cube` — Identity LUT fixture
  - `PLAN.md:62-63` — CubeParser task spec
  - `PLAN.md:369` — Support 33 and 64 cube sizes
  - .cube format spec: https://resolve.cafe/developers/luts/

  **Acceptance Criteria**:
  - [ ] Tests written FIRST (RED phase committed separately if possible)
  - [ ] `npx jest packages/lut-core/src/__tests__/cube-parser.test.ts` — all pass
  - [ ] Identity .cube fixture round-trip: parse → verify values match expected
  - [ ] 33x33x33 and 64x64x64 both supported
  - [ ] Malformed input throws descriptive error (not generic crash)

  **QA Scenarios**:
  ```
  Scenario: Parse identity .cube fixture
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern cube-parser --verbose`
      2. Assert "parse valid 33x33x33" passes
      3. Assert "parse valid 64x64x64" passes
      4. Assert "reject malformed" passes
    Expected Result: All parser tests pass
    Evidence: .sisyphus/evidence/task-3-cube-parser-tests.txt

  Scenario: Reject oversized input
    Tool: Bash
    Steps:
      1. Run test that feeds >10MB content string to parseCube
      2. Assert throws FileTooLargeError or similar
    Expected Result: Error thrown, not OOM crash
    Evidence: .sisyphus/evidence/task-3-oversized-reject.txt
  ```

  **Commit**: YES
  - Message: `feat(lut-core): add .cube parser with TDD tests`
  - Files: `packages/lut-core/src/cube-parser.ts, packages/lut-core/src/types.ts, packages/lut-core/src/__tests__/cube-parser.test.ts`
  - Pre-commit: `npx jest packages/lut-core --ci`

- [ ] 4. packages/lut-core: HaldCLUT Parser (TDD)

  **What to do**:
  - RED: Write tests first for HaldCLUT PNG parsing
    - Parse valid HaldCLUT PNG level 8 (64x64x64 LUT = 512x512 image)
    - Parse valid HaldCLUT PNG level 4 (16x16x16 LUT = 64x64 image — SUPPORTED, matches identity fixture)
    - Reject non-square PNG
    - Reject PNG with dimensions that don't match any valid HaldCLUT level
    - Reject non-PNG files
    - Pre-decode dimension check BEFORE loading full image (prevent OOM)
    - Output: same Float32Array format as .cube parser
  - GREEN: Implement `parseHaldCLUT(pngBuffer: Buffer): HaldParseResult`
  - REFACTOR: Share types with cube parser
  - Use `tools/identity_hald_test.png` as fixture

  **Must NOT do**:
  - Do NOT implement encoding (that's T5)
  - Do NOT handle .cube files (that's T3)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T3, T5-T7)
  - **Blocks**: T9
  - **Blocked By**: None

  **References**:
  - `tools/cube_to_hald.py:57-109` — Reference Python HaldCLUT implementation
  - `tools/identity_hald_test.png` — Identity HaldCLUT fixture
  - `PLAN.md:65-66` — HaldParser task spec
  - `PLAN.md:370` — HaldCLUT non-standard levels handling

  **Acceptance Criteria**:
  - [ ] Tests written FIRST
  - [ ] `npx jest packages/lut-core/src/__tests__/hald-parser.test.ts` — all pass
  - [ ] Identity HaldCLUT fixture round-trip passes
  - [ ] Invalid PNG dimensions throw descriptive error
  - [ ] Pre-decode dimension check prevents OOM on oversized images

  **QA Scenarios**:
  ```
  Scenario: Parse identity HaldCLUT fixture
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern hald-parser --verbose`
      2. Assert identity fixture parse succeeds
      3. Assert invalid dimensions rejected
    Expected Result: All parser tests pass
    Evidence: .sisyphus/evidence/task-4-hald-parser-tests.txt

  Scenario: Reject oversized PNG
    Tool: Bash
    Steps:
      1. Run test with a 10000x10000 PNG fixture (or mock)
      2. Assert pre-decode check rejects BEFORE full decode
    Expected Result: Error thrown before memory allocation
    Evidence: .sisyphus/evidence/task-4-oversized-png-reject.txt
  ```

  **Commit**: YES
  - Message: `feat(lut-core): add HaldCLUT PNG parser with TDD tests`
  - Files: `packages/lut-core/src/hald-parser.ts, packages/lut-core/src/__tests__/hald-parser.test.ts`
  - Pre-commit: `npx jest packages/lut-core --ci`


- [ ] 5. packages/lut-core: LUT Encoder 3D→2D Strip (TDD)

  **What to do**:
  - RED: Write tests first for 3D LUT → 2D strip image encoding
    - Encode identity LUT (level 4, 16³ entries) → verify round-trip pixel-perfect with `tools/identity_hald_test.png`
    - Encode identity LUT (level 8, 64³ entries) → verify 512x512 output dimensions
    - Verify pixel layout convention: for pixel index p, r_idx = p % cubeSize, g_idx = (p / cubeSize) % cubeSize, b_idx = p / (cubeSize²)
    - Reject mismatched LUT sizes (e.g., 33³ data with level 8 request)
    - Output: Uint8Array RGBA (4 channels, alpha=255), dimensions = haldLevel³ × haldLevel³
  - GREEN: Implement `encodeLUTStrip(lut3d: Float32Array, lutSize: number, haldLevel: number): EncodedStrip`
    - Match `tools/cube_to_hald.py:60-109` trilinear interpolation algorithm exactly
    - Support haldLevel 4 (64x64 output, 16 entries/channel) and 8 (512x512 output, 64 entries/channel)
    - Clamp output values to [0, 255]
  - REFACTOR: Extract `trilinearInterpolate()` as standalone pure function for reuse by CPU fallback (T9)
  - Document the encoding spec (index convention, texel centering) as code comment — this is the CONTRACT between encoder and SKSL shader (T8)

  **Must NOT do**:
  - Do NOT implement the SKSL shader (that's T8)
  - Do NOT implement CPU fallback rendering (that's T9)
  - Do NOT parse .cube or .png files (that's T3/T4)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T4, T6-T7)
  - **Blocks**: T8, T9, T20
  - **Blocked By**: None (pure TS, no native deps)

  **References**:
  - `tools/cube_to_hald.py:54-109` — Reference Python encoder with trilinear interpolation; TS port must match this exactly
  - `tools/cube_to_hald.py:60-61` — haldLevel→cubeSize→imgSize formula: `cube_size = hald_level²`, `img_size = hald_level³`
  - `tools/cube_to_hald.py:69-76` — Pixel index → (r_idx, g_idx, b_idx) mapping convention
  - `tools/cube_to_hald.py:96-105` — Trilinear interpolation: 8-corner weighted sum
  - `tools/identity_hald_test.png` — Identity HaldCLUT fixture (level 4, 64x64) for round-trip verification
  - `PLAN.md:381` — Eng review: "Write LUT encoding spec (index convention, texel centering, round-trip test)"

  **Acceptance Criteria**:
  - [ ] Tests written FIRST (RED phase)
  - [ ] `npx jest packages/lut-core/src/__tests__/lut-encoder.test.ts` — all pass
  - [ ] Identity LUT round-trip: encode identity → compare pixel-by-pixel with `tools/identity_hald_test.png` — exact match
  - [ ] Both haldLevel 4 (64x64) and 8 (512x512) produce correct dimensions
  - [ ] Encoding spec documented as code comment in encoder source

  **QA Scenarios**:
  ```
  Scenario: Identity LUT round-trip matches fixture
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern lut-encoder --verbose`
      2. Assert "identity level 4 round-trip" test passes
      3. Assert "identity level 8 dimensions" test passes
      4. Assert "reject mismatched size" test passes
    Expected Result: All encoder tests pass, identity fixture matches pixel-for-pixel
    Evidence: .sisyphus/evidence/task-5-lut-encoder-tests.txt

  Scenario: Trilinear interpolation accuracy
    Tool: Bash
    Steps:
      1. Run test that encodes a known non-identity LUT (e.g., warm tone shift)
      2. Sample 10 known input→output color pairs
      3. Assert each output pixel within ±1 of expected value (uint8 rounding)
    Expected Result: Interpolation matches Python reference within tolerance
    Evidence: .sisyphus/evidence/task-5-interpolation-accuracy.txt
  ```

  **Commit**: YES
  - Message: `feat(lut-core): add 3D→2D strip encoder with trilinear interpolation`
  - Files: `packages/lut-core/src/lut-encoder.ts, packages/lut-core/src/__tests__/lut-encoder.test.ts`
  - Pre-commit: `npx jest packages/lut-core --ci`

- [ ] 6. Type Definitions + Contracts

  **What to do**:
  - Define all shared TypeScript types and interfaces in `src/types/`:
    - `EditState`: immutable snapshot with imageUri, appliedLutId, adjustments (brightness/contrast/saturation/temperature/sharpen as 0-1 floats), cropRect, history depth
    - `LUTEngine` interface: `applyLUT(image, lutStrip, intensity): Promise<ImageResult>` — implemented by GPU (T8) and CPU (T9)
    - `LUTMetadata`: id, name, category, thumbnailUri, sourceType (bundled/imported)
    - `AdjustmentParams`: { brightness, contrast, saturation, temperature, sharpen } all number (0.0-1.0 normalized)
    - `AIStyleResult`: structured Gemini API response type (dominantColors, warmth, contrast, saturation, etc.)
    - `SubscriptionTier`: 'free' | 'monthly' | 'yearly' | 'lifetime'
    - `EntitlementStatus`: { isPro: boolean, tier: SubscriptionTier, expiresAt?: Date }
    - `ExportOptions`: { quality: number, format: 'jpeg', maxDimension?: number }
    - `AppError` union type for all 6 failure modes: UnsupportedLUTSize | FileTooLarge | InvalidHaldFormat | ShaderCompileError | OOM | ExportFailure
  - Write type tests (compile-time checks): ensure types are assignable correctly, generics work
  - Export all types from barrel `src/types/index.ts`

  **Must NOT do**:
  - Do NOT implement any business logic (types only)
  - Do NOT add runtime validation (that belongs in individual feature tasks)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T5, T7)
  - **Blocks**: T8, T9, T11, T14, T19
  - **Blocked By**: None

  **References**:
  - `PLAN.md:35-42` — Architecture overview showing all services that need types
  - `PLAN.md:368-369` — EditState needs shape, depth limit, memory budget (eng review)
  - `PLAN.md:244` — 6 critical failure modes that need AppError types
  - `PLAN.md:374-375` — Adjustment slider order: temp→bright→contrast→sat→LUT→sharpen

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` passes — all types compile cleanly
  - [ ] `src/types/index.ts` barrel exports all types
  - [ ] EditState is immutable (readonly properties)
  - [ ] LUTEngine interface has both GPU and CPU method signatures
  - [ ] AppError union covers all 6 failure modes

  **QA Scenarios**:
  ```
  Scenario: Types compile without errors
    Tool: Bash
    Steps:
      1. Run `npx tsc --noEmit`
      2. Assert exit code 0
      3. Run `node -e "const t = require('./src/types'); console.log(Object.keys(t))"` to verify exports
    Expected Result: Zero type errors, all types exported
    Evidence: .sisyphus/evidence/task-6-type-check.txt

  Scenario: EditState immutability
    Tool: Bash
    Steps:
      1. Run type test that attempts `state.imageUri = 'new'` — expect TS error
      2. Assert compilation fails with readonly error
    Expected Result: Mutation attempts caught at compile time
    Evidence: .sisyphus/evidence/task-6-immutability.txt
  ```

  **Commit**: YES
  - Message: `feat(types): add shared type definitions and contracts`
  - Files: `src/types/edit-state.ts, src/types/lut-engine.ts, src/types/ai-style.ts, src/types/subscription.ts, src/types/errors.ts, src/types/index.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 7. Theme System (Dark-First Tokens + Base Components)

  **What to do**:
  - Create design token system in `src/theme/`:
    - Color palette: dark-first (background #0D0D0D, surface #1A1A1A, text #F5F5F5, accent brand color)
    - Spacing scale: 4/8/12/16/24/32/48
    - Typography: system font, 5 sizes (caption/body/subtitle/title/display)
    - Border radius: sm(4)/md(8)/lg(16)
  - Build base components in `src/components/ui/`:
    - `Button`: primary/secondary/ghost variants, loading state, disabled state
    - `Slider`: custom styled (not default RN), label + value display, 0.0-1.0 range
    - `Card`: surface background, border radius, padding, shadow
    - `BottomSheet`: modal bottom sheet wrapper (for LUT browse in T15)
    - `IconButton`: for toolbar actions
  - All components use theme tokens (not hardcoded colors)
  - Export via `src/components/ui/index.ts` barrel
  - Write snapshot tests for each component variant

  **Must NOT do**:
  - Do NOT add react-native-paper (custom components, lighter weight)
  - Do NOT implement feature-specific components (just primitives)
  - Do NOT add light mode (dark-first only, light mode deferred)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T6)
  - **Blocks**: T13, T14, T23
  - **Blocked By**: None

  **References**:
  - `PLAN.md:349` — Design review: dark mode essential for color grading app (Lightroom, Darkroom precedent)
  - `PLAN.md:347` — LUT selection must be in-editor (bottom sheet)
  - `PLAN.md:374` — Slider order: temp→bright→contrast→sat→LUT→sharpen

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` passes
  - [ ] All 5 base components render without error (snapshot tests pass)
  - [ ] Dark theme tokens applied — background is dark (#0D0D0D or similar)
  - [ ] Slider component supports 0.0-1.0 range with label
  - [ ] No hardcoded colors in components (all from theme tokens)

  **QA Scenarios**:
  ```
  Scenario: Base components render with theme
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern ui --verbose`
      2. Assert Button, Slider, Card, BottomSheet, IconButton snapshot tests pass
      3. Assert no hardcoded hex colors in component source files: `grep -r '#[0-9a-fA-F]\{6\}' src/components/ui/` should only match theme file
    Expected Result: All UI component tests pass, theme tokens used consistently
    Evidence: .sisyphus/evidence/task-7-theme-components.txt

  Scenario: Dark theme colors correct
    Tool: Bash
    Steps:
      1. Run `node -e "const t = require('./src/theme'); console.log(JSON.stringify(t.colors))"` 
      2. Assert background is dark (luminance < 0.1)
      3. Assert text is light (luminance > 0.8)
    Expected Result: Dark-first color scheme verified
    Evidence: .sisyphus/evidence/task-7-dark-theme.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add dark-first theme system and base components`
  - Files: `src/theme/colors.ts, src/theme/spacing.ts, src/theme/typography.ts, src/theme/index.ts, src/components/ui/Button.tsx, src/components/ui/Slider.tsx, src/components/ui/Card.tsx, src/components/ui/BottomSheet.tsx, src/components/ui/IconButton.tsx, src/components/ui/index.ts`
  - Pre-commit: `npx jest --ci`

### Wave 2: Rendering Engine

- [ ] 8. SKSL Shader + Supersampling
  **What to do**:
  - RED: Write renderer-level tests that lock down the encoder↔shader contract before SKSL implementation
    - Identity LUT applied through RuntimeEffect returns visually identical pixels for canonical fixtures
    - Non-identity LUT produces expected sampled outputs at known texel coordinates
    - Supersampling path improves stability on high-DPI devices (same source image, same LUT, compare aliased vs supersampled output)
    - Shader compile failure surfaces `ShaderCompileError` instead of crashing the app
  - GREEN: Implement GPU LUT rendering in `src/engine/gpu/` using `@shopify/react-native-skia`
    - Create a custom `RuntimeEffect` shader that samples the input image and 2D LUT strip texture
    - Match T5’s index convention exactly: texel centering, 2D strip layout, and trilinear lookup assumptions must align with `encodeLUTStrip()`
    - Use high precision float math (`highp`/equivalent SkSL precision strategy) for color sampling and interpolation
    - Add runtime supersampling for high-DPI screens (render to a scaled intermediate surface, then downsample for preview) so fine gradients do not band or alias
    - Keep color math in sRGB only and document that Display P3/wide-gamut inputs are clipped to sRGB
    - Expose a `GpuLUTEngine` implementation of the shared `LUTEngine` contract from T6
    - Add explicit shader compile error handling and fallback signal so T9 can take over on unsupported GPUs
  - REFACTOR:
    - Extract shader source and uniforms into focused files (`runtime-effect.ts`, `uniforms.ts`, `shader-contract.ts`)
    - Add code comments documenting the encoder/shader contract (texel centering, strip mapping, supersampling behavior)
    - Save a tiny set of reference fixtures/evidence images for parity work in T10
  **Must NOT do**:
  - Do NOT use Graphite backend
  - Do NOT rely on native 3D samplers (Skia RuntimeEffect does not support them here)
  - Do NOT silently swallow shader compile failures
  - Do NOT introduce P3/wide-gamut handling in this task
  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is the highest-risk graphics task in the plan and needs deep Skia/RuntimeEffect reasoning plus careful contract matching with the encoder.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T9, T11-T13)
  - **Blocks**: T10, T15, T16
  - **Blocked By**: T5, T6
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:31-37` — Wave 2 task intent and non-negotiable constraints
  - `PLAN.md:145-158` — Rendering pipeline from LUT strip to RuntimeEffect preview/export
  - `PLAN.md:361-365` — Critical shader correctness and CPU fallback gaps
  - `PLAN.md:381-384` — Top actions: write encoding spec, prototype shader first, add CPU fallback
  - `PLAN.md:412-413` — Engineering audit trail for early shader prototype and fallback
  - `tools/cube_to_hald.py:60-109` — Encoder mapping the shader must mirror exactly
  - Skia Discussion #1436 — RuntimeEffect/HaldCLUT shader approach
  - Skia Discussion #2950 — 2D-strip LUT lookup patterns and shader implementation references
  **Acceptance Criteria**:
  - [ ] Tests written FIRST for identity, known-color sampling, supersampling, and compile-failure handling
  - [ ] `npx jest --testPathPattern gpu-lut-engine --verbose` passes
  - [ ] GPU path applies identity LUT with no visible drift on the identity fixture
  - [ ] Shader compile failure is converted into `ShaderCompileError` and never crashes the app
  - [ ] Supersampling path is enabled for high-DPI preview rendering and documented in source
  - [ ] Shader source and uniform contract are documented and aligned with T5 encoder comments
  **QA Scenarios**:
  ```
  Scenario: Identity LUT renders correctly through GPU shader
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern gpu-lut-engine --verbose`
      2. Assert "identity lut through runtime effect" test passes
      3. Assert output fixture diff is at or below tolerance threshold
    Expected Result: GPU path preserves identity fixture output
    Evidence: .sisyphus/evidence/task-8-gpu-identity.txt

  Scenario: Shader compile failure triggers recoverable error
    Tool: Bash
    Steps:
      1. Run test that injects invalid SKSL source into RuntimeEffect creation
      2. Assert engine returns/throws `ShaderCompileError`
      3. Assert app-level error boundary path is invoked instead of process crash
    Expected Result: Compile failure is surfaced safely for fallback/rescue UX
    Evidence: .sisyphus/evidence/task-8-shader-compile-failure.txt
  ```
  **Commit**: YES
  - Message: `feat(engine): add sksl lut shader with supersampling`
  - Files: `src/engine/gpu/runtime-effect.ts, src/engine/gpu/gpu-lut-engine.ts, src/engine/gpu/uniforms.ts, src/engine/gpu/__tests__/gpu-lut-engine.test.ts`
  - Pre-commit: `npx jest --testPathPattern gpu-lut-engine --verbose`

- [ ] 9. CPU Fallback LUTEngine
  **What to do**:
  - RED: Write tests first for pure TypeScript CPU LUT application
    - Identity LUT returns original pixels
    - Non-identity LUT matches expected color shifts on a small fixture image
    - CPU interpolation reuses `trilinearInterpolate()` semantics from T5
    - GPU fallback selection is triggered when shader initialization fails
  - GREEN:
    - Implement `CpuLUTEngine` in `src/engine/cpu/` as a pure TS image-processing pipeline
    - Reuse the `trilinearInterpolate()` helper from T5 rather than duplicating interpolation logic
    - Match GPU behavior exactly for LUT sampling order, normalized channel handling, and intensity blending
    - Wire CPU engine behind the shared `LUTEngine` interface so app code can swap implementations without branching all over the UI layer
    - Add a lightweight engine selector/factory that prefers GPU and falls back to CPU when T8 reports shader unavailability or compile failure
  - REFACTOR:
    - Extract shared normalization/blend helpers into a common `src/engine/shared/` module
    - Add fixture helpers for parity testing in T10
  **Must NOT do**:
  - Do NOT add platform-specific native code for CPU fallback
  - Do NOT create a second interpolation algorithm that diverges from T5/T8 behavior
  - Do NOT hide fallback activation from logs/evidence
  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Why**: This is correctness-first pure TypeScript work with heavy dependence on the exact LUT math contract.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8, T11-T13)
  - **Blocks**: T10
  - **Blocked By**: T3, T4, T5, T6
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:32-33` — CPU fallback requirement
  - `PLAN.md:189-190` — Risk register explicitly calls out fallback to CPU rendering
  - `PLAN.md:362` — Critical gap: shader compile failure has no CPU fallback
  - `PLAN.md:384` — CPU fallback must be a concrete early task
  - `PLAN.md:413` — Eng decision log: interface-based fallback required
  - `tools/cube_to_hald.py:95-107` — Reference trilinear interpolation math
  - `tools/identity_test.cube` and `tools/identity_hald_test.png` — identity fixtures
  **Acceptance Criteria**:
  - [ ] Tests written FIRST for identity, non-identity, and fallback selection
  - [ ] `npx jest --testPathPattern cpu-lut-engine --verbose` passes
  - [ ] CPU output matches encoder math and intensity blending expectations
  - [ ] Engine factory selects CPU path when GPU path reports unavailable/compile error
  - [ ] No duplicated interpolation implementation exists outside shared helper(s)
  **QA Scenarios**:
  ```
  Scenario: CPU fallback renders identity LUT correctly
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern cpu-lut-engine --verbose`
      2. Assert identity fixture test passes
      3. Assert fallback path uses `CpuLUTEngine`
    Expected Result: CPU engine preserves source pixels for identity LUT
    Evidence: .sisyphus/evidence/task-9-cpu-identity.txt

  Scenario: GPU failure triggers CPU engine selection
    Tool: Bash
    Steps:
      1. Run test with mocked GPU shader initialization failure
      2. Assert engine factory returns CPU implementation
      3. Assert rendered output still completes successfully
    Expected Result: App remains functional after GPU failure
    Evidence: .sisyphus/evidence/task-9-fallback-selection.txt
  ```
  **Commit**: YES
  - Message: `feat(engine): add cpu fallback lut engine`
  - Files: `src/engine/cpu/cpu-lut-engine.ts, src/engine/create-lut-engine.ts, src/engine/shared/interpolation.ts, src/engine/cpu/__tests__/cpu-lut-engine.test.ts`
  - Pre-commit: `npx jest --testPathPattern cpu-lut-engine --verbose`

- [ ] 10. LUTEngine Parity Tests (GPU vs CPU)
  **What to do**:
  - RED: Write parity tests first that compare the GPU and CPU engines against the same inputs
    - Identity fixture parity
    - Non-identity LUT parity on a curated test image
    - Edge colors (0/255 channel extremes)
    - Midtone gradients where banding or interpolation drift would show up first
  - GREEN:
    - Build a parity harness in `src/engine/__tests__/parity/`
    - Compare GPU and CPU output pixel buffers and document an explicit tolerance (for example `maxChannelDelta <= 1` due to uint8 rounding and backend differences)
    - Capture fixture outputs and histogram/diff summaries in evidence files
    - Add one test that verifies GPU and CPU both honor intensity blending consistently
  - REFACTOR:
    - Centralize fixture loading and diff reporting helpers
    - Document the parity tolerance in source comments and the plan evidence
  **Must NOT do**:
  - Do NOT set a vague or unbounded tolerance
  - Do NOT skip GPU tests just because CPU passes
  - Do NOT leave parity evidence undocumented
  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Why**: This is pure verification and correctness work spanning both rendering implementations.
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: T14
  - **Blocked By**: T8, T9
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:34` — parity task summary
  - `PLAN.md:89` — identity LUT round-trip is a definition-of-done item
  - `PLAN.md:101-102` — parity tolerance and CPU fallback are must-haves
  - `PLAN.md:363-364` — shader correctness is a critical engineering gap
  - `PLAN.md:387-388` — explicit test plan artifact requirement
  - `tools/identity_test.cube`
  - `tools/identity_hald_test.png`
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern parity --verbose` passes
  - [ ] GPU and CPU outputs match within documented tolerance on all fixtures
  - [ ] Tolerance is explicit and justified in comments/evidence
  - [ ] Identity round-trip evidence exists for both engines
  - [ ] Intensity blend parity test passes
  **QA Scenarios**:
  ```
  Scenario: GPU and CPU outputs stay within tolerance
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern parity --verbose`
      2. Assert identity, gradient, and non-identity parity tests pass
      3. Review generated diff summary for max channel delta
    Expected Result: All engine comparisons remain within documented tolerance
    Evidence: .sisyphus/evidence/task-10-engine-parity.txt

  Scenario: Parity harness catches regression
    Tool: Bash
    Steps:
      1. Run one intentionally perturbed test fixture or mocked off-by-one shader path
      2. Assert parity test fails with clear diff output
      3. Assert failure message names the offending fixture and threshold
    Expected Result: Harness is sensitive enough to catch renderer drift
    Evidence: .sisyphus/evidence/task-10-parity-regression.txt
  ```
  **Commit**: YES
  - Message: `test(engine): add gpu cpu parity harness`
  - Files: `src/engine/__tests__/parity/parity.test.ts, src/engine/__tests__/parity/fixtures/*, src/engine/__tests__/parity/diff-utils.ts`
  - Pre-commit: `npx jest --testPathPattern parity --verbose`

- [ ] 11. Image Pipeline: Picker + Resize + Export
  **What to do**:
  - RED: Write tests for image selection, preview resize, export orchestration, and Android recovery
    - Preview image is resized to a max dimension of 2048px
    - Full-resolution export preserves original source dimensions unless export options say otherwise
    - Android `getPendingResultAsync()` recovers a lost picker result after activity recreation
    - JPEG export failure is converted into `ExportFailure`
  - GREEN:
    - Integrate `expo-image-picker` for photo selection
    - Add Android recovery logic using `ImagePicker.getPendingResultAsync()` so the app can restore a result after MainActivity is killed
    - Build preview resize flow for editor rendering (max 2048px longest edge) to keep memory use predictable
    - Build full-resolution export flow that re-renders edits against the original asset and saves JPEG output
    - Keep preview and export paths clearly separated so preview optimizations do not degrade final output
    - Thread selected image metadata into `EditState` and downstream editor screens
  - REFACTOR:
    - Separate picker, preview transform, and export modules into `src/image/`
    - Add test fixtures and mocks for Android pending-result recovery
  **Must NOT do**:
  - Do NOT use the preview-sized image for final export
  - Do NOT ignore Android activity recreation behavior
  - Do NOT output PNG/HEIC in this task (JPEG only)
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`react-native-dev`]
  - **Why**: This combines Expo native-module integration, image handling, and platform recovery edge cases.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8, T9, T12, T13)
  - **Blocks**: T14, T18
  - **Blocked By**: T1, T6
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:35` — image pipeline scope
  - `.sisyphus/plans/lut-app-v2.md:51-55` — Android picker kill/recovery finding
  - `PLAN.md:141-158` — image pick → preview render → export flow
  - `PLAN.md:190` — 12MP+ memory pressure risk
  - Expo Image Picker docs — `getPendingResultAsync()` for Android activity recovery
  **Acceptance Criteria**:
  - [ ] Tests written FIRST for resize, export, and Android recovery
  - [ ] `npx jest --testPathPattern image-pipeline --verbose` passes
  - [ ] Preview path enforces max 2048px longest edge
  - [ ] Export path re-renders at full source resolution and writes JPEG output
  - [ ] Android pending picker results are recovered successfully after recreation
  **QA Scenarios**:
  ```
  Scenario: Android picker result is recovered after activity restart
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern image-pipeline --verbose`
      2. Assert `getPendingResultAsync()` recovery test passes
      3. Assert recovered asset metadata is restored into editor state
    Expected Result: Lost picker results are restored instead of dropped
    Evidence: .sisyphus/evidence/task-11-android-pending-result.txt

  Scenario: Export failure surfaces rescue-ready error
    Tool: Bash
    Steps:
      1. Run test with mocked write/save failure during JPEG export
      2. Assert `ExportFailure` is returned/thrown
      3. Assert UI-facing error mapper receives recovery action metadata
    Expected Result: Export errors are explicit and recoverable
    Evidence: .sisyphus/evidence/task-11-export-failure.txt
  ```
  **Commit**: YES
  - Message: `feat(image): add picker resize export pipeline`
  - Files: `src/image/picker.ts, src/image/preview-resize.ts, src/image/export-jpeg.ts, src/image/__tests__/image-pipeline.test.ts`
  - Pre-commit: `npx jest --testPathPattern image-pipeline --verbose`

- [ ] 12. Gemini API Spike (GO/NO-GO)
  **What to do**:
  - RED: Write tests first for structured response parsing and LUT-param conversion
    - Valid Gemini structured JSON maps into `AIStyleResult`
    - Missing or malformed fields are rejected cleanly
    - Oversized inputs route to the right upload strategy
    - API failure and network failure are surfaced as explicit spike verdict evidence
  - GREEN:
    - Build a spike-only service that sends a reference photo to Gemini and requests structured JSON output describing color/style characteristics (`dominantColors`, `warmth`, `contrast`, `saturation`, etc.)
    - Define a JSON Schema for the expected response and validate output against it
    - Convert structured style attributes into provisional LUT parameter targets (not final UX yet)
    - Evaluate secure key strategy: restricted API key and platform/app-signing restrictions; document that embedding an unrestricted key in the binary is forbidden
    - Document request size handling and fallback to Files API/upload flow when input assets exceed inline limits
    - Produce a formal GO/NO-GO decision based on response stability, latency, structure quality, and whether the returned attributes are sufficient to generate a usable LUT in T20
  - REFACTOR:
    - Keep this spike isolated in `src/ai/spike/` so production service code in T20 can be built on proven pieces only
    - Write a short decision doc/evidence artifact summarizing findings and remaining risks
  **Must NOT do**:
  - Do NOT embed an unrestricted Gemini API key in the mobile app binary
  - Do NOT build the final user-facing AI UI in this task
  - Do NOT treat free-form text output as acceptable — structured JSON is required
  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`documentation-lookup`]
  - **Why**: This is a feasibility gate with external API contract design, validation, and security implications.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8, T9, T11, T13)
  - **Blocks**: T20
  - **Blocked By**: T1
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:36,72-84` — structured output, Files API, and API key constraints
  - `.sisyphus/plans/lut-app-v2.md:50,59-60` — Gemini structured output feasibility and API-key strategy gap
  - `PLAN.md:377` — Revenue/key storage style review analog; avoid insecure client-state shortcuts
  - Current Google Gemini docs for structured output / JSON Schema mode
  **Acceptance Criteria**:
  - [ ] Tests written FIRST for response validation and parameter conversion
  - [ ] `npx jest --testPathPattern gemini-spike --verbose` passes
  - [ ] JSON Schema for Gemini structured output exists and is enforced
  - [ ] Spike produces a written GO/NO-GO verdict with evidence
  - [ ] Restricted-key/app-signing strategy is documented; no unrestricted embedded key approach is proposed
  **QA Scenarios**:
  ```
  Scenario: Gemini returns valid structured style analysis
    Tool: Bash
    Steps:
      1. Run spike test or script against configured Gemini endpoint with a known reference photo
      2. Assert response validates against JSON Schema
      3. Assert warmth/contrast/saturation fields are converted into provisional LUT params
    Expected Result: Structured output is stable enough to drive T20
    Evidence: .sisyphus/evidence/task-12-gemini-structured-output.txt

  Scenario: Gemini malformed output is rejected
    Tool: Bash
    Steps:
      1. Run parser test with malformed or partial JSON response
      2. Assert schema validation fails with descriptive error
      3. Assert no LUT params are generated from invalid data
    Expected Result: Invalid model output cannot silently corrupt downstream rendering
    Evidence: .sisyphus/evidence/task-12-gemini-malformed.txt
  ```
  **Commit**: YES
  - Message: `spike(ai): validate gemini structured style analysis`
  - Files: `src/ai/spike/gemini-spike.ts, src/ai/spike/schema.ts, src/ai/spike/__tests__/gemini-spike.test.ts, .sisyphus/evidence/task-12-go-no-go.md`
  - Pre-commit: `npx jest --testPathPattern gemini-spike --verbose`

- [ ] 13. AdMob Setup + Banner Wrapper
  **What to do**:
  - RED: Write tests first for banner rendering and free-tier visibility behavior scaffolding
    - Banner component mounts inside a wrapper view
    - Test ad unit IDs are selected for non-production builds
    - Hidden/loading states do not break layout
  - GREEN:
    - Install and configure `react-native-google-mobile-ads`
    - Build a reusable banner wrapper component in `src/ads/` that wraps `BannerAd` in a parent `View` because the ad component does not forward style props correctly
    - Add environment-aware test ad unit IDs for development and sandbox verification
    - Expose a small ad-slot component for bottom-of-screen placement in free-tier screens
  - REFACTOR:
    - Keep ad configuration and UI wrapper separate so T24 can compose gating logic later
  **Must NOT do**:
  - Do NOT wire final free-vs-PRO entitlement logic here (that belongs in T24)
  - Do NOT apply style props directly to `BannerAd`
  - Do NOT use production ad IDs in local/dev testing
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is a narrow native-module setup task with a known wrapper caveat.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8-T12)
  - **Blocks**: T24
  - **Blocked By**: T1, T7
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:37,76` — AdMob package and wrapper caveat
  - `.sisyphus/plans/lut-app-v2.md:53` — BannerAd style-props finding
  - AdMob React Native docs for `react-native-google-mobile-ads`
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern ads --verbose` passes
  - [ ] Banner component is wrapped in `View`, not styled directly
  - [ ] Development/test ad unit IDs are configured
  - [ ] Ad slot renders without crashing the app shell
  **QA Scenarios**:
  ```
  Scenario: Banner wrapper renders with test ad IDs
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern ads --verbose`
      2. Assert banner wrapper snapshot/component test passes
      3. Assert selected unit ID matches test/dev configuration
    Expected Result: Banner slot mounts safely for development QA
    Evidence: .sisyphus/evidence/task-13-admob-wrapper.txt

  Scenario: Direct style misuse is prevented
    Tool: Bash
    Steps:
      1. Run test or source assertion that inspects the ad wrapper implementation
      2. Assert style props are applied to parent `View`, not `BannerAd`
      3. Assert no runtime prop warning occurs in render test
    Expected Result: Known BannerAd styling pitfall is avoided
    Evidence: .sisyphus/evidence/task-13-banner-style-guard.txt
  ```
  **Commit**: YES
  - Message: `feat(ads): add admob banner wrapper`
  - Files: `src/ads/banner-slot.tsx, src/ads/config.ts, src/ads/__tests__/banner-slot.test.tsx`
  - Pre-commit: `npx jest --testPathPattern ads --verbose`

### Wave 3: Editor UI

- [ ] 14. Editor Screen Layout + Navigation
  **What to do**:
  - RED: Write screen/navigation tests first
    - Editor is the default primary workflow screen after image selection
    - Navigation stack/tab structure matches the app IA
    - Dark theme wraps editor screen and key primitives render correctly
  - GREEN:
    - Add `@react-navigation/native` navigation setup
    - Define stack + tab structure with the editor as the main working surface, not a detached secondary screen
    - Build `EditorScreen` shell with preview area, bottom toolbar region, and slots for LUT browse/adjustments/actions
    - Wire selected image state from T11 into the editor route/state
    - Ensure dark-first theme from T7 is applied consistently
  - REFACTOR:
    - Keep navigation config, route types, and screen shell components separate
    - Remove any placeholder multi-screen detours that would split LUT selection away from editing
  **Must NOT do**:
  - Do NOT make LUT selection a separate full screen
  - Do NOT overstuff the bottom tab bar with five competing destinations
  - Do NOT add feature logic from T15-T19 yet beyond placeholders
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This locks in user flow and information hierarchy for the editor experience.
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3
  - **Blocks**: T15, T16, T17, T18, T19, T21
  - **Blocked By**: T7, T10, T11
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:39-45` — Wave 3 feature list
  - `PLAN.md:27-31,132` — original navigation/editor architecture references
  - `PLAN.md:339-354` — design review: editor flow, bottom-sheet LUT browse, dark mode, interaction gaps
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern editor-screen --verbose` passes
  - [ ] Navigation stack/tab config exists and compiles
  - [ ] Editor shell renders image preview + toolbar regions in dark theme
  - [ ] Editor is the central workflow surface after choosing an image
  **QA Scenarios**:
  ```
  Scenario: Editor shell opens as main workflow
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern editor-screen --verbose`
      2. Assert editor screen test passes
      3. Assert navigation state resolves to editor after image selection
    Expected Result: Editing happens in-context on the main screen
    Evidence: .sisyphus/evidence/task-14-editor-navigation.txt

  Scenario: Theme and layout placeholders render safely
    Tool: Bash
    Steps:
      1. Run component/render test for editor shell
      2. Assert dark theme tokens are present
      3. Assert toolbar/preview placeholders mount without crash
    Expected Result: Editor foundation is stable for Wave 3 features
    Evidence: .sisyphus/evidence/task-14-editor-shell.txt
  ```
  **Commit**: YES
  - Message: `feat(editor): add editor layout and navigation shell`
  - Files: `src/navigation/index.tsx, src/navigation/routes.ts, src/screens/editor/EditorScreen.tsx, src/screens/editor/__tests__/editor-screen.test.tsx`
  - Pre-commit: `npx jest --testPathPattern editor-screen --verbose`

- [ ] 15. In-Editor LUT Browse
  **What to do**:
  - RED: Write tests first for category tabs, thumbnail rendering, and tap-to-apply behavior
  - GREEN:
    - Build in-editor LUT browse UI as a bottom sheet or horizontal strip attached to `EditorScreen`
    - Add category tabs and a thumbnail grid/strip sourced from the LUT catalog
    - Apply selected LUT to the current preview on tap without navigating away from the editor
    - Show selected/active LUT state clearly
  - REFACTOR:
    - Extract `LUTCategoryTabs`, `LUTThumbnailGrid`, and `LUTSelectionSheet` into focused components
  **Must NOT do**:
  - Do NOT move LUT selection to a standalone screen
  - Do NOT generate thumbnails on first interaction if build-time/pre-generated assets are available
  - Do NOT block the main thread with large synchronous catalog work
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is the core consumer-facing interaction and must feel embedded, fast, and visually clear.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T16-T19)
  - **Blocks**: T25
  - **Blocked By**: T8, T14
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:41` — LUT browse scope
  - `PLAN.md:347,408` — in-editor bottom-sheet decision
  - `PLAN.md:415` — pre-generated thumbnails at build time
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern lut-browse --verbose` passes
  - [ ] Category tabs render and switch visible LUTs
  - [ ] Tapping a thumbnail applies the LUT in-editor
  - [ ] Selected LUT state is visually reflected
  **QA Scenarios**:
  ```
  Scenario: User browses categories and applies a LUT
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern lut-browse --verbose`
      2. Assert category switch test passes
      3. Assert tapping a LUT thumbnail updates selected LUT state
    Expected Result: LUT browsing stays inside the editor and applies immediately
    Evidence: .sisyphus/evidence/task-15-lut-browse.txt

  Scenario: Empty/slow catalog state does not break editor
    Tool: Bash
    Steps:
      1. Run test with empty LUT dataset or delayed thumbnail source
      2. Assert placeholder/loading state renders
      3. Assert editor remains interactive
    Expected Result: Catalog edge cases degrade gracefully
    Evidence: .sisyphus/evidence/task-15-lut-browse-empty.txt
  ```
  **Commit**: YES
  - Message: `feat(editor): add in-editor lut browse`
  - Files: `src/screens/editor/lut-browse/LUTSelectionSheet.tsx, src/screens/editor/lut-browse/LUTCategoryTabs.tsx, src/screens/editor/lut-browse/__tests__/lut-browse.test.tsx`
  - Pre-commit: `npx jest --testPathPattern lut-browse --verbose`

- [ ] 16. Adjustment Sliders Pipeline
  **What to do**:
  - RED: Write tests first for slider state changes and pipeline ordering
    - Temperature is applied before brightness
    - Brightness before contrast, contrast before saturation, saturation before LUT, LUT before sharpen
    - Slider changes update the correct shader uniform / render params
  - GREEN:
    - Build adjustment controls for temperature, brightness, contrast, saturation, LUT intensity, and sharpen
    - Wire each slider to the GPU/CPU engine parameter pipeline in the exact order `temp→bright→contrast→sat→LUT→sharpen`
    - Keep values normalized and reversible through `EditState`
    - Update preview rendering live as slider values change
  - REFACTOR:
    - Extract adjustment config metadata and default ranges into `src/editor/adjustments/config.ts`
  **Must NOT do**:
  - Do NOT change the documented operation order
  - Do NOT hardcode logic separately in GPU and CPU codepaths if shared parameter plumbing can be reused
  - Do NOT add extra filters beyond the approved set
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is a UI-heavy task sitting directly on top of render-engine contracts and order-of-operations correctness.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T15, T17-T19)
  - **Blocks**: None
  - **Blocked By**: T8, T14
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:42`
  - `PLAN.md:77` — core slider feature set
  - `PLAN.md:374,419` — explicit operation order requirement
  - `.sisyphus/plans/lut-app-v2.md:638` — existing type-contract reference to slider order
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern adjustment-sliders --verbose` passes
  - [ ] Slider order is documented and enforced in code/tests
  - [ ] All six controls update render params correctly
  - [ ] Live preview updates on slider movement
  **QA Scenarios**:
  ```
  Scenario: Slider order matches documented render pipeline
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern adjustment-sliders --verbose`
      2. Assert pipeline-order test passes
      3. Assert uniform/param mapping tests pass for all controls
    Expected Result: Adjustment stack matches the agreed Lightroom-style order
    Evidence: .sisyphus/evidence/task-16-slider-order.txt

  Scenario: Invalid slider state does not corrupt render params
    Tool: Bash
    Steps:
      1. Run test with out-of-range or rapid successive slider inputs
      2. Assert values are clamped/normalized
      3. Assert preview update path remains stable
    Expected Result: Slider spam or invalid values do not break rendering
    Evidence: .sisyphus/evidence/task-16-slider-clamp.txt
  ```
  **Commit**: YES
  - Message: `feat(editor): add adjustment slider pipeline`
  - Files: `src/screens/editor/adjustments/AdjustmentPanel.tsx, src/screens/editor/adjustments/config.ts, src/screens/editor/adjustments/__tests__/adjustment-sliders.test.tsx`
  - Pre-commit: `npx jest --testPathPattern adjustment-sliders --verbose`

- [ ] 17. Before/After Comparison
  **What to do**:
  - RED: Write tests first for the chosen comparison interaction model
  - GREEN:
    - Implement before/after comparison as an in-editor gesture-based interaction (hold-to-compare or explicit toggle; if split-screen is chosen, keep it lightweight)
    - Ensure the user can momentarily view the original image without losing current edits
    - Keep the interaction discoverable and non-destructive
  - REFACTOR:
    - Encapsulate comparison state in a dedicated hook/component so it does not pollute core editor state
  **Must NOT do**:
  - Do NOT reset or mutate edit state when entering compare mode
  - Do NOT navigate away from the editor for comparison
  - Do NOT introduce a permanently confusing interaction model
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is a UX-sensitive editor gesture/interaction feature.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T15, T16, T18, T19)
  - **Blocks**: None
  - **Blocked By**: T14
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:43`
  - `PLAN.md:262` — before/after accepted scope expansion
  - `PLAN.md:352` — design ambiguity around interaction model
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern before-after --verbose` passes
  - [ ] Compare interaction shows original image without losing edits
  - [ ] Interaction returns cleanly to edited preview on release/toggle off
  **QA Scenarios**:
  ```
  Scenario: Hold/toggle compare shows original image
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern before-after --verbose`
      2. Assert compare-on interaction renders original source
      3. Assert compare-off returns to edited preview
    Expected Result: Before/after works without state loss
    Evidence: .sisyphus/evidence/task-17-before-after.txt

  Scenario: Compare interaction is non-destructive
    Tool: Bash
    Steps:
      1. Run test with edited image state and active LUT
      2. Enter compare mode and exit
      3. Assert prior edit state is unchanged
    Expected Result: Compare mode never mutates edit history
    Evidence: .sisyphus/evidence/task-17-before-after-state.txt
  ```
  **Commit**: YES
  - Message: `feat(editor): add before after comparison`
  - Files: `src/screens/editor/compare/BeforeAfterOverlay.tsx, src/screens/editor/compare/useBeforeAfter.ts, src/screens/editor/compare/__tests__/before-after.test.tsx`
  - Pre-commit: `npx jest --testPathPattern before-after --verbose`

- [ ] 18. Crop Tool + Aspect Ratios
  **What to do**:
  - RED: Write tests first for crop ratio selection, pan/zoom constraints, and preview application
  - GREEN:
    - Implement crop UI with aspect presets `1:1`, `4:3`, `16:9`, and `free`
    - Support pan/zoom gestures and a visible crop frame
    - Keep crop preview integrated with the editor preview path
    - Save crop state into immutable `EditState`
  - REFACTOR:
    - Separate gesture math, crop state, and rendering overlay components
  **Must NOT do**:
  - Do NOT destructively rewrite the original image file during editing
  - Do NOT allow crop box math to exceed image bounds
  - Do NOT omit the freeform option
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is a gesture-heavy editor tool with tight preview integration.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T15-T17, T19)
  - **Blocks**: None
  - **Blocked By**: T11, T14
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:44`
  - `PLAN.md:79` — crop tool scope
  - `PLAN.md:290` — edge-case guidance: min crop size, gesture correctness
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern crop-tool --verbose` passes
  - [ ] All four aspect modes are supported
  - [ ] Crop state persists in `EditState`
  - [ ] Crop preview respects image bounds
  **QA Scenarios**:
  ```
  Scenario: User selects aspect ratio and previews crop
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern crop-tool --verbose`
      2. Assert ratio selection tests pass
      3. Assert crop preview updates when pan/zoom changes
    Expected Result: Crop UI behaves predictably across aspect presets
    Evidence: .sisyphus/evidence/task-18-crop-ratios.txt

  Scenario: Crop bounds are enforced
    Tool: Bash
    Steps:
      1. Run test with aggressive pan/zoom input
      2. Assert crop box never exceeds image bounds
      3. Assert invalid crop state is clamped
    Expected Result: Crop math stays safe under edge inputs
    Evidence: .sisyphus/evidence/task-18-crop-bounds.txt
  ```
  **Commit**: YES
  - Message: `feat(editor): add crop tool and aspect ratios`
  - Files: `src/screens/editor/crop/CropOverlay.tsx, src/screens/editor/crop/useCropState.ts, src/screens/editor/crop/__tests__/crop-tool.test.tsx`
  - Pre-commit: `npx jest --testPathPattern crop-tool --verbose`

- [ ] 19. Undo/Redo (Immutable EditState)
  **What to do**:
  - RED: Write tests first for history push/pop behavior, depth limit, and memory budget trimming
  - GREEN:
    - Implement immutable `EditState` history with undo/redo support
    - Enforce depth limit of 20 snapshots
    - Store lightweight snapshots/patch-friendly state rather than duplicating full image buffers where possible
    - Clear redo stack on divergent new edits
    - Integrate with editor actions (LUT apply, slider updates, crop changes)
  - REFACTOR:
    - Move history logic into dedicated `src/state/edit-history/`
    - Add helpers to estimate memory footprint and trim history safely
  **Must NOT do**:
  - Do NOT mutate history entries in place
  - Do NOT retain unbounded edit history
  - Do NOT store heavyweight image data redundantly in every snapshot
  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Why**: This is architecture/state work with correctness and memory constraints.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T15-T18)
  - **Blocks**: None
  - **Blocked By**: T6, T14
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:45`
  - `PLAN.md:263` — undo/redo accepted scope expansion
  - `PLAN.md:368` — EditState shape/depth/memory gap
  - `.sisyphus/plans/lut-app-v2.md:608-616` — existing `EditState` and error type contracts
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern edit-history --verbose` passes
  - [ ] Undo/redo works across LUT, slider, and crop changes
  - [ ] History depth is capped at 20
  - [ ] Redo stack clears correctly after new divergent edits
  - [ ] Memory-budget trimming is documented and tested
  **QA Scenarios**:
  ```
  Scenario: Undo and redo replay editor changes correctly
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern edit-history --verbose`
      2. Assert undo/redo tests pass for LUT, adjustment, and crop edits
      3. Assert final replayed state matches expected snapshot
    Expected Result: Edit history behaves predictably and immutably
    Evidence: .sisyphus/evidence/task-19-undo-redo.txt

  Scenario: History limit trims older states safely
    Tool: Bash
    Steps:
      1. Run test that pushes >20 edit snapshots
      2. Assert oldest entries are dropped
      3. Assert memory estimate stays within budget and current state remains valid
    Expected Result: History remains bounded without corrupting current edits
    Evidence: .sisyphus/evidence/task-19-history-limit.txt
  ```
  **Commit**: YES
  - Message: `feat(state): add immutable edit history with undo redo`
  - Files: `src/state/edit-history/history.ts, src/state/edit-history/__tests__/edit-history.test.ts, src/state/edit-history/memory-budget.ts`
  - Pre-commit: `npx jest --testPathPattern edit-history --verbose`

### Wave 4: AI + Monetization

- [ ] 20. AI Style Transfer Service
  **What to do**:
  - RED: Write tests first for structured-result→LUT generation pipeline
    - Valid `AIStyleResult` maps into generated LUT values
    - Generated LUT encodes into 2D strip via T5 encoder
    - API/network failures surface actionable errors
    - Service rejects invalid/missing structured output
  - GREEN:
    - Build production AI style transfer service in `src/ai/service/`
    - Call the proven structured-output path from T12
    - Convert style profile attributes into generated LUT values/colors
    - Encode the generated LUT into the same 2D strip format used by the shader/CPU engines
    - Return a preview-ready result that can be fed directly into the editor renderer
    - Add internet/offline and rate/error handling
  - REFACTOR:
    - Separate network client, style-to-LUT transform, and strip-encoding orchestration
  **Must NOT do**:
  - Do NOT bypass structured validation from T12
  - Do NOT return free-form text to the UI
  - Do NOT couple service code to a single UI screen
  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`documentation-lookup`]
  - **Why**: This is the core AI monetization backend in app code and needs correctness plus resilience.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T22, T23)
  - **Blocks**: T21
  - **Blocked By**: T12, T3, T5
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:48`
  - `.sisyphus/plans/lut-app-v2.md:80,91` — AI style transfer as core deliverable/DoD
  - `PLAN.md:212-214` — original deferred AI/color transfer context
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern ai-style-service --verbose` passes
  - [ ] Structured Gemini result is converted into generated LUT values
  - [ ] Generated LUT is encoded as a 2D strip and accepted by render pipeline
  - [ ] Error states are explicit for API/network/schema failures
  **QA Scenarios**:
  ```
  Scenario: Structured AI result generates renderable LUT strip
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern ai-style-service --verbose`
      2. Assert style-to-LUT conversion test passes
      3. Assert encoded strip dimensions and metadata are valid
    Expected Result: AI service returns renderer-compatible LUT output
    Evidence: .sisyphus/evidence/task-20-ai-style-service.txt

  Scenario: AI request failure returns actionable error
    Tool: Bash
    Steps:
      1. Run test with mocked network/API failure
      2. Assert service returns explicit failure type
      3. Assert retry/recovery metadata is attached for UI layer
    Expected Result: AI failures can be handled without corrupting editor state
    Evidence: .sisyphus/evidence/task-20-ai-service-failure.txt
  ```
  **Commit**: YES
  - Message: `feat(ai): add style transfer service`
  - Files: `src/ai/service/style-transfer.ts, src/ai/service/style-to-lut.ts, src/ai/service/__tests__/ai-style-service.test.ts`
  - Pre-commit: `npx jest --testPathPattern ai-style-service --verbose`

- [ ] 21. AI Style Transfer UI
  **What to do**:
  - RED: Write tests first for reference-photo pick, loading state, preview state, and apply/discard actions
  - GREEN:
    - Add in-editor or adjacent flow for selecting a reference photo for AI style transfer
    - Show loading/progress state while AI style generation runs
    - Present generated LUT preview over the current image
    - Allow the user to apply the generated style or discard it cleanly
  - REFACTOR:
    - Keep AI UI state local and transient until the user explicitly applies the generated LUT
  **Must NOT do**:
  - Do NOT auto-commit generated AI edits without user confirmation
  - Do NOT hide loading/error states
  - Do NOT expose this UI to free-tier users before T24 gating
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is a high-visibility product feature with complex async UI states.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T22, T23)
  - **Blocks**: T24
  - **Blocked By**: T20, T14
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:49`
  - `.sisyphus/plans/lut-app-v2.md:11,80` — AI style transfer is a launch deliverable
  - `PLAN.md:349-350` — loading/error states were previously underspecified
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern ai-style-ui --verbose` passes
  - [ ] Reference photo can be selected for AI style generation
  - [ ] Loading, success preview, discard, and apply states all render
  - [ ] Apply action commits generated LUT into editor state
  **QA Scenarios**:
  ```
  Scenario: User previews AI-generated style and applies it
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern ai-style-ui --verbose`
      2. Assert loading state test passes
      3. Assert apply/discard actions update UI and editor state correctly
    Expected Result: AI style flow is explicit, previewable, and user-controlled
    Evidence: .sisyphus/evidence/task-21-ai-ui.txt

  Scenario: AI generation error is visible and recoverable
    Tool: Bash
    Steps:
      1. Run UI test with mocked AI service failure
      2. Assert error state is shown
      3. Assert retry or cancel path remains available
    Expected Result: Failed AI requests do not strand the user
    Evidence: .sisyphus/evidence/task-21-ai-ui-error.txt
  ```
  **Commit**: YES
  - Message: `feat(ai): add style transfer ui`
  - Files: `src/screens/editor/ai/AIStylePanel.tsx, src/screens/editor/ai/__tests__/ai-style-ui.test.tsx`
  - Pre-commit: `npx jest --testPathPattern ai-style-ui --verbose`

- [ ] 22. RevenueCat Subscription Setup
  **What to do**:
  - RED: Write tests first for entitlement mapping, sandbox product loading, and restore behavior scaffolding
  - GREEN:
    - Install/configure `react-native-purchases`
    - Define three products: monthly, yearly, lifetime
    - Implement entitlement fetch and signed-cache-backed status handling through RevenueCat SDK
    - Build restore-purchases plumbing and sandbox verification path
    - Expose subscription state through a dedicated service/store
  - REFACTOR:
    - Isolate RevenueCat client code from UI components
    - Keep entitlement mapping strongly typed with T6 subscription types
  **Must NOT do**:
  - Do NOT store purchase state in a local boolean/AsyncStorage-only shortcut
  - Do NOT hardcode sandbox assumptions into production logic
  - Do NOT build paywall UI in this task
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is a revenue-critical native integration with entitlement/security requirements.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T20, T23)
  - **Blocks**: T23, T24
  - **Blocked By**: T1
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:50`
  - `.sisyphus/plans/lut-app-v2.md:52,62,112` — RevenueCat abstraction and entitlement constraints
  - `PLAN.md:40,49,99-105,130,165` — original RevenueCat architecture and store flow
  - `PLAN.md:372,377,385,414` — signed-cache entitlement and key-storage concerns
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern subscription-service --verbose` passes
  - [ ] Monthly/yearly/lifetime products are defined in typed config
  - [ ] Entitlement status is sourced from RevenueCat SDK-backed state
  - [ ] Restore flow plumbing exists and is test-covered
  **QA Scenarios**:
  ```
  Scenario: RevenueCat entitlements map into app subscription state
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern subscription-service --verbose`
      2. Assert entitlement mapping tests pass
      3. Assert free/monthly/yearly/lifetime states resolve correctly
    Expected Result: App derives subscription state from RevenueCat-backed entitlements
    Evidence: .sisyphus/evidence/task-22-revenuecat-entitlements.txt

  Scenario: Restore purchases path is available
    Tool: Bash
    Steps:
      1. Run test with mocked restore response from RevenueCat
      2. Assert app state updates to restored entitlement
      3. Assert error path is handled when restore fails
    Expected Result: Restore behavior is wired before UI polish
    Evidence: .sisyphus/evidence/task-22-restore-purchases.txt
  ```
  **Commit**: YES
  - Message: `feat(iap): add revenuecat subscription setup`
  - Files: `src/subscription/revenuecat-client.ts, src/subscription/subscription-service.ts, src/subscription/__tests__/subscription-service.test.ts`
  - Pre-commit: `npx jest --testPathPattern subscription-service --verbose`

- [ ] 23. Paywall / Subscription UI
  **What to do**:
  - RED: Write tests first for tier rendering, CTA actions, and restore button visibility
  - GREEN:
    - Build paywall screen/modal with feature comparison, pricing tiers, and CTA buttons
    - Include monthly/yearly/lifetime display, restore purchases action, and clear PRO value framing (AI style + no ads)
    - Use dark-first visual system from T7
  - REFACTOR:
    - Separate pricing-card component(s), paywall copy/content config, and screen container
  **Must NOT do**:
  - Do NOT hardcode subscription state locally in the UI
  - Do NOT omit restore purchases
  - Do NOT leave pricing labels ambiguous
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is the main conversion screen and needs strong visual clarity plus accurate purchase wiring.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T20, T22)
  - **Blocks**: T24
  - **Blocked By**: T22, T7
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:51`
  - `PLAN.md:348` — paywall design is a critical design gap
  - `PLAN.md:100,166` — restore purchases requirement
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern paywall --verbose` passes
  - [ ] All three tiers render with pricing placeholders/config
  - [ ] Restore purchases button is visible and wired
  - [ ] CTA buttons trigger subscription service hooks/callbacks
  **QA Scenarios**:
  ```
  Scenario: Paywall renders all plans and restore action
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern paywall --verbose`
      2. Assert monthly/yearly/lifetime cards render
      3. Assert restore purchases button test passes
    Expected Result: Conversion UI is complete and actionable
    Evidence: .sisyphus/evidence/task-23-paywall-ui.txt

  Scenario: Purchase CTA handles loading/error state
    Tool: Bash
    Steps:
      1. Run UI test with mocked purchase request pending then failing
      2. Assert loading state appears
      3. Assert error message/retry path appears on failure
    Expected Result: Purchase flow failures are visible and recoverable
    Evidence: .sisyphus/evidence/task-23-paywall-error.txt
  ```
  **Commit**: YES
  - Message: `feat(iap): add paywall subscription ui`
  - Files: `src/screens/paywall/PaywallScreen.tsx, src/screens/paywall/PricingCard.tsx, src/screens/paywall/__tests__/paywall.test.tsx`
  - Pre-commit: `npx jest --testPathPattern paywall --verbose`

- [ ] 24. Free/PRO Gating + Ads
  **What to do**:
  - RED: Write tests first for feature gating and ad visibility
    - AI feature is blocked for free users
    - PRO users do not see bottom banner ads
    - Free users do see ads in approved surfaces
  - GREEN:
    - Wire entitlement checks from T22 into the editor/AI surfaces
    - Gate AI style transfer entry points for free users and route them to the paywall
    - Show AdMob banner for free users only
    - Hide ads for PRO users across gated surfaces
  - REFACTOR:
    - Centralize gating rules in `src/subscription/gating.ts`
  **Must NOT do**:
  - Do NOT gate free LUTs or core editing tools
  - Do NOT use a local boolean shortcut for PRO state
  - Do NOT scatter gating logic across many unrelated components
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`react-native-dev`]
  - **Why**: This combines revenue-critical entitlement logic with ad monetization behavior.
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4
  - **Blocks**: Wave 5
  - **Blocked By**: T13, T22, T23
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:52,89-92`
  - `.sisyphus/plans/lut-app-v2.md:12-13,27-29,103,113` — monetization policy and must-not-have guardrails
  - `PLAN.md:163-166` — legacy free/paid split to explicitly avoid reintroducing
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern gating --verbose` passes
  - [ ] Free users are routed to paywall for AI feature access
  - [ ] PRO users do not see banner ads
  - [ ] Free users still retain all core LUT/editing functionality
  **QA Scenarios**:
  ```
  Scenario: Free user is gated from AI and shown paywall
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern gating --verbose`
      2. Assert free entitlement cannot open AI flow directly
      3. Assert paywall route/modal is triggered instead
    Expected Result: AI remains PRO-only without blocking the core editor
    Evidence: .sisyphus/evidence/task-24-free-gating.txt

  Scenario: PRO user sees no ads
    Tool: Bash
    Steps:
      1. Run test with PRO entitlement state
      2. Assert banner slot does not render
      3. Assert AI entry remains available
    Expected Result: PRO entitlement removes ads and unlocks AI
    Evidence: .sisyphus/evidence/task-24-pro-no-ads.txt
  ```
  **Commit**: YES
  - Message: `feat(iap): add pro gating and free tier ads`
  - Files: `src/subscription/gating.ts, src/subscription/__tests__/gating.test.ts, src/screens/editor/ai/AIEntryGate.tsx`
  - Pre-commit: `npx jest --testPathPattern gating --verbose`

### Wave 5: Content + Polish

- [ ] 25. LUT Catalog Bundle
  **What to do**:
  - RED: Write tests first for metadata loading, category grouping, and thumbnail/catalog lookup
  - GREEN:
    - Bundle 50-100 LUT assets in `assets/luts/` as pre-converted HaldCLUT PNGs
    - Create metadata JSON containing id, display name, category, asset path, and thumbnail path
    - Organize LUTs into categories appropriate for browse UI
    - Prefer pre-generated thumbnails/build artifacts to avoid first-launch thumbnail generation freezes
    - Ensure naming follows mood/style descriptors rather than trademarked brand names
  - REFACTOR:
    - Keep catalog metadata loading separate from editor UI components
  **Must NOT do**:
  - Do NOT reintroduce paid/free LUT splits
  - Do NOT ship trademarked brand names as preset names
  - Do NOT generate all thumbnails on first app launch if build-time assets are available
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Why**: This is content packaging and metadata discipline with asset-size/perf implications.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T26-T30)
  - **Blocks**: None
  - **Blocked By**: T15
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:55,88-97`
  - `.sisyphus/plans/lut-app-v2.md:29,78,113` — all LUTs free
  - ByteRover memory: mood/style naming and free-catalog packaging guidance
  - `tools/cube_to_hald.py` — source conversion tool for pre-bundling pipeline
  **Acceptance Criteria**:
  - [ ] Metadata tests pass with `npx jest --testPathPattern lut-catalog --verbose`
  - [ ] 50-100 LUT entries exist with category metadata
  - [ ] All asset paths resolve
  - [ ] Naming avoids trademarked camera/film brands
  **QA Scenarios**:
  ```
  Scenario: LUT catalog metadata loads and groups correctly
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern lut-catalog --verbose`
      2. Assert metadata loader test passes
      3. Assert category grouping returns expected sections
    Expected Result: Bundled LUT catalog is usable by browse UI
    Evidence: .sisyphus/evidence/task-25-lut-catalog.txt

  Scenario: Asset metadata contains no broken references
    Tool: Bash
    Steps:
      1. Run test or script that resolves each LUT asset/thumbnail path
      2. Assert no missing file errors
      3. Assert total bundled count is within target range
    Expected Result: Catalog bundle is internally consistent
    Evidence: .sisyphus/evidence/task-25-lut-assets.txt
  ```
  **Commit**: YES
  - Message: `feat(catalog): bundle lut catalog assets and metadata`
  - Files: `assets/luts/*, src/catalog/luts.json, src/catalog/load-lut-catalog.ts, src/catalog/__tests__/lut-catalog.test.ts`
  - Pre-commit: `npx jest --testPathPattern lut-catalog --verbose`

- [ ] 26. Settings Screen
  **What to do**:
  - RED: Write tests first for language toggle, restore purchases, manage subscription, and version rendering
  - GREEN:
    - Build settings screen with language toggle, about section, restore purchases, manage subscription, and version info
    - Wire restore/manage actions to subscription service
    - Present current app version/build info
  - REFACTOR:
    - Keep settings item config separate from rendering component
  **Must NOT do**:
  - Do NOT bury restore purchases behind multiple submenus
  - Do NOT hardcode version text
  - Do NOT duplicate subscription logic in the UI layer
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is user-facing polish with important monetization/account recovery paths.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T25, T27-T30)
  - **Blocks**: None
  - **Blocked By**: Wave 4 done
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:56`
  - `PLAN.md:104` — settings scope
  - `PLAN.md:166-167` — restore purchases is required
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern settings-screen --verbose` passes
  - [ ] Language toggle renders and updates state
  - [ ] Restore/manage subscription actions are visible
  - [ ] Version/build text is sourced from config/app metadata
  **QA Scenarios**:
  ```
  Scenario: Settings screen exposes language and subscription actions
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern settings-screen --verbose`
      2. Assert toggle and action row tests pass
      3. Assert version text is rendered
    Expected Result: Settings screen covers required recovery and info actions
    Evidence: .sisyphus/evidence/task-26-settings-screen.txt

  Scenario: Restore purchase action handles failure
    Tool: Bash
    Steps:
      1. Run test with mocked restore failure
      2. Assert error feedback is shown
      3. Assert user can retry or back out
    Expected Result: Restore failures are not silent
    Evidence: .sisyphus/evidence/task-26-restore-failure.txt
  ```
  **Commit**: YES
  - Message: `feat(settings): add settings screen and subscription actions`
  - Files: `src/screens/settings/SettingsScreen.tsx, src/screens/settings/__tests__/settings-screen.test.tsx`
  - Pre-commit: `npx jest --testPathPattern settings-screen --verbose`

- [ ] 27. Localization (vi + en)
  **What to do**:
  - RED: Write tests first for translation loading, fallback behavior, and externalized strings
  - GREEN:
    - Add `react-i18next` setup with Vietnamese and English resource files
    - Externalize all visible UI strings into translation JSON files
    - Wire language switching through settings
    - Use Vietnamese as primary/default locale unless device/user selection says otherwise
  - REFACTOR:
    - Group translation namespaces by feature/screen for maintainability
  **Must NOT do**:
  - Do NOT leave hardcoded user-facing strings in screen components
  - Do NOT ship only partial coverage for one locale
  - Do NOT tie localization setup to a single screen
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Why**: This is a focused infrastructure/content externalization task.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T25, T26, T28-T30)
  - **Blocks**: None
  - **Blocked By**: Wave 4 done
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:57`
  - `.sisyphus/plans/lut-app-v2.md:14,83,97` — vi+en deliverable and DoD
  - `PLAN.md:102-105,168-173` — original i18n setup guidance
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern i18n --verbose` passes
  - [ ] Vietnamese and English resource files exist and load
  - [ ] UI strings are externalized for all current screens/components
  - [ ] Settings-driven language switch updates rendered copy
  **QA Scenarios**:
  ```
  Scenario: App loads Vietnamese and English translations
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern i18n --verbose`
      2. Assert translation load tests pass
      3. Assert fallback behavior works for missing keys
    Expected Result: Both locales are available and stable
    Evidence: .sisyphus/evidence/task-27-i18n.txt

  Scenario: Hardcoded strings are caught
    Tool: Bash
    Steps:
      1. Run a source scan/test for visible string usage outside translation helpers/resources
      2. Assert known screen files no longer contain hardcoded labels
      3. Fail if untranslated UI copy remains
    Expected Result: UI copy is fully externalized
    Evidence: .sisyphus/evidence/task-27-hardcoded-string-scan.txt
  ```
  **Commit**: YES
  - Message: `feat(i18n): add vietnamese and english localization`
  - Files: `src/i18n/index.ts, src/i18n/locales/vi/*.json, src/i18n/locales/en/*.json, src/i18n/__tests__/i18n.test.ts`
  - Pre-commit: `npx jest --testPathPattern i18n --verbose`

- [ ] 28. Import Hardening
  **What to do**:
  - RED: Write tests first for oversize files, invalid PNG dimensions, content URI sanitization, and path traversal rejection
  - GREEN:
    - Enforce import file size limit `<10MB`
    - Pre-check PNG dimensions before full decode
    - Sanitize Android content URIs and reject traversal/unsafe paths
    - Validate import inputs before parser/decode work begins
  - REFACTOR:
    - Centralize import guardrails into `src/import/validate-import.ts`
  **Must NOT do**:
  - Do NOT decode untrusted PNGs before checking dimensions
  - Do NOT trust Android content URIs blindly
  - Do NOT accept oversize files just because parsing “might work”
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`security-review`]
  - **Why**: This is directly about input validation, memory safety, and filesystem attack surface.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T25-T27, T29-T30)
  - **Blocks**: T31, T36
  - **Blocked By**: Wave 4 done
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:58`
  - `PLAN.md:249-254` — failure registry for LUT/import/OOM paths
  - `PLAN.md:289` — file size validation + path sanitization decision
  - `PLAN.md:376,378,417` — content URI traversal and pre-decode PNG dimension checks
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern import-hardening --verbose` passes
  - [ ] Files >10MB are rejected
  - [ ] PNG dimension check happens before full decode
  - [ ] Unsafe Android content URIs/paths are rejected
  **QA Scenarios**:
  ```
  Scenario: Oversized import is rejected safely
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern import-hardening --verbose`
      2. Assert oversized file test passes
      3. Assert returned error maps to `FileTooLarge`
    Expected Result: Large inputs fail fast without OOM risk
    Evidence: .sisyphus/evidence/task-28-file-too-large.txt

  Scenario: Path traversal via content URI is blocked
    Tool: Bash
    Steps:
      1. Run test with malicious/unsafe Android content URI
      2. Assert validation rejects it before file access
      3. Assert descriptive import error is returned
    Expected Result: Import path traversal is prevented
    Evidence: .sisyphus/evidence/task-28-content-uri-sanitization.txt
  ```
  **Commit**: YES
  - Message: `fix(import): harden file validation and uri sanitization`
  - Files: `src/import/validate-import.ts, src/import/__tests__/import-hardening.test.ts`
  - Pre-commit: `npx jest --testPathPattern import-hardening --verbose`

- [ ] 29. Rescue UX for Critical Failure Modes
  **What to do**:
  - RED: Write tests first for error-to-UI mapping and recovery action rendering
  - GREEN:
    - Build rescue UX for the six critical failure modes required by the revised plan:
      - `UnsupportedLUTSize`
      - `FileTooLarge`
      - `InvalidHaldFormat`
      - `ShaderCompileError`
      - `OOM`
      - `ExportFailure`
    - For each case, provide:
      - Human-readable explanation
      - Recommended recovery action
      - Non-crashing path back to the editor/import flow
    - Add reusable error banner/modal component(s) and error-copy mapping
  - REFACTOR:
    - Keep error taxonomy and presentation mapping in a dedicated module
  **Must NOT do**:
  - Do NOT surface raw stack traces to users
  - Do NOT leave any of the six failure modes without a recovery action
  - Do NOT crash the app for these known states
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is UX resilience work directly tied to review findings and error handling.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T25-T28, T30)
  - **Blocks**: T31
  - **Blocked By**: Wave 4 done
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:59`
  - `.sisyphus/plans/lut-app-v2.md:45,94,104` — six critical failure modes and rescue UX DoD
  - `PLAN.md:243-258` — error/rescue registry and failure table
  - `PLAN.md:288` — rescue all critical gaps
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern rescue-ux --verbose` passes
  - [ ] All six required failure modes map to user-facing rescue UI
  - [ ] Each rescue state includes an explicit recovery action
  - [ ] No known critical failure path crashes the app directly
  **QA Scenarios**:
  ```
  Scenario: All six critical errors render rescue UI
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern rescue-ux --verbose`
      2. Assert all six error mapping tests pass
      3. Assert each rendered state includes copy + recovery CTA
    Expected Result: Known failures are recoverable and visible
    Evidence: .sisyphus/evidence/task-29-rescue-ux.txt

  Scenario: Unknown error falls back safely
    Tool: Bash
    Steps:
      1. Run test with unmapped generic error
      2. Assert generic safe fallback UI renders
      3. Assert app remains usable after dismissal
    Expected Result: Even unexpected errors degrade safely
    Evidence: .sisyphus/evidence/task-29-generic-fallback.txt
  ```
  **Commit**: YES
  - Message: `feat(ux): add rescue flows for critical failure modes`
  - Files: `src/errors/error-to-ui.ts, src/components/ux/RescueState.tsx, src/errors/__tests__/rescue-ux.test.tsx`
  - Pre-commit: `npx jest --testPathPattern rescue-ux --verbose`

- [ ] 30. Onboarding + Empty States
  **What to do**:
  - RED: Write tests first for first-run onboarding visibility and empty states for missing content
  - GREEN:
    - Add first-time onboarding/tutorial flow (2-3 slides max)
    - Add empty states for:
      - No photo selected yet
      - No LUTs available / failed catalog load
      - No recent content if that surface exists
    - Keep copy concise and dark-theme aligned
  - REFACTOR:
    - Store onboarding-complete flag in settings/preferences service
  **Must NOT do**:
  - Do NOT build a long multi-step marketing funnel here
  - Do NOT leave first-run or no-content screens blank
  - Do NOT block the user from reaching the editor once onboarding is dismissed
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is polish and first-run UX work with direct review feedback behind it.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T25-T29)
  - **Blocks**: None
  - **Blocked By**: Wave 4 done
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:60`
  - `PLAN.md:266,296,316,350` — onboarding and empty-state design gaps
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern onboarding --verbose` passes
  - [ ] First-run onboarding is shown once and can be dismissed
  - [ ] Empty states exist for no photo and no LUT/catalog scenarios
  - [ ] Onboarding completion persists across app restarts
  **QA Scenarios**:
  ```
  Scenario: First-time user sees onboarding once
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern onboarding --verbose`
      2. Assert onboarding shows when no completion flag exists
      3. Assert dismissal stores completion and suppresses future display
    Expected Result: Onboarding is helpful but non-repetitive
    Evidence: .sisyphus/evidence/task-30-onboarding.txt

  Scenario: Empty editor/catalog states are informative
    Tool: Bash
    Steps:
      1. Run test with no selected photo and empty catalog data
      2. Assert empty-state components render
      3. Assert CTA guidance is visible
    Expected Result: Blank states are replaced with clear guidance
    Evidence: .sisyphus/evidence/task-30-empty-states.txt
  ```
  **Commit**: YES
  - Message: `feat(ux): add onboarding and empty states`
  - Files: `src/screens/onboarding/OnboardingScreen.tsx, src/components/ux/EmptyState.tsx, src/screens/onboarding/__tests__/onboarding.test.tsx`
  - Pre-commit: `npx jest --testPathPattern onboarding --verbose`

- [ ] 31. E2E Tests (Detox — Core Flow)
  **What to do**:
  - RED: Write Detox scenarios for core editor flow and error recovery flow
  - GREEN:
    - Add Detox coverage for:
      - Pick photo → apply LUT → adjust → compare → export
      - Invalid/bad import → rescue UX shown
    - Ensure Android and iOS configs both run against the same critical path
    - Capture evidence artifacts/screens/logs for final verification reuse
  - REFACTOR:
    - Extract Detox helpers/page objects only if they reduce duplication clearly
  **Must NOT do**:
  - Do NOT use Playwright for this mobile E2E task
  - Do NOT stop at unit tests for core flow coverage
  - Do NOT skip the rescue/error flow
  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`e2e-testing`, `react-native-dev`]
  - **Why**: This is the first end-to-end mobile proof that the app actually works across systems.
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5
  - **Blocks**: Wave 6
  - **Blocked By**: T28, T29
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:61`
  - `.sisyphus/plans/lut-app-v2.md:127,136,786-787` — Detox is the required E2E framework
  - `PLAN.md:118,136` — E2E on real devices/simulators
  **Acceptance Criteria**:
  - [ ] `npx detox test -c android.emu.debug` passes core flow
  - [ ] `npx detox test -c ios.sim.debug` passes core flow
  - [ ] Error import → rescue UX scenario exists and passes
  - [ ] Evidence artifacts are saved for final review
  **QA Scenarios**:
  ```
  Scenario: Core editor flow passes on Detox
    Tool: Detox
    Steps:
      1. Launch app on test config
      2. Pick a photo
      3. Apply a LUT
      4. Change at least one adjustment slider
      5. Use before/after compare
      6. Export edited image
    Expected Result: End-to-end editor workflow completes successfully
    Evidence: .sisyphus/evidence/task-31-detox-core-flow/

  Scenario: Invalid import shows rescue UX
    Tool: Detox
    Steps:
      1. Launch app with malformed import fixture
      2. Attempt LUT import
      3. Assert rescue UI is shown instead of crash
      4. Dismiss/recover back to safe state
    Expected Result: Bad imports are handled gracefully on-device
    Evidence: .sisyphus/evidence/task-31-detox-error-flow/
  ```
  **Commit**: YES
  - Message: `test(e2e): add detox coverage for core editor flow`
  - Files: `e2e/core-flow.e2e.ts, e2e/error-flow.e2e.ts, detox.config.js`
  - Pre-commit: `npx detox test -c android.emu.debug`

### Wave 6: Release Hardening

- [ ] 32. Performance Profiling (12MP Images)
  **What to do**:
  - RED: Define measurable performance checks first (preview latency, export time, memory footprint)
  - GREEN:
    - Profile 12MP image preview and export paths
    - Measure GPU preview latency, CPU fallback cost, export duration, and approximate peak memory behavior
    - Identify bottlenecks in image pipeline, render pipeline, or export flow
    - Produce a short optimization report and targeted fixes list if thresholds are missed
  - REFACTOR:
    - Keep profiling harness/scripts separate from production code
  **Must NOT do**:
  - Do NOT claim perf is acceptable without measured numbers
  - Do NOT benchmark only tiny sample images
  - Do NOT ignore CPU fallback performance
  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Why**: This is measurement and bottleneck analysis work across the rendering stack.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T33-T36)
  - **Blocks**: None
  - **Blocked By**: Wave 5 done
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:64`
  - `.sisyphus/plans/lut-app-v2.md:16,84,95,190` — 12MP perf pressure is a central risk/DoD concern
  - `PLAN.md:117,180-182,190,293` — perf thresholds and optimization themes
  **Acceptance Criteria**:
  - [ ] Profiling report exists with measured preview/export timings
  - [ ] 12MP fixture is used for at least one benchmark path
  - [ ] CPU fallback and GPU preview are both measured
  - [ ] Evidence/logs are saved to `.sisyphus/evidence/task-32-*`
  **QA Scenarios**:
  ```
  Scenario: 12MP preview and export metrics are captured
    Tool: Bash
    Steps:
      1. Run profiling script or benchmark command against 12MP fixture
      2. Record preview render latency and export duration
      3. Save summary output
    Expected Result: Performance claims are backed by measured numbers
    Evidence: .sisyphus/evidence/task-32-performance-profile.txt

  Scenario: CPU fallback benchmark is recorded
    Tool: Bash
    Steps:
      1. Force CPU engine path for benchmark run
      2. Measure preview/export cost on same fixture
      3. Save comparison against GPU path
    Expected Result: CPU fallback performance is quantified, not assumed
    Evidence: .sisyphus/evidence/task-32-cpu-fallback-profile.txt
  ```
  **Commit**: YES
  - Message: `perf(engine): profile preview and export on 12mp images`
  - Files: `scripts/profile-render.ts, .sisyphus/evidence/task-32-performance-profile.txt`
  - Pre-commit: `node scripts/profile-render.ts`

- [ ] 33. Crash Reporting + Staged Rollout
  **What to do**:
  - RED: Write tests/config checks first for crash client initialization and environment gating
  - GREEN:
    - Integrate Sentry crash reporting
    - Ensure crash reporting is initialized safely for release builds
    - Add rollout/release notes documenting staged rollout expectations for Play Console
    - Capture DSN/config sourcing strategy without leaking secrets
  - REFACTOR:
    - Keep crash-reporting bootstrap isolated from app feature code
  **Must NOT do**:
  - Do NOT hardcode secrets/DSNs in committed source when env-driven config is possible
  - Do NOT skip staged rollout guidance for Android release
  - Do NOT couple Sentry config to development-only flows
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is release-safety infrastructure with a clear, bounded setup surface.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T32, T34-T36)
  - **Blocks**: None
  - **Blocked By**: Wave 5 done
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:65`
  - `PLAN.md:294-295` — Sentry and staged rollout accepted into release plan
  - `PLAN.md:313-314` — observability/deploy gaps
  **Acceptance Criteria**:
  - [ ] Crash reporting bootstrap code exists and is test-checked
  - [ ] Release/staged-rollout notes exist for Play Console rollout
  - [ ] DSN/config strategy is documented without exposing secrets
  **QA Scenarios**:
  ```
  Scenario: Crash reporting initializes in release-safe configuration
    Tool: Bash
    Steps:
      1. Run config/bootstrap test for crash reporting module
      2. Assert DSN/env lookup path is valid
      3. Assert no hardcoded secret is required in source test fixture
    Expected Result: Crash client can be enabled safely for release
    Evidence: .sisyphus/evidence/task-33-sentry-init.txt

  Scenario: Staged rollout checklist exists
    Tool: Bash
    Steps:
      1. Read rollout config/checklist artifact
      2. Assert staged rollout percentages/steps are documented
      3. Assert rollback note exists
    Expected Result: Release hardening includes a safe rollout plan
    Evidence: .sisyphus/evidence/task-33-staged-rollout.txt
  ```
  **Commit**: YES
  - Message: `chore(release): add crash reporting and rollout guidance`
  - Files: `src/observability/sentry.ts, docs/release/staged-rollout.md, src/observability/__tests__/sentry.test.ts`
  - Pre-commit: `npx jest --testPathPattern sentry --verbose`

- [ ] 34. App Icon + Splash Screen
  **What to do**:
  - RED: Add config/render checks first for icon/splash asset presence
  - GREEN:
    - Design and implement production app icon and splash screen assets for Android and iOS
    - Wire icon/splash configuration through Expo/app config
    - Ensure assets align with dark-first visual identity
  - REFACTOR:
    - Keep asset source files and generated/exported platform assets organized
  **Must NOT do**:
  - Do NOT leave placeholder Expo branding for release
  - Do NOT ship only one platform’s assets
  - Do NOT introduce a bright/light splash that clashes with app identity
  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`react-native-dev`]
  - **Why**: This is brand/visual release work with platform asset requirements.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T32, T33, T35, T36)
  - **Blocks**: None
  - **Blocked By**: Wave 5 done
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:66`
  - `PLAN.md:114` — original icon/splash task
  **Acceptance Criteria**:
  - [ ] Icon/splash assets exist for both platforms
  - [ ] App config references release assets instead of placeholders
  - [ ] Visual check artifact/screenshots are saved
  **QA Scenarios**:
  ```
  Scenario: Release icon and splash assets are configured
    Tool: Bash
    Steps:
      1. Inspect app config for icon and splash asset references
      2. Assert referenced files exist
      3. Save asset/config summary
    Expected Result: Release branding assets are wired for both platforms
    Evidence: .sisyphus/evidence/task-34-brand-assets.txt

  Scenario: No Expo placeholder branding remains
    Tool: Bash
    Steps:
      1. Search config/assets for default Expo placeholder references
      2. Assert none remain in release-facing config
      3. Save search results
    Expected Result: App branding is production-ready
    Evidence: .sisyphus/evidence/task-34-no-placeholder-branding.txt
  ```
  **Commit**: YES
  - Message: `feat(brand): add app icon and splash screen assets`
  - Files: `assets/branding/*, app.config.ts`
  - Pre-commit: `npx expo config --type public`

- [ ] 35. Store Prep (Privacy, Permissions, Metadata)
  **What to do**:
  - RED: Define a checklist first for store-readiness artifacts
  - GREEN:
    - Draft privacy policy aligned to actual app behavior
    - Add clear permission usage text for photo library/image access
    - Prepare store screenshots and metadata/copy placeholders
    - Document both Android and iOS store submission asset/copy requirements
  - REFACTOR:
    - Keep store collateral in a dedicated release/docs area
  **Must NOT do**:
  - Do NOT claim data practices the app does not actually implement
  - Do NOT omit permission rationale text
  - Do NOT leave policy/store copy buried in ad hoc notes
  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: []
  - **Why**: This is documentation/collateral work rather than feature implementation.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T32-T34, T36)
  - **Blocks**: None
  - **Blocked By**: Wave 5 done
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:67`
  - `PLAN.md:111-112,120,197-201` — permission/privacy/store blockers
  **Acceptance Criteria**:
  - [ ] Privacy policy draft exists
  - [ ] Permission usage text exists for photo access flows
  - [ ] Store metadata checklist/screenshots plan exists
  - [ ] Release docs live in a predictable repo location
  **QA Scenarios**:
  ```
  Scenario: Store-prep documents cover privacy and permissions
    Tool: Bash
    Steps:
      1. Read privacy policy and permission text files
      2. Assert both Android and iOS photo access reasons are covered
      3. Save checklist summary
    Expected Result: Store submission docs match actual app behavior
    Evidence: .sisyphus/evidence/task-35-store-docs.txt

  Scenario: Store asset checklist is complete
    Tool: Bash
    Steps:
      1. Inspect release/store metadata checklist
      2. Assert screenshots, metadata, and policy links are listed
      3. Save verification summary
    Expected Result: Submission prep is actionable, not vague
    Evidence: .sisyphus/evidence/task-35-store-checklist.txt
  ```
  **Commit**: YES
  - Message: `docs(release): add store prep and privacy materials`
  - Files: `docs/release/privacy-policy.md, docs/release/permissions.md, docs/release/store-checklist.md`
  - Pre-commit: `npx markdownlint-cli docs/release/*.md`

- [ ] 36. LUT Import from Device (.cube + .png)
  **What to do**:
  - RED: Write tests first for file picker flow, parse/validate branches, and persistence
  - GREEN:
    - Add file picker flow for importing `.cube` and `.png` LUT files from device storage
    - Route `.cube` imports through T3 parser and `.png` imports through T4 parser
    - Validate with T28 hardening before decode/parse
    - Persist accepted imported LUTs into app documents storage and add them to catalog metadata/state
  - REFACTOR:
    - Keep import orchestration separate from catalog persistence updates
  **Must NOT do**:
  - Do NOT bypass hardening/validation before parse
  - Do NOT persist invalid LUTs
  - Do NOT support arbitrary file types in this task
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`security-review`, `react-native-dev`]
  - **Why**: This touches untrusted file input, parser integration, and persistent app storage.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T32-T35)
  - **Blocks**: None
  - **Blocked By**: T28
  **References**:
  - `.sisyphus/drafts/handoff-lut-app-v2.md:68`
  - `.sisyphus/plans/lut-app-v2.md:76,113` — import support and must-not-have guardrails
  - `PLAN.md:91-92,134` — original import and persistence surfaces
  - `PLAN.md:376,378` — import safety review findings
  **Acceptance Criteria**:
  - [ ] `npx jest --testPathPattern lut-import --verbose` passes
  - [ ] `.cube` and `.png` imports are both supported
  - [ ] Invalid imports are rejected before persistence
  - [ ] Valid imported LUTs are added to app documents storage + catalog state
  **QA Scenarios**:
  ```
  Scenario: User imports valid .cube and .png LUT files
    Tool: Bash
    Steps:
      1. Run `npx jest --testPathPattern lut-import --verbose`
      2. Assert valid `.cube` import test passes
      3. Assert valid `.png` import test passes
      4. Assert imported LUT metadata is persisted
    Expected Result: Device LUT imports become usable presets
    Evidence: .sisyphus/evidence/task-36-lut-import-success.txt

  Scenario: Invalid LUT import is rejected safely
    Tool: Bash
    Steps:
      1. Run import test with malformed or unsafe LUT file
      2. Assert validation/parser rejection occurs
      3. Assert no persistence side effect happens
    Expected Result: Bad imports never pollute local catalog/storage
    Evidence: .sisyphus/evidence/task-36-lut-import-reject.txt
  ```
  **Commit**: YES
  - Message: `feat(import): add device lut import and persistence`
  - Files: `src/import/import-lut-from-device.ts, src/import/persist-imported-lut.ts, src/import/__tests__/lut-import.test.ts`
  - Pre-commit: `npx jest --testPathPattern lut-import --verbose`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. Plan Compliance Audit
  **What to do**:
  - Read the plan end-to-end and audit the shipped implementation against:
    - Must Have items
    - Must NOT Have guardrails
    - Deliverables list
    - Evidence expectations in `.sisyphus/evidence/`
  - Verify each claimed deliverable with direct evidence: read file, run command, inspect output
  - Reject with concrete file:line references when plan violations are found
  **Must NOT do**:
  - Do NOT approve based on summaries alone
  - Do NOT skip evidence-file verification
  - Do NOT treat missing rescue UX or missing parity proof as acceptable
  **Recommended Agent Profile**:
  - **Category**: `oracle`
  - **Skills**: []
  - **Why**: This is a strict audit task that should prioritize plan fidelity over implementation sympathy.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Final Verification Wave
  - **Blocks**: User okay
  - **Blocked By**: T1-T36 complete
  **References**:
  - `.sisyphus/plans/lut-app-v2.md:69-117` — objectives and guardrails
  - `.sisyphus/plans/lut-app-v2.md:120-139` — verification strategy and evidence policy
  - `.sisyphus/plans/lut-app-v2.md:780-800` — success criteria checklist
  **Acceptance Criteria**:
  - [ ] Audit output reports Must Have coverage
  - [ ] Audit output reports Must NOT Have violations or clean pass
  - [ ] Audit output checks evidence directories/files
  - [ ] Final verdict is explicit: APPROVE or REJECT
  **QA Scenarios**:
  ```
  Scenario: Must Have / Must NOT Have audit runs end-to-end
    Tool: Bash
    Steps:
      1. Read the completed plan and implementation outputs
      2. Verify each Must Have against files/commands/evidence
      3. Search for Must NOT Have violations with file:line reporting
    Expected Result: Audit produces a concrete approval or rejection summary
    Evidence: .sisyphus/evidence/final-qa/f1-plan-compliance.txt

  Scenario: Missing evidence is treated as failure
    Tool: Bash
    Steps:
      1. Check required evidence paths for a sample of completed tasks
      2. Assert missing evidence is reported
      3. Confirm verdict remains rejectable until evidence is present
    Expected Result: Evidence policy is enforced, not optional
    Evidence: .sisyphus/evidence/final-qa/f1-evidence-check.txt
  ```
  **Commit**: NO
  - Message: N/A
  - Files: None
  - Pre-commit: N/A

- [ ] F2. Code Quality Review
  **What to do**:
  - Run build/type/test checks and inspect changed files for code quality issues:
    - `npx tsc --noEmit`
    - linter
    - `npx jest --ci`
  - Review changed files for `as any`, `@ts-ignore`, empty catches, production `console.log`, dead/commented-out code, unused imports, and AI-slop patterns
  - Summarize findings with file-level specificity
  **Must NOT do**:
  - Do NOT approve with broken typecheck or tests
  - Do NOT hand-wave away unsafe casts or ignored compiler errors
  - Do NOT skip manual changed-file review
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Why**: This is a broad quality gate spanning static checks and human review judgment.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Final Verification Wave
  - **Blocks**: User okay
  - **Blocked By**: T1-T36 complete
  **References**:
  - `.sisyphus/plans/lut-app-v2.md:87-97` — definition of done
  - `.sisyphus/plans/lut-app-v2.md:782-788` — verification commands
  **Acceptance Criteria**:
  - [ ] Typecheck result is reported
  - [ ] Lint result is reported
  - [ ] Jest result is reported
  - [ ] Changed-file review findings are enumerated
  - [ ] Final verdict is explicit
  **QA Scenarios**:
  ```
  Scenario: Static checks all run and are reported
    Tool: Bash
    Steps:
      1. Run `npx tsc --noEmit`
      2. Run project linter
      3. Run `npx jest --ci`
    Expected Result: Quality report includes pass/fail result for each command
    Evidence: .sisyphus/evidence/final-qa/f2-static-checks.txt

  Scenario: Changed-file review catches unsafe patterns
    Tool: Bash
    Steps:
      1. Inspect changed files for `as any`, `@ts-ignore`, empty catches, console.log, dead code
      2. Record file:line findings if present
      3. Produce verdict based on severity
    Expected Result: Review is specific, not generic
    Evidence: .sisyphus/evidence/final-qa/f2-changed-file-review.txt
  ```
  **Commit**: NO
  - Message: N/A
  - Files: None
  - Pre-commit: N/A

- [ ] F3. Real QA (Detox)
  **What to do**:
  - Start from clean state and execute every critical mobile QA scenario on-device/simulator using Detox
  - Re-run core integration flows across features:
    - pick photo
    - apply LUT
    - adjust sliders
    - compare before/after
    - crop
    - export
    - gated AI path
    - restore purchase path where available
    - rescue UX for invalid import/error states
  - Save artifacts to `.sisyphus/evidence/final-qa/`
  **Must NOT do**:
  - Do NOT use Playwright for this mobile QA pass
  - Do NOT skip edge cases or recovery flows
  - Do NOT rely only on unit/integration test output
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`e2e-testing`, `react-native-dev`]
  - **Why**: This is full-stack mobile QA and must execute in the actual mobile harness.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Final Verification Wave
  - **Blocks**: User okay
  - **Blocked By**: T1-T36 complete
  **References**:
  - `.sisyphus/plans/lut-app-v2.md:127,136` — Detox is the required E2E framework
  - `.sisyphus/plans/lut-app-v2.md:134-138` — original QA policy by domain
  - `.sisyphus/plans/lut-app-v2.md:786-787` — final Detox verification commands
  **Acceptance Criteria**:
  - [ ] Detox-based mobile QA report exists
  - [ ] Core flow is re-verified on mobile harness
  - [ ] Error/recovery flows are re-verified on mobile harness
  - [ ] Final verdict is explicit
  **QA Scenarios**:
  ```
  Scenario: Core mobile flow is verified with Detox
    Tool: Detox
    Steps:
      1. Launch app from clean state
      2. Pick photo, apply LUT, adjust, compare, crop, and export
      3. Assert each step completes successfully
    Expected Result: Core editing workflow works in mobile QA environment
    Evidence: .sisyphus/evidence/final-qa/f3-core-mobile-flow/

  Scenario: Rescue and gating flows are verified with Detox
    Tool: Detox
    Steps:
      1. Trigger invalid import or shader/AI failure-safe path
      2. Assert rescue UI appears
      3. Attempt AI access as free user and assert paywall/gate behavior
    Expected Result: Mobile QA confirms error handling and monetization gates
    Evidence: .sisyphus/evidence/final-qa/f3-error-and-gating/
  ```
  **Commit**: NO
  - Message: N/A
  - Files: None
  - Pre-commit: N/A

- [ ] F4. Scope Fidelity Check
  **What to do**:
  - For every completed task, compare actual implementation/diff against:
    - What to do
    - Must NOT do
    - Declared scope boundaries
  - Flag cross-task contamination, scope creep, and unaccounted changes
  - Verify no forbidden architecture/product decisions re-entered the codebase
  **Must NOT do**:
  - Do NOT conflate “good code” with “correct scope”
  - Do NOT ignore extra features just because they are harmless
  - Do NOT skip contamination review across adjacent tasks
  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Why**: This is a reasoning-heavy diff-to-plan audit focused on staying exactly within agreed scope.
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Final Verification Wave
  - **Blocks**: User okay
  - **Blocked By**: T1-T36 complete
  **References**:
  - `.sisyphus/plans/lut-app-v2.md:108-117` — must-not-have scope boundaries
  - `.sisyphus/plans/lut-app-v2.md:142-246` — execution strategy, dependency matrix, agent dispatch
  **Acceptance Criteria**:
  - [ ] Scope-compliance report exists for completed tasks
  - [ ] Cross-task contamination is assessed explicitly
  - [ ] Unaccounted changes are listed or cleanly reported as none
  - [ ] Final verdict is explicit
  **QA Scenarios**:
  ```
  Scenario: Task implementation matches declared scope
    Tool: Bash
    Steps:
      1. Compare task descriptions against completed files/diffs
      2. Flag missing or extra behavior
      3. Summarize compliant vs non-compliant tasks
    Expected Result: Scope fidelity report is concrete and auditable
    Evidence: .sisyphus/evidence/final-qa/f4-scope-fidelity.txt

  Scenario: Must NOT Have violations are surfaced as contamination
    Tool: Bash
    Steps:
      1. Search implementation for forbidden patterns/features
      2. Cross-reference findings against task ownership
      3. Record contamination or clean result
    Expected Result: Scope creep is caught before final approval
    Evidence: .sisyphus/evidence/final-qa/f4-contamination-check.txt
  ```
  **Commit**: NO
  - Message: N/A
  - Files: None
  - Pre-commit: N/A
---

## Commit Strategy

| Wave | Commit | Message Pattern |
|------|--------|----------------|
| 1 | Per task | `feat(core): init expo project`, `feat(lut-core): add cube parser` |
| 2 | Per task | `feat(engine): add SKSL LUT shader`, `spike(ai): validate gemini API` |
| 3 | Per task | `feat(editor): add editor layout`, `feat(editor): add LUT browse` |
| 4 | Per task | `feat(ai): add style transfer service`, `feat(iap): add subscription` |
| 5 | Per task | `feat(catalog): bundle 50-100 LUTs`, `feat(i18n): add vi+en` |
| 6 | Per task | `perf(engine): optimize 12MP`, `chore(release): add store metadata` |

---

## Success Criteria

### Verification Commands
```bash
npx tsc --noEmit                    # Expected: 0 errors
npx jest --ci --coverage            # Expected: 80%+ coverage, 0 failures
npx detox test -c android.emu.debug # Expected: all E2E pass
npx detox test -c ios.sim.debug     # Expected: all E2E pass
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass with 80%+ coverage
- [ ] App runs on Android emulator + iOS Simulator
- [ ] Identity LUT round-trip passes (GPU + CPU)
- [ ] AI style transfer returns usable result
- [ ] Subscription flow works in sandbox
- [ ] AdMob banner renders
- [ ] All rescue UX visible for failure modes
- [ ] Vietnamese + English strings load
