# LUT App — Project Context

## Product

Cross-platform mobile photo grading app for Vietnamese creators.
Local-first, no backend in release 1. RAW editing explicitly deferred.

## Stack

- **Runtime**: React Native + Expo dev-client + Expo Router
- **Rendering**: `@shopify/react-native-skia` (GPU-first, CPU fallback)
- **LUT math**: Pure TS package at `packages/lut-core/`
- **Data**: Local-first, no cloud sync
- **Ads**: AdMob banners
- **Localization**: Vietnamese + English

## Architecture Rules

1. **Preview path ≠ export path** — Preview optimized for responsiveness, export for full resolution. Export must never reuse downscaled preview bitmap.
2. **`.cube` is the interop format** — Import/export `.cube`. Internally may use HaldCLUT PNG or strip textures for Skia.
3. **Local-first** — All features work offline. Future backend only behind adapter boundaries.
4. **lut-core is reusable** — `packages/lut-core/` owns all LUT math/parsing. No React Native code inside.
5. **EditState is immutable and renderer-agnostic** — No Skia types in EditState.

## Module Boundaries (STRICT)

| Module | Owns | MUST NOT contain |
|--------|------|------------------|
| `app/` | Routes, layouts, navigation wiring only | Business logic, parser logic, shader logic |
| `src/core/` | Pure contracts, domain rules, types | Expo imports, Skia imports, route params |
| `src/features/` | Feature UI, feature hooks, screen composition | Direct vendor API calls |
| `src/services/` | Orchestration layer, preview/export separation | UI components |
| `src/adapters/` | Wrappers for Expo modules, Skia runtime, EXIF | Business logic |
| `packages/lut-core/` | LUT parse/validate/serialize/interpolate | React Native code, Expo imports |

## Path Aliases

- `@core/*` → `src/core/*`
- `@features/*` → `src/features/*`
- `@services/*` → `src/services/*`
- `@adapters/*` → `src/adapters/*`
- `@ui/*` → `src/ui/*`
- `@theme` → `src/theme`
- `@hooks` → `src/hooks`
- `@lib` → `src/lib`
- `@i18n` → `src/i18n`
- `@lut-core` → `packages/lut-core/src`

## Key Features (In Scope)

- 200+ bundled LUT presets with category browse
- Full editor: LUT apply, adjustment sliders, rotate, crop, before/after, undo/redo
- `.cube` import/export (Adobe interop)
- HaldCLUT PNG import
- Selected-region effects (geometry masks)
- Framing toolkit: white border, round edges, tape overlays, manual on-canvas controls
- Quick Color Copy (offline Reinhard transfer → emits reusable LUT)
- Watermark frames with EXIF metadata and camera logos
- Full-resolution export with quality validation
- PNG/import hardening with explicit error messages
- Rescue UX for all critical failure modes

## Explicitly Deferred

- RAW decode/edit pipeline
- Cloud sync, user accounts, community features
- Live camera preview, batch processing
- Wide-gamut / P3 beyond documented limitations

## Current Progress

**Wave 0 — Not started.** No code exists yet. Only plan + docs + folder structure docs.

See `.sisyphus/plans/lut-app-v2.md` for the full 12-wave execution plan.
See `TODOS.md` for the wave-by-wave checklist.

## Build Plan Reference

- **Plan**: `.sisyphus/plans/lut-app-v2.md` (966 lines, 12 waves)
- **TODOs**: `TODOS.md` (Wave 0–11 checklist)
- **ADRs**: `docs/adr/0001-rendering-pipeline.md`, `docs/adr/0002-lut-asset-bundling.md`
- **Specs**: `docs/lut-encoding-spec.md` (draft, fields empty)
- **Brand**: `docs/brand.md` (draft, undecided)
- **Market**: `docs/market-validation.md` (draft, no data yet)

## Quality Rules (Non-Negotiable)

1. No silent import failure
2. No accidental export downscale
3. No editor feature that works in preview but not in export
4. No `.cube` interop that only works for one narrow test file
5. No RAW work in this plan

## Critical Failure Modes (Must Handle)

1. Malformed `.cube` file
2. Unsupported LUT size
3. Invalid HaldCLUT PNG dimensions
4. Oversized image import
5. Shader compile/runtime failure
6. OOM risk or unsafe export dimensions
7. Export failure / no write permission
8. EXIF read failure
9. Crop/export quality regression

Each needs: typed error → user-facing copy → non-crashing recovery → test coverage.
