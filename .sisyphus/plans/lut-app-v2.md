# LUT App V2 — Full-Scope Build Plan

## TL;DR

> Build a cross-platform mobile photo grading app for Vietnamese creators on **React Native + Expo dev-client + Skia**, keeping the app **local-first** in the first release.
>
> The product must include the major features already accepted plus the newly discussed ones:
> - 200+ bundled LUTs
> - full editor with LUT apply, adjustment sliders, rotate, crop, before/after, undo/redo, full-resolution export
> - `.cube` import and `.cube` export for Adobe interoperability
> - PNG/import hardening with explicit error messages
> - crop/export quality fixes
> - selected-region effects
> - framing toolkit: round edges, white border, tape-style controls, manual on-canvas framing adjustments
> - Quick Color Copy (offline Reinhard transfer)
> - watermark frames with EXIF metadata and camera logos
> - AdMob banners
> - Vietnamese + English localization
>
> **RAW editing is explicitly deferred**. It is a nice-to-have track that only starts after strong user demand is confirmed.

## Product Direction

### Stack

- **Client**: React Native + Expo dev-client + Expo Router
- **Rendering**: `@shopify/react-native-skia`
- **Image IO / local platform APIs**: Expo modules via dev-client
- **Core LUT math**: reusable TypeScript package in `packages/lut-core/`
- **Data mode**: local-first, no backend required for release 1

### Why this stack

1. It preserves the current repo direction and existing decisions.
2. It supports custom GPU preview rendering with Skia.
3. It avoids backend complexity for the first release while still leaving room for future remote processing.
4. It is fast enough for the accepted full feature set except RAW, which is intentionally deferred.

## Scope

### In Scope for this build

#### Core editing
- import image from device
- apply bundled LUT
- import `.cube` LUT from device
- import supported HaldCLUT PNG LUT from device
- adjust intensity
- temperature
- brightness
- contrast
- saturation
- sharpen
- rotate
- crop with aspect ratios
- before/after comparison
- undo/redo
- selected-region effects

#### Export / interoperability
- full-resolution export path
- export quality validation, no accidental preview-size downscale
- `.cube` export for Adobe and other external tools
- save/share exported image
- save/share exported LUT

#### Visual framing toolkit
- white border
- round edges / border radius
- tape-style overlays
- manual on-canvas framing controls

#### Catalog / content
- 200+ bundled LUT presets
- category browse
- custom imported LUT collection

#### Advanced but still in-scope features
- Quick Color Copy using offline Reinhard color transfer
- watermark frames with EXIF metadata and camera logos

#### UX / reliability
- PNG import hardening
- explicit import/export error messages
- crop/export jagged-edge quality fixes
- rescue UX for all critical failure modes
- Vietnamese + English localization
- AdMob banner ads

### Explicitly Deferred

- RAW decode / RAW edit pipeline
- cloud sync
- user accounts
- community features
- live camera preview
- batch processing
- backend-required features
- wide-gamut / P3 handling beyond documented limitations

## Architecture Principles

### 1. Preview path and export path are separate

This is mandatory.

- **Preview path** is optimized for responsiveness.
- **Export path** is optimized for full resolution and deterministic output quality.
- Export must never silently reuse a downscaled preview bitmap.

### 2. `.cube` is the interoperability format

- Import `.cube`
- Export `.cube`
- Preserve Adobe-friendly workflow
- Internally, the runtime may still use HaldCLUT PNG or strip textures for Skia efficiency

### 3. Local-first release

- No backend is required to ship release 1.
- All accepted features except RAW must work offline.
- Future backend hooks are allowed only behind adapter boundaries.

### 4. Core LUT math stays reusable

`packages/lut-core/` owns:
- `.cube` parse / validate / serialize
- Hald parse / validate / conversion
- interpolation math
- LUT model contracts

The app shell must not duplicate this logic.

### 5. Editor state is immutable and renderer-agnostic

`EditState` should describe:
- selected asset
- transform stack
- LUT selection
- adjustment parameters
- mask / region effect parameters
- framing parameters

It must not depend directly on Skia types.

## Required Module Boundaries

### Route layer
`app/`

Only:
- routes
- layouts
- navigation wiring

Never place business logic or parser logic here.

### Core contracts
`src/core/`

Owns:
- image asset types
- edit session types
- transform types
- export request types
- error types

### Features
`src/features/`

Owns:
- editor
- image import
- LUT import
- image export
- LUT export
- preset browser
- framing toolkit
- settings

### Services
`src/services/`

Owns orchestration for:
- image picker
- preview render
- export render
- metadata / EXIF
- LUT library loading
- LUT import/export
- local storage

### Adapters
`src/adapters/`

Owns wrappers for:
- Expo APIs
- Skia runtime effect / shader plumbing
- EXIF reader

## Concrete Folder Structure

```text
app/
  _layout.tsx
  index.tsx
  editor/[assetId].tsx
  import/index.tsx
  export/index.tsx
  presets/index.tsx
  settings/index.tsx

src/
  core/
    edit-session/
    image-pipeline/
    lut/
    errors/
  features/
    editor/
    import-image/
    import-lut/
    export-image/
    export-lut/
    preset-browser/
    framing-toolkit/
    quick-color-copy/
    watermark/
    settings/
  services/
    image/
    lut/
    storage/
    diagnostics/
  adapters/
    expo/
    skia/
    exif/
  ui/
    primitives/
    feedback/
    layout/
  theme/
  hooks/
  lib/
  i18n/

packages/
  lut-core/
    src/
      cube/
      hald/
      interpolate/
      model/

assets/
  presets/
    catalog.json
    thumbnails/
    hald/
  fixtures/
  images/

__tests__/
  lut-core/
  services/
  editor/
  import-export/

tools/
  cube_to_hald.py
```

## Folder Ownership Rules

### `app/`
- routes only
- Expo Router layouts only
- screen entrypoints only
- no parser logic, shader logic, or file-system logic

### `src/core/`
- pure contracts and domain rules
- no Expo imports
- no Skia imports
- no route params

### `src/features/`
- feature UI and feature hooks
- local screen composition
- glue between user interactions and services

### `src/services/`
- orchestration layer
- converts core requests into adapter calls
- separates preview requests from export requests

### `src/adapters/`
- wrappers around unstable or vendor-specific APIs
- only place where Expo module details and Skia runtime details are allowed

### `packages/lut-core/`
- reusable pure TypeScript LUT math and parsing
- shared by tests and app runtime
- no React Native code

## Task-to-Module Ownership Map

### Foundation
- **T1** → `app/`, root config files, workspace wiring
- **T2** → `__tests__/`, root test config
- **T3-T5** → `packages/lut-core/`
- **T6** → `src/core/`
- **T7** → `src/theme/`, `src/ui/primitives/`

### Rendering and image pipeline
- **T8** → `src/adapters/skia/`, `src/services/image/preview-render.service.ts`
- **T9** → `src/services/image/`, optionally `packages/lut-core/` helpers reused
- **T10** → `__tests__/lut-core/`, `__tests__/services/`
- **T11** → `src/features/import-image/`, `src/services/image/`, `src/adapters/expo/`
- **T12** → `src/features/export-image/`, `src/services/image/export-render.service.ts`, `src/adapters/expo/`
- **T13** → `src/features/editor/` shell integration + ads area

### Core editor
- **T14** → `app/editor/[assetId].tsx`, `src/features/editor/`
- **T15** → `src/features/preset-browser/`, `src/features/editor/components/`
- **T16** → `src/features/editor/`, `src/core/edit-session/`
- **T17** → `src/features/editor/components/compare-*`
- **T18** → `src/features/editor/components/crop-*`, `src/core/image-pipeline/`
- **T19** → `src/features/editor/components/rotate-*`, `src/core/image-pipeline/`
- **T20** → `src/core/edit-session/`, `src/features/editor/state/`

### Interoperability and quality
- **T21** → `src/features/import-lut/`, `src/services/lut/lut-import.service.ts`
- **T22** → `src/features/export-lut/`, `src/services/lut/lut-export.service.ts`
- **T23** → `src/features/import-image/utils/`, `src/features/import-lut/utils/`, `src/core/errors/`
- **T24** → `src/services/image/export-render.service.ts`, `src/adapters/skia/`, `__tests__/import-export/`

### Advanced editor features
- **T25** → `src/features/editor/region-effects/`, `src/core/edit-session/`
- **T26-T28** → `src/features/framing-toolkit/`
- **T29** → `src/features/watermark/`, `src/services/image/`, `src/adapters/exif/`

### Smart features and content
- **T30-T31** → `src/features/quick-color-copy/`, `src/services/lut/`, `packages/lut-core/` where reusable
- **T32-T33** → `assets/presets/`, `src/services/lut/lut-library.service.ts`

### Polish and release hardening
- **T34** → `src/features/settings/`, `src/i18n/`
- **T35** → all feature-level error states + `src/ui/feedback/`
- **T36-T39** → test and diagnostics surfaces across `__tests__/`, `src/services/diagnostics/`, release config

## Architectural Guardrails for Implementation

1. Every feature that changes pixels must define both a preview request and an export request.
2. Any feature added to preview must declare how it appears in exported output before it is considered done.
3. `.cube` import/export logic must live outside UI components.
4. Selected-region effects must start with geometry/mask primitives before any freehand brush expansion.
5. Framing toolkit state must be export-safe and serializable in `EditState`.
6. Quick Color Copy must emit a reusable LUT model, not a one-off preview-only effect.

## Definition of Done

The project is only done when all of the following are true:

- app builds and runs on Android emulator/device and iOS Simulator/device
- pick image → edit → export works end-to-end
- full-resolution export is verified against original dimensions for supported raster inputs
- `.cube` import works for supported LUT sizes
- `.cube` export produces reusable LUT files for Adobe-style workflows
- crop/export quality meets defined acceptance checks, no obvious jagged-edge regression
- selected-region effects work with visible masks and non-destructive editing
- framing toolkit works in editor and exported output
- Quick Color Copy works offline
- watermark frames render correctly on export
- 200+ LUT catalog is bundled and browsable
- PNG/import hardening and error copy are implemented
- rescue UX exists for critical failure modes
- localization works in Vietnamese and English
- AdMob banners render safely without breaking editor UX
- tests pass with meaningful unit, integration, and E2E coverage

## Critical Failure Modes

The app must explicitly handle at least these:

1. malformed `.cube` file
2. unsupported LUT size
3. invalid HaldCLUT PNG dimensions
4. oversized image import
5. shader compile/runtime failure
6. OOM risk or unsafe export input dimensions
7. export failure / no write permission
8. EXIF read failure
9. crop/export quality regression

Each failure must have:
- typed error
- user-facing copy
- non-crashing recovery path
- test coverage

## Detailed Execution Waves

The repo is still planning-only, so the first wave must explicitly create the folder architecture before feature code starts. Each wave below is aligned to the folder ownership rules above.

### Wave 0 — Repo scaffolding and architecture skeleton

#### W0.1. Expo app and workspace bootstrap

**Goal**: Runnable Expo dev-client app with workspace wiring.

| File | Purpose |
|------|---------|
| `package.json` | Root workspace config (yarn/npm workspaces) |
| `app.json` | Expo app config |
| `tsconfig.json` | Root TypeScript config |
| `babel.config.js` | Babel for RN + module resolution |
| `metro.config.js` | Metro bundler config (workspace symlink support) |
| `eas.json` | EAS Build config (dev-client profiles) |

- initialize Expo TypeScript app
- configure dev-client and prebuild
- verify Android + iOS local run
- create workspace wiring for `packages/lut-core/`

#### W0.2. Scaffold route and source folders

**Goal**: Every agreed directory exists with a barrel `index.ts` placeholder. Import paths work from day one.

**Routes:**

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout (Expo Router) |
| `app/index.tsx` | Home / entry route |

**Source barrels** (empty `index.ts` per module — establishes import paths):

| Directory | Barrel |
|-----------|--------|
| `src/core/edit-session/` | `index.ts` |
| `src/core/image-pipeline/` | `index.ts` |
| `src/core/lut/` | `index.ts` |
| `src/core/errors/` | `index.ts` |
| `src/features/editor/` | `index.ts` |
| `src/features/import-image/` | `index.ts` |
| `src/features/import-lut/` | `index.ts` |
| `src/features/export-image/` | `index.ts` |
| `src/features/export-lut/` | `index.ts` |
| `src/features/preset-browser/` | `index.ts` |
| `src/features/framing-toolkit/` | `index.ts` |
| `src/features/quick-color-copy/` | `index.ts` |
| `src/features/watermark/` | `index.ts` |
| `src/features/settings/` | `index.ts` |
| `src/services/image/` | `index.ts` |
| `src/services/lut/` | `index.ts` |
| `src/services/storage/` | `index.ts` |
| `src/services/diagnostics/` | `index.ts` |
| `src/adapters/expo/` | `index.ts` |
| `src/adapters/skia/` | `index.ts` |
| `src/adapters/exif/` | `index.ts` |
| `src/ui/primitives/` | `index.ts` |
| `src/ui/feedback/` | `index.ts` |
| `src/ui/layout/` | `index.ts` |
| `src/theme/` | `index.ts` |
| `src/hooks/` | `index.ts` |
| `src/lib/` | `index.ts` |
| `src/i18n/` | `index.ts` |

**Assets:**

| Path | Purpose |
|------|---------|
| `assets/presets/catalog.json` | Empty preset catalog placeholder |
| `assets/presets/thumbnails/.gitkeep` | Thumbnail directory |
| `assets/presets/hald/.gitkeep` | Runtime hald texture directory |
| `assets/fixtures/.gitkeep` | Test fixture directory |
| `assets/images/.gitkeep` | Static images directory |

**Tests:**

| Path | Purpose |
|------|---------|
| `__tests__/lut-core/.gitkeep` | LUT core tests |
| `__tests__/services/.gitkeep` | Services tests |
| `__tests__/editor/.gitkeep` | Editor tests |
| `__tests__/import-export/.gitkeep` | Import/export tests |

**Package scaffold:**

| File | Purpose |
|------|---------|
| `packages/lut-core/package.json` | Package config (pure TS, no RN deps) |
| `packages/lut-core/tsconfig.json` | Package TS config |
| `packages/lut-core/src/index.ts` | Package barrel export |

#### W0.3. Tooling and path aliases

**Goal**: All import aliases resolve. Lint/format enforced.

**Path aliases** (in `tsconfig.json` + `babel.config.js`):

| Alias | Maps to |
|-------|---------|
| `@core/*` | `src/core/*` |
| `@features/*` | `src/features/*` |
| `@services/*` | `src/services/*` |
| `@adapters/*` | `src/adapters/*` |
| `@ui/*` | `src/ui/*` |
| `@theme` | `src/theme` |
| `@hooks` | `src/hooks` |
| `@lib` | `src/lib` |
| `@i18n` | `src/i18n` |
| `@lut-core` | `packages/lut-core/src` |

**Config files:**

| File | Purpose |
|------|---------|
| `.eslintrc.js` | Lint rules |
| `.prettierrc` | Format rules |

#### W0.4. Test harness scaffold

**Goal**: `yarn test` works with zero tests. Infra ready for Wave 1 test authoring.

| File | Purpose |
|------|---------|
| `jest.config.js` | Jest config (RN preset + workspace transforms) |
| `jest.setup.ts` | Global test setup |
| `__tests__/helpers/test-utils.ts` | Shared test utilities / render helpers |

**Wave 0 total: ~42 files** (configs + placeholder barrels + asset dirs)
### Wave 1 — Reusable LUT core package

#### W1.1. `packages/lut-core/model/`

**Goal**: Shared types that all parsers and consumers depend on.

| File | Purpose |
|------|---------|
| `packages/lut-core/src/model/index.ts` | Barrel for model types |
| `packages/lut-core/src/model/lut-table.ts` | `LutTable` type (3D array representation) |
| `packages/lut-core/src/model/lut-metadata.ts` | `LutMetadata` type (title, size, domain) |
| `packages/lut-core/src/model/parse-result.ts` | `ParseResult<T>` and `ValidationError` types |

#### W1.2. `packages/lut-core/cube/`

**Goal**: Complete `.cube` interoperability — parse, validate, serialize.

| File | Purpose |
|------|---------|
| `packages/lut-core/src/cube/index.ts` | Barrel for cube module |
| `packages/lut-core/src/cube/cube-parser.ts` | Parse `.cube` text → `LutTable` |
| `packages/lut-core/src/cube/cube-validator.ts` | Validate parsed LUT (size, domain, NaN) |
| `packages/lut-core/src/cube/cube-serializer.ts` | `LutTable` → `.cube` text |

#### W1.3. `packages/lut-core/hald/`

**Goal**: HaldCLUT PNG support + cube↔hald conversion.

| File | Purpose |
|------|---------|
| `packages/lut-core/src/hald/index.ts` | Barrel for hald module |
| `packages/lut-core/src/hald/hald-parser.ts` | Parse HaldCLUT PNG pixel data → `LutTable` |
| `packages/lut-core/src/hald/hald-validator.ts` | Validate Hald dimensions / pixel integrity |
| `packages/lut-core/src/hald/cube-to-hald.ts` | `LutTable` → Hald RGBA pixel buffer |

#### W1.4. `packages/lut-core/interpolate/`

**Goal**: GPU-friendly strip textures and accurate 3D interpolation.

| File | Purpose |
|------|---------|
| `packages/lut-core/src/interpolate/index.ts` | Barrel for interpolation module |
| `packages/lut-core/src/interpolate/trilinear.ts` | Trilinear interpolation for 3D LUT |
| `packages/lut-core/src/interpolate/strip-sampler.ts` | Sample LUT into GPU-friendly strip texture |

#### W1.5. LUT-core tests

**Goal**: High-coverage tests for all parse / validate / interpolation paths.

| File | Purpose |
|------|---------|
| `__tests__/lut-core/cube-parser.test.ts` | Parse tests (valid, malformed, edge sizes) |
| `__tests__/lut-core/cube-validator.test.ts` | Validation tests (bad size, NaN, domain) |
| `__tests__/lut-core/cube-serializer.test.ts` | Round-trip serialization tests |
| `__tests__/lut-core/hald-parser.test.ts` | Hald parse tests |
| `__tests__/lut-core/hald-validator.test.ts` | Hald dimension/integrity tests |
| `__tests__/lut-core/cube-to-hald.test.ts` | Conversion correctness tests |
| `__tests__/lut-core/trilinear.test.ts` | Interpolation accuracy tests |
| `__tests__/lut-core/strip-sampler.test.ts` | Strip texture generation tests |

**Wave 1 total: ~21 files** (13 source + 8 tests)
### Wave 2 — App contracts and primitives

#### W2.1. `src/core/edit-session/`

**Goal**: Immutable, renderer-agnostic editor state model.

| File | Purpose |
|------|---------|
| `src/core/edit-session/index.ts` | Barrel (re-export all) |
| `src/core/edit-session/edit-state.ts` | `EditState` type (frozen immutable shape) |
| `src/core/edit-session/edit-action.ts` | `EditAction` union type (all possible edits) |
| `src/core/edit-session/history.ts` | `History<T>` model (bounded stack, undo/redo ptrs) |
| `src/core/edit-session/session-selectors.ts` | Pure selectors over `EditState` |

#### W2.2. `src/core/image-pipeline/`

**Goal**: Contracts separating preview from export paths.

| File | Purpose |
|------|---------|
| `src/core/image-pipeline/index.ts` | Barrel |
| `src/core/image-pipeline/image-asset.ts` | `ImageAsset` type (uri, width, height, format) |
| `src/core/image-pipeline/preview-request.ts` | `PreviewRequest` type (asset + transforms + lut) |
| `src/core/image-pipeline/export-request.ts` | `ExportRequest` type (full-res params) |
| `src/core/image-pipeline/transform.ts` | `Transform` union (crop, rotate, adjust, mask, frame) |
| `src/core/image-pipeline/pipeline-constraints.ts` | Max dimension limits, memory budget constants |

#### W2.3. `src/core/lut/`

**Goal**: Preset catalog and runtime LUT model.

| File | Purpose |
|------|---------|
| `src/core/lut/index.ts` | Barrel |
| `src/core/lut/preset-model.ts` | `Preset` type (id, name, category, thumbnail, hald path) |
| `src/core/lut/runtime-lut.ts` | `RuntimeLut` type (GPU texture ref or CPU table ref) |

#### W2.4. `src/core/errors/`

**Goal**: Typed error hierarchy with user-facing copy keys.

| File | Purpose |
|------|---------|
| `src/core/errors/index.ts` | Barrel |
| `src/core/errors/import-errors.ts` | `ImportError` types (image + LUT import failures) |
| `src/core/errors/export-errors.ts` | `ExportError` types (write, permission, dimension) |
| `src/core/errors/lut-errors.ts` | `LutError` types (parse, validate, convert) |
| `src/core/errors/render-errors.ts` | `RenderError` types (shader fail, OOM) |
| `src/core/errors/error-messages.ts` | User-facing copy keys (localization-ready) |

#### W2.5. Theme and UI primitives

**Goal**: Design tokens and shared component primitives.

| File | Purpose |
|------|---------|
| `src/theme/index.ts` | Re-export tokens + hooks |
| `src/theme/tokens.ts` | Color, spacing, radius, typography tokens |
| `src/theme/use-theme.ts` | Theme context hook |
| `src/ui/primitives/index.ts` | Barrel |
| `src/ui/primitives/button.tsx` | Primary/secondary button |
| `src/ui/primitives/icon-button.tsx` | Icon-only pressable |
| `src/ui/primitives/slider.tsx` | Value slider (for adjustments) |
| `src/ui/primitives/text.tsx` | Themed text variants |
| `src/ui/feedback/index.ts` | Barrel |
| `src/ui/feedback/loading-overlay.tsx` | Fullscreen loading indicator |
| `src/ui/feedback/error-banner.tsx` | Inline error display |
| `src/ui/feedback/toast.tsx` | Transient notification |
| `src/ui/layout/index.ts` | Barrel |
| `src/ui/layout/safe-area-view.tsx` | Safe area wrapper |
| `src/ui/layout/bottom-sheet.tsx` | Bottom sheet container (for tool panels) |

**Wave 2 total: ~28 files**
### Wave 3 — Adapters and infra wrappers

#### W3.1. `src/adapters/expo/`

**Goal**: Thin wrappers isolating Expo SDK details from the rest of the app.

| File | Purpose |
|------|---------|
| `src/adapters/expo/index.ts` | Barrel |
| `src/adapters/expo/document-picker.ts` | Wrap expo-document-picker for `.cube`/`.png` pick |
| `src/adapters/expo/image-picker.ts` | Wrap expo-image-picker for photo selection |
| `src/adapters/expo/image-manipulator.ts` | Wrap expo-image-manipulator for resize/rotate/crop |
| `src/adapters/expo/file-system.ts` | Wrap expo-file-system for read/write/cache |
| `src/adapters/expo/sharing.ts` | Wrap expo-sharing for share sheet |
| `src/adapters/expo/media-library.ts` | Wrap expo-media-library for save-to-gallery |

#### W3.2. `src/adapters/skia/`

**Goal**: Skia rendering isolation — shader plumbing, canvas, mask rendering.

| File | Purpose |
|------|---------|
| `src/adapters/skia/index.ts` | Barrel |
| `src/adapters/skia/runtime-effect-factory.ts` | Create Skia RuntimeEffect from shader source |
| `src/adapters/skia/shader-sources.ts` | Shader GLSL source strings (LUT apply, mask, frame) |
| `src/adapters/skia/preview-canvas.tsx` | Skia Canvas wrapper for preview rendering |
| `src/adapters/skia/mask-renderer.ts` | Region mask rendering helpers |

#### W3.3. `src/adapters/exif/`

**Goal**: EXIF metadata extraction isolated behind a clean interface.

| File | Purpose |
|------|---------|
| `src/adapters/exif/index.ts` | Barrel |
| `src/adapters/exif/exif-reader.ts` | EXIF metadata extraction wrapper |

#### W3.4. `src/services/storage/`

**Goal**: Local persistence for preferences, recents, and imported LUT metadata.

| File | Purpose |
|------|---------|
| `src/services/storage/index.ts` | Barrel |
| `src/services/storage/app-preferences.ts` | Key-value prefs (AsyncStorage or MMKV wrapper) |
| `src/services/storage/recent-items.ts` | Recent images list persistence |
| `src/services/storage/imported-lut-store.ts` | Imported LUT metadata persistence |

**Wave 3 total: ~16 files**
### Wave 4 — Rendering engines and parity

#### W4.1. Preview rendering service
- `src/services/image/preview-render.service.ts`
- responsive preview requests
- high-DPI handling

#### W4.2. CPU fallback rendering service
- fallback LUT application path
- deterministic parity-compatible output

#### W4.3. GPU/CPU parity suite
- identity LUT checks
- sample LUT checks
- parity tolerance documentation

#### W4.4. Full-resolution export renderer
- separate export render request path
- size preservation
- memory guardrails

### Wave 5 — Import pipelines

#### W5.1. Image import feature UI
- `src/features/import-image/`
- pick image
- loading state
- permission / empty state

#### W5.2. Image import orchestration service
- metadata extraction
- safe dimension checks
- import normalization

#### W5.3. LUT import feature UI
- `src/features/import-lut/`
- import entrypoint
- progress/errors

#### W5.4. LUT import services
- `.cube` import service
- Hald import service
- runtime model conversion

#### W5.5. Import hardening pass
- file checks
- mime checks
- size checks
- transparent PNG edge cases
- explicit user-facing errors

### Wave 6 — Editor shell and state flow

#### W6.1. Route entrypoints and editor shell
- `app/editor/[assetId].tsx`
- editor screen composition
- navigation wiring

#### W6.2. Editor store and session hooks
- `use-editor-session`
- editor store actions
- state serialization safety

#### W6.3. Undo/redo
- bounded history
- renderer-agnostic history snapshots

#### W6.4. Before/after comparison

### Wave 7 — Core editing tools

#### W7.1. Preset browser
- in-editor preset strip
- category tabs

#### W7.2. Adjustment pipeline
- exact operation order
- slider contracts
- preview updates

#### W7.3. Crop feature split
- crop overlay UI
- crop math and bounds
- crop preview integration

#### W7.4. Rotate feature split
- rotate UI controls
- rotate transform math
- preview/export parity

#### W7.5. Export image feature UI
- export entrypoint
- save/share actions

### Wave 8 — Interoperability and export quality

#### W8.1. `.cube` export service
- current LUT serialization
- generated LUT serialization

#### W8.2. `.cube` export feature UI
- save/share UX for Adobe interoperability

#### W8.3. Crop/export quality task split
- adapter-side anti-alias strategy
- export-service quality checks
- import/export regression tests

### Wave 9 — Region and framing features

#### W9.1. Selected-region effects foundation
- geometry masks
- mask state model
- masked preview application

#### W9.2. Selected-region export parity
- masked export output
- regression tests

#### W9.3. Framing toolkit foundation
- white border
- round edges
- serializable framing state

#### W9.4. Tape / overlay styles

#### W9.5. Manual on-canvas framing controls

### Wave 10 — Watermark, Quick Color Copy, and content

#### W10.1. Watermark service split
- EXIF extraction
- metadata formatting
- camera logo mapping

#### W10.2. Watermark feature UI

#### W10.3. Quick Color Copy core math
- Reinhard transfer math
- generated LUT model

#### W10.4. Quick Color Copy service layer
- feature orchestration
- save generated LUT

#### W10.5. Quick Color Copy UI

#### W10.6. LUT asset acquisition and conversion
- human-curated source packs
- license-safe only
- rename to mood/style descriptors

#### W10.7. LUT catalog bundle
- metadata JSON
- category mapping
- thumbnail path integrity

### Wave 11 — Product polish and release hardening

#### W11.1. Settings feature

#### W11.2. Localization infrastructure

#### W11.3. Rescue UX split
- shared feedback components
- per-feature error rendering

#### W11.4. Performance profiling
- large image preview
- large image export

#### W11.5. Diagnostics and crash reporting

#### W11.6. E2E flows
- pick → edit → export
- `.cube` import → apply → export
- invalid import recovery
- region effect flow

#### W11.7. Store prep and release assets

## Testing Strategy

### Unit tests
- LUT parse / validate / serialize
- interpolation
- export dimension policy
- crop math
- rotate transforms
- mask math
- framing math
- import guardrails

### Integration tests
- image import to editor state
- LUT selection to preview update
- rotate/crop/export state replay
- `.cube` import/export
- Quick Color Copy flow
- framing/export fidelity
- rescue UX rendering

### E2E tests
- pick photo → apply LUT → rotate → crop → compare → export
- import `.cube` → apply → export image
- import invalid PNG / invalid `.cube` shows correct error
- selected-region effect flow

## Non-Negotiable Quality Rules

1. No silent import failure.
2. No accidental export downscale.
3. No editor feature that works in preview but not in export.
4. No `.cube` interoperability that only works for one narrow test file.
5. No RAW work started in this plan.

## RAW Deferment Rule

RAW is not part of this build.

If strong user demand emerges later, start a separate architecture track for:
- native RAW decode
- background render jobs
- possible backend / worker path

This plan must stay focused on shipping the full non-RAW feature set cleanly.

## Risks to watch

1. export path accidentally tied to preview bitmap
2. shader path diverges from CPU/export path
3. `.cube` import/export support becomes partial or inconsistent
4. selected-region feature grows into a brush/retouch rewrite
5. 200+ LUT content packaging causes startup bloat
6. watermark/camera-logo feature creates licensing complexity

## Release Recommendation

Release order can still be Android-first operationally, but the codebase remains cross-platform from day 1.

## Review Notes

This plan intentionally replaces the older mixed-scope plan with a self-contained version that:
- keeps the chosen React Native + Expo dev-client + Skia direction
- stays local-first
- defers RAW explicitly
- preserves all major accepted features
- adds the newly discussed features as first-class deliverables
- removes dependency on missing `PLAN.md`, missing `TODOS.md`, and missing handoff draft references
