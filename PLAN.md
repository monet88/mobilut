<!-- /autoplan restore point: ~/.gstack/projects/lut-app/master-autoplan-restore-20260415-083101.md -->
# Implementation Plan: LUT App — Mobile Photo Color Grading

**Branch:** main
**Status:** APPROVED — /autoplan review complete (2026-04-15)
**Design doc:** ~/.gstack/projects/lut-app/monet-main-design-20260414-142913.md
**Author:** monet
**Created:** 2026-04-15

---

## Vision

Build a mobile photo color grading app targeting Vietnamese content creators (18-28).
Differentiate from Modipix/Prequel via one-time purchase pricing ($2.99) instead of
subscription. 200 built-in LUT presets, .cube/.png import, basic editing tools.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    React Native App                  │
│                   (TypeScript + Expo)                │
├─────────────┬──────────────┬────────────────────────┤
│   Screens   │  Components  │     Navigation         │
│  ─────────  │  ──────────  │  ──────────────        │
│  Home       │  LUTGrid     │  React Navigation      │
│  Editor     │  ImageView   │  Stack + Bottom Tab     │
│  LUTBrowse  │  Slider      │                        │
│  Settings   │  CropOverlay │                        │
│  Import     │  ExportModal │                        │
├─────────────┴──────────────┴────────────────────────┤
│                  Core Services                       │
│  ─────────────────────────────────────────────────   │
│  LUTEngine (Skia RuntimeEffect SKSL shaders)        │
│  ImageProcessor (resize, crop, export JPEG)          │
│  CubeParser (.cube file → 3D LUT → 2D strip)        │
│  HaldParser (.png HaldCLUT → 3D LUT → 2D strip)     │
│  LUTCatalog (200 presets, categories, free/paid)     │
│  PurchaseManager (RevenueCat non-consumable IAP)     │
│  I18nService (react-i18next, vi + en)                │
│  StorageService (AsyncStorage for preferences)       │
├──────────────────────────────────────────────────────┤
│                  Native Layer                        │
│  ─────────────────────────────────────────────────   │
│  @shopify/react-native-skia  (GPU rendering)         │
│  react-native-image-picker   (photo selection)       │
│  @react-native-camera-roll   (save to gallery)       │
│  react-native-purchases      (RevenueCat IAP)        │
│  react-native-fs             (file system access)    │
└──────────────────────────────────────────────────────┘
```

## Phase 1: Core LUT App (8-10 weeks)

### Sprint 1: Project Setup & Core Engine (Week 1-2)

| Task | Description | Est |
|------|-------------|-----|
| 1.1 | Init Expo bare workflow project (TypeScript) | 2h |
| 1.2 | Configure react-native-skia, image-picker, camera-roll | 4h |
| 1.3 | Build CubeParser: parse .cube → 64x64x64 float grid | 8h |
| 1.4 | Build LUT 2D strip encoder: 3D grid → 512x512 RGBA texture | 8h |
| 1.5 | Build SKSL RuntimeEffect shader for LUT application | 12h |
| 1.6 | Build HaldCLUT parser: .png → 3D LUT → reuse strip format | 6h |
| 1.7 | LUT intensity blend uniform (0.0-1.0) in SKSL | 4h |
| 1.8 | Unit tests: CubeParser, HaldParser, strip encoder | 8h |

### Sprint 2: Image Pipeline & Editor UI (Week 3-4)

| Task | Description | Est |
|------|-------------|-----|
| 2.1 | Image picker integration (gallery + camera) | 4h |
| 2.2 | Image resize pipeline (max 2048px for preview) | 4h |
| 2.3 | Editor screen layout: image preview + controls | 12h |
| 2.4 | LUT intensity slider component | 4h |
| 2.5 | Basic adjustment sliders: brightness, contrast, saturation, temperature, sharpen | 16h |
| 2.6 | Full-res export: re-render at original size → JPEG → save to camera roll | 8h |
| 2.7 | Crop tool with aspect ratio selector (1:1, 4:3, 16:9, free) | 12h |
| 2.8 | Integration tests: image pipeline end-to-end | 8h |

### Sprint 3: LUT Catalog & Browse UI (Week 5-6)

| Task | Description | Est |
|------|-------------|-----|
| 3.1 | LUT catalog data structure (200 presets, 10 categories) | 4h |
| 3.2 | Bundle 200 LUT files as app assets (after licensing resolved) | 8h |
| 3.3 | LUT browse screen: category tabs + grid thumbnails | 12h |
| 3.4 | LUT thumbnail generation: apply LUT to sample image → cache | 8h |
| 3.5 | Free/paid gating: 30 free LUTs, lock icon on 170 paid | 4h |
| 3.6 | LUT import screen: file picker for .cube and .png files | 8h |
| 3.7 | Imported LUT persistence (save to app documents) | 4h |
| 3.8 | UI tests: LUT browse, selection, import flow | 8h |

### Sprint 4: Monetization & Localization (Week 7-8)

| Task | Description | Est |
|------|-------------|-----|
| 4.1 | RevenueCat setup: non-consumable IAP ($2.99 unlock all) | 8h |
| 4.2 | Purchase flow UI: paywall screen, restore purchases | 8h |
| 4.3 | Purchase state management: unlock paid LUTs after purchase | 4h |
| 4.4 | react-i18next setup: vi + en translation files | 4h |
| 4.5 | Translate all UI strings (Vietnamese + English) | 8h |
| 4.6 | Settings screen: language toggle, about, restore purchases | 6h |
| 4.7 | IAP integration tests (sandbox) | 6h |

### Sprint 5: Polish, Permissions & Release Prep (Week 9-10)

| Task | Description | Est |
|------|-------------|-----|
| 5.1 | iOS permissions: NSPhotoLibraryUsageDescription, NSPhotoLibraryAddUsageDescription | 2h |
| 5.2 | Android permissions: READ_MEDIA_IMAGES (13+), READ_EXTERNAL_STORAGE (12-) | 2h |
| 5.3 | Error handling: malformed .cube, corrupt images, export failures | 8h |
| 5.4 | App icon, splash screen design | 8h |
| 5.5 | Home screen: recent edits, quick LUT access | 8h |
| 5.6 | Navigation: React Navigation stack + bottom tabs | 6h |
| 5.7 | Performance: test on 12MP+ images, memory profiling | 8h |
| 5.8 | E2E tests: full user journey (pick image → apply LUT → export) | 12h |
| 5.9 | Build APK, submit to Google Play Console | 4h |
| 5.10 | Privacy policy: no data collection, offline-first | 4h |

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React Native (Expo bare) | Cross-platform, TypeScript, access native modules |
| Rendering | @shopify/react-native-skia | GPU LUT rendering via SKSL shaders, 2D texture sampling |
| Image Picker | react-native-image-picker | Mature, well-maintained, gallery + camera |
| Save to Gallery | @react-native-camera-roll/camera-roll | Standard for saving images |
| IAP | react-native-purchases (RevenueCat) | Non-consumable IAP, restore purchases, analytics |
| i18n | react-i18next | Standard for RN, vi + en |
| Navigation | @react-navigation/native | Stack + bottom tab navigation |
| Storage | @react-native-async-storage | User preferences, imported LUT metadata |
| File System | react-native-fs | Read .cube files, save imported LUTs |
| Testing | Jest + React Native Testing Library | Unit + integration tests |
| E2E | Detox | End-to-end testing on real devices |

## LUT Rendering Pipeline (Skia SKSL)

```
User picks photo → ImagePicker → decode → resize (max 2048px preview)
                                                    ↓
                                         Skia Canvas <Image>
                                                    ↓
LUT selected → CubeParser/.cube → 3D float grid ──→ 2D strip (512×512 RGBA)
          or → HaldParser/.png  → 3D float grid ──→ 2D strip (512×512 RGBA)
                                                    ↓
                                         Skia.Image.MakeImage(strip)
                                                    ↓
                                    RuntimeEffect (SKSL shader)
                                    ├── uniform: inputImage
                                    ├── uniform: lutTexture
                                    └── uniform: intensity (0.0-1.0)
                                                    ↓
                                         mix(original, lutColor, intensity)
                                                    ↓
                                    Preview: <Canvas> component (real-time)
                                    Export:  makeImageSnapshot() → JPEG → save
```

## Monetization Model

- **Free tier:** 30 LUT presets (3 per category) + full editing tools + import own LUTs
- **One-time purchase:** $2.99 → unlock 170 additional LUT presets
- **Implementation:** RevenueCat non-consumable IAP
- **Restore purchases:** Required by App Store, implemented in Settings

## Localization

- Primary: Vietnamese (vi) — target market
- Secondary: English (en) — global distribution
- Implementation: react-i18next with JSON translation files
- All UI strings externalized from day 1

## Success Criteria

- 100 downloads in first month (organic)
- 10 users purchase one-time unlock ($2.99)
- App Store rating >= 4.0
- No crashes on images >= 12MP
- LUT preview renders in < 100ms on mid-range devices
- Export full-res image in < 3 seconds

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| LUT licensing unclear | HIGH | MEDIUM | Resolve before coding — use Envato + self-made |
| Skia shader complexity | MEDIUM | MEDIUM | Prototype shader first, fallback to CPU rendering |
| 12MP+ memory pressure | HIGH | HIGH | Stream processing, limit preview to 2048px |
| App Store IAP rejection | MEDIUM | LOW | Follow RevenueCat best practices, test in sandbox |
| Market saturation | HIGH | HIGH | Differentiate via pricing (one-time vs subscription) |
| No user validation yet | CRITICAL | HIGH | Run "The Assignment" before coding |

## Launch Blockers

1. **LUT licensing** — Must have commercial license for 200 LUTs before bundling
2. **"The Assignment"** — Post in 3 VN photography Facebook groups, collect 20 responses
3. **App name** — "lut-app" is placeholder, need brand name for store submission
4. **Apple Developer account** — $99/year required for iOS distribution
5. **Privacy policy** — Required for both stores, must state no data collection

## Phase 2 (Post-launch, after >= 10 purchases)

- More LUT packs (IAP bundles)
- Watermark / EXIF frame templates
- PNG and HEIC export formats
- EXIF preservation (strip location, keep camera info)

## Phase 3 (Post Phase 2 validation)

- Color transfer AI from reference photo (TFLite model)
- Batch processing (image queue architecture redesign)
- Live camera preview with LUT (react-native-vision-camera)

## Distribution

- **Android first** — Play Console $25 one-time, faster review
- **iOS second** — after Android stable
- **CI/CD:** GitHub Actions → Fastlane → Play Console / TestFlight
- **Marketing day 1:** VN photography Facebook groups, Reddit r/analog, TikTok demo videos

---

## CEO Review Findings (autoplan Phase 1)

### NOT in scope (deferred)
- Color transfer AI (Phase 3 — too complex for MVP, 6-8 weeks standalone)
- Batch processing (Phase 3 — needs queue architecture redesign)
- Live camera preview with LUT (Phase 2 — react-native-vision-camera)
- Community LUT sharing platform (future — needs backend)
- Lightroom plugin / iOS Shortcuts integration (alternative distribution, not explored)

### What already exists
| Sub-problem | Existing code | Reusable? |
|---|---|---|
| .cube → HaldCLUT conversion | tools/cube_to_hald.py (Python) | NO — needs JS/TS port |
| Everything else | Nothing | N/A — greenfield |

### Dream state delta
Plan delivers ~30% of 12-month ideal. Core rendering pipeline and monetization foundation are built. Missing: community features, AI color transfer, multi-platform maturity, 10K+ users.

### Error & Rescue Registry
6 CRITICAL GAPS identified: UnsupportedLUTSize, FileTooLarge, InvalidHaldFormat, DimensionMismatch, ShaderCompileError, OutOfMemoryError. All need rescue handlers.

### Failure Modes Registry
| Codepath | Failure Mode | Rescued? | Test? | User Sees? | Logged? |
|---|---|---|---|---|---|
| CubeParser | Unsupported LUT size | N | N | Crash | N |
| CubeParser | File >10MB | N | N | OOM crash | N |
| HaldParser | Invalid HaldCLUT dims | N | N | Wrong colors | N |
| HaldParser | Dimension mismatch | N | N | Wrong output | N |
| LUTEngine | Shader compile fail | N | N | App crash | N |
| ImageProcessor | 24MP OOM | N | N | App crash | N |
| Export | Disk full | Y | N | Toast | N |
| Purchase | Network drop mid-buy | Y | N | RevenueCat retry | N |

CRITICAL GAPS: 6 rows with Rescued=N, Test=N, User Sees=Crash/Wrong

### Accepted Scope Expansions (SELECTIVE EXPANSION)
1. Favorites/Recent LUTs (S effort)
2. Before/After comparison (S effort)
3. Undo/Redo stack (M effort)
4. LUT search/filter (S effort)
5. Share to social (S effort)
6. Onboarding tutorial (S effort)

### CEO Dual Voice Consensus
Both Claude subagent and Codex agree on 6/6 strategic concerns:
1. Premises unvalidated — no real user data
2. Workflow problem > filter count problem
3. MVP scope too large for unvalidated market
4. No moat — features trivially replicated
5. No distribution or retention strategy
6. Success criteria insufficient ($30 revenue target)

### Decision Audit Trail
<!-- AUTONOMOUS DECISION LOG -->

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|---------------|-----------|-----------|----------|
| 1 | CEO | Mode: SELECTIVE EXPANSION | Mechanical | P1 completeness | Greenfield app, hold scope + cherry-pick | EXPANSION (too ambitious for unvalidated market) |
| 2 | CEO | Approach A (React Native + Skia) | Mechanical | P6 action | Design doc chose this, user confirmed | B (Flutter), C (native Kotlin) |
| 3 | CEO | Accept 6 scope expansions | Mechanical | P1+P2 completeness + boil lakes | All S effort, essential for consumer app | None |
| 4 | CEO-S1 | Add EditState service | Mechanical | P1 completeness | Central state needed for undo/redo | — |
| 5 | CEO-S1 | Background export thread | Mechanical | P5 explicit | 24MP export blocks UI | — |
| 6 | CEO-S1 | Error boundary for Skia Canvas | Mechanical | P1 completeness | Shader crash = app crash | — |
| 7 | CEO-S2 | Rescue all 6 critical gaps | Mechanical | P1 completeness | Silent failures = critical defect | — |
| 8 | CEO-S3 | File size validation + path sanitization | Mechanical | P5 explicit | Prevent malicious imports | — |
| 9 | CEO-S4 | Debounce LUT selection + min crop size | Mechanical | P1 completeness | Edge cases cause crashes | — |
| 10 | CEO-S5 | Interface-based LUTEngine | Mechanical | P5 explicit | Enables CPU fallback + testability | — |
| 11 | CEO-S6 | Add CubeParser fuzz tests + shader fallback tests | Mechanical | P1 completeness | 6 critical gaps need test coverage | — |
| 12 | CEO-S7 | Pre-gen thumbnails + LRU cache + stream export | Mechanical | P1+P3 | Performance on low-end devices | — |
| 13 | CEO-S8 | Add Sentry crash reporting day 1 | Mechanical | P3 pragmatic | Can't debug offline app without it | Defer analytics |
| 14 | CEO-S9 | Staged rollout on Play Console | Mechanical | P1 completeness | Safe deployment | — |
| 15 | CEO-S11 | Add empty state designs | Mechanical | P1 completeness | UX gaps for first-time user | — |

### CEO Completion Summary
```
+====================================================================+
|            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
+====================================================================+
| Mode selected        | SELECTIVE EXPANSION                         |
| System Audit         | Greenfield, 2 commits, design doc available  |
| Step 0               | 5 premises (all unvalidated), 3 approaches   |
| Section 1  (Arch)    | 4 issues found (EditState, export, boundary) |
| Section 2  (Errors)  | 12 error paths mapped, 6 CRITICAL GAPS       |
| Section 3  (Security)| 6 issues found, 2 need fixes                 |
| Section 4  (Data/UX) | 7 edge cases mapped, 5 unhandled             |
| Section 5  (Quality) | 1 issue (interface-based design)             |
| Section 6  (Tests)   | Diagram produced, 4 test gaps                |
| Section 7  (Perf)    | 5 issues found, 1 CRITICAL (APK size)        |
| Section 8  (Observ)  | 1 gap (no crash reporting)                   |
| Section 9  (Deploy)  | 1 risk (no staged rollout)                   |
| Section 10 (Future)  | Reversibility: 3/5, debt items: 2            |
| Section 11 (Design)  | 3 gaps (empty states, user flow)             |
+--------------------------------------------------------------------+
| NOT in scope         | written (5 items)                            |
| What already exists  | written (1 tool, rest greenfield)             |
| Dream state delta    | written (~30% of ideal)                      |
| Error/rescue registry| 12 methods, 6 CRITICAL GAPS                  |
| Failure modes        | 8 total, 6 CRITICAL GAPS                     |
| TODOS.md updates     | 0 items (deferred items in NOT in scope)      |
| Scope proposals      | 6 proposed, 6 accepted                       |
| CEO plan             | written (SELECTIVE EXPANSION)                 |
| Dual voices          | ran (codex + claude subagent)                |
| Lake Score           | 15/15 chose complete option                  |
| Diagrams produced    | 3 (architecture, error flow, user flow)      |
| Stale diagrams found | 0 (greenfield)                               |
| Unresolved decisions | 0                                            |
+====================================================================+
```

---

## Design Review Findings (autoplan Phase 2)

### Design Dual Voice Consensus (6/6 confirmed)
1. No information hierarchy per screen — developer-first, not user-first
2. Interaction states unspecified — 6 crash paths, no rescue UX
3. User journey fragmented — LUT selection separate from editing
4. UI specificity zero — generic labels, not design decisions
5. Accessibility unspecified — no focus order, contrast, touch targets
6. Key design decisions missing — 7 ambiguities will haunt implementer

### Critical Design Issues
- LUT selection must be in-editor (bottom sheet/strip), not separate screen
- Paywall design unspecified — this is the monetization conversion point
- Dark mode essential for a color grading app (Lightroom, Darkroom precedent)
- Empty states, loading states, error states all undesigned
- Thumbnail personalization (user's photo vs sample image) not decided
- Before/After interaction model not specified (hold, split-screen, or toggle?)
- Bottom tab structure not defined (5 screens too many for tab bar)

---

## Eng Review Findings (autoplan Phase 3)

### Critical Engineering Gaps (3 CRITICAL, 12 HIGH)

**CRITICAL:**
1. SKSL shader compile failure has no CPU fallback (device-specific crashes)
2. No shader correctness tests (pipeline can be silently wrong)
3. SKSL 3D-in-2D lookup: texel centering, trilinear interpolation, color space, highp precision

**HIGH:**
4. LUT encoding spec missing (encoder and shader must agree exactly)
5. EditState has no shape, depth limit, or memory budget
6. .cube parser assumes 64x64x64 only (real files are often 33x33x33)
7. HaldCLUT non-standard levels (4, 12) not handled
8. 200 bundled LUTs will breach APK size limits
9. Purchase entitlement must use RevenueCat signed cache, not AsyncStorage boolean
10. 200 thumbnails on first launch will freeze UI
11. Adjustment slider order of operations not specified
12. 12MP export: 96MB peak memory, no tiled export plan
13. Content URI path traversal on Android import
14. RevenueCat API key storage not specified
15. PNG import: no pre-decode dimension check

### Top 5 Actions Before Any Code
1. Write LUT encoding spec (index convention, texel centering, round-trip test)
2. Prototype SKSL shader first (validate trilinear interpolation, highp, color space)
3. Decide LUT asset bundling strategy (pre-encoded binary vs HaldCLUT PNG vs Asset Delivery)
4. Add CPU fallback LUTEngine as concrete Sprint 1 task
5. Move purchase entitlement to RevenueCat signed cache from day 1

### Test Plan Artifact
Written to: ~/.gstack/projects/lut-app/monet-master-test-plan-20260415-085530.md

### Eng Completion Summary
```
+====================================================================+
|            ENG REVIEW — COMPLETION SUMMARY                         |
+====================================================================+
| Architecture      | 6 issues (encoding spec, EditState, state mgmt)|
| Edge Cases        | 7 issues (shader fail, LUT sizes, purchase)    |
| Tests             | 5 gaps (shader, IAP, fuzz, E2E timing, perf)   |
| Security          | 4 issues (path traversal, API key, PNG decode)  |
| Hidden Complexity | 5 issues (SKSL, slider order, export memory)    |
| Total             | 27 findings: 3 CRITICAL, 12 HIGH, 9 MED, 3 LOW |
+====================================================================+
```

### Additional Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|---------------|-----------|-----------|----------|
| 16 | Design | LUT selection in-editor (bottom sheet) | Taste | P5 explicit | Core interaction must be in editing context | Separate screen |
| 17 | Design | Dark mode as default theme | Taste | P1 completeness | Color grading app needs dark for accuracy | Light mode |
| 18 | Design | Personalized thumbnails (user's photo) | Taste | P1 completeness | Higher conversion than sample image | Fixed sample |
| 19 | Eng | Write LUT encoding spec before coding | Mechanical | P5 explicit | Encoder + shader must agree exactly | — |
| 20 | Eng | Prototype SKSL shader first | Mechanical | P6 action | 12h estimate likely 24-40h; validate early | — |
| 21 | Eng | CPU fallback LUTEngine as Sprint 1 task | Mechanical | P1 completeness | Mali GPU shader failures are real | — |
| 22 | Eng | RevenueCat signed cache, not AsyncStorage boolean | Mechanical | P1 completeness | Revenue bypass on rooted devices | — |
| 23 | Eng | Pre-generate 200 thumbnails at build time | Mechanical | P3 pragmatic | Eliminates first-launch UI freeze | Runtime generation |
| 24 | Eng | Support .cube sizes 33 and 64 (not just 64) | Mechanical | P1 completeness | DaVinci Resolve default is 33x33x33 | — |
| 25 | Eng | Pre-decode PNG dimension check before import | Mechanical | P1 completeness | Prevent OOM from malicious PNG | — |
| 26 | Eng | Move E2E setup to Sprint 1-2 | Mechanical | P6 action | Sprint 5 E2E is too late | — |
| 27 | Eng | Explicit slider order: temp→bright→contrast→sat→LUT→sharpen | Mechanical | P5 explicit | Matches Lightroom pipeline convention | — |

### Cross-Phase Themes

**Theme: Plan is technically detailed but user-experience incomplete** — flagged in Phase 1 (CEO), Phase 2 (Design), Phase 3 (Eng). High-confidence signal. The engineering plan is solid architecturally but missing the design layer that turns architecture into product.

**Theme: LUT rendering pipeline is higher complexity than estimated** — flagged in Phase 1 (CEO, shader complexity risk), Phase 3 (Eng, SKSL hidden complexity). SKSL shader estimate of 12h is likely 24-40h.

**Theme: No validation of any premise** — flagged in Phase 1 (CEO, both voices), Phase 2 (Design, paywall untested). Both strategic and UX assumptions are unvalidated.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | ISSUES_OPEN (via /autoplan) | 6 proposals accepted, 6 critical gaps, mode: SELECTIVE_EXPANSION |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES_OPEN (via /autoplan) | 27 issues, 3 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | ISSUES_OPEN (via /autoplan) | 6/6 design dimensions flagged |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | SKIPPED | No developer-facing scope |

- **CROSS-MODEL:** CEO phase: Codex + Claude subagent, 6/6 confirmed. Design phase: Codex + Claude subagent, 6/6 confirmed. Eng phase: Claude subagent only (Codex model error).
- **UNRESOLVED:** 0 unresolved decisions across all reviews
- **VERDICT:** CEO + DESIGN + ENG REVIEWED via /autoplan. All have open issues (expected for first review of greenfield plan). Eng review required gate is satisfied.
