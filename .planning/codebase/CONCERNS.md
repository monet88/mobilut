# Concerns & Technical Debt

> Last mapped: 2026-04-22

## High Priority

### 1. LUT Shader is a Placeholder

**Location**: `src/adapters/skia/shader-sources.ts` (line 14)

The `LUT_APPLY_SHADER` contains a comment "Placeholder for strip texture lookup in Wave 4." The shader currently reads input color and returns it unmodified — it does not actually apply any LUT transformation on the GPU. All LUT preview is done via CPU-side processing, which limits real-time performance for large images.

**Impact**: Core feature is not GPU-accelerated. Preview may lag on large images.

### 2. Design Token Mismatch

**Location**: `src/theme/tokens.ts` vs `DESIGN.md`

The design system spec (`DESIGN.md`) defines:
- Primary accent: Mobilut Teal `#00B4A6`
- Surfaces: `#000000`, `#0A0A0A`, `#141414`, `#1C1C1E`
- Semantic: success `#34C759`, warning `#FF9F0A`, error `#FF453A`

But `src/theme/tokens.ts` still uses legacy values:
- Accent: `#FF6B35` (orange, not teal)
- Error: `#FF4444` (not `#FF453A`)
- Success: `#44FF88` (not `#34C759`)
- Warning: `#FFAA44` (not `#FF9F0A`)

The design system document and actual code tokens are **not aligned**. This means the running app does not match the intended design.

### 3. Placeholder Modules (Empty Barrels)

Three modules are empty placeholders with no implementation:

| Module | File | Status |
|--------|------|--------|
| `src/hooks/index.ts` | `export {}` | Placeholder, no hooks exported |
| `src/lib/index.ts` | `export {}` | Placeholder, no utilities exported |
| `src/services/diagnostics/index.ts` | `export {}` | Placeholder, no diagnostics |

These exist in the module structure but contribute nothing. The `diagnostics` module is meant for error/performance tracking but has no implementation.

## Medium Priority

### 4. No Test Setup / Shared Mocks

**Location**: `jest.setup.ts`

The global test setup file is a placeholder (`export {}`). There are no shared mocks configured. Each test file independently mocks Expo/Skia modules, likely leading to duplication and inconsistency across the 33 test files.

### 5. Dead Code: `computeSmartFilterCorrection`

**Location**: `src/core/stylistic/smart-filter-model.ts` (line 24)

Contains a TODO comment: `// TODO(phase-2): computeSmartFilterCorrection is defined but never called.`

This function exists in the codebase but is not invoked anywhere.

### 6. AsyncStorage Direct Import in Services

**Location**: `src/services/storage/app-preferences.ts` (line 1)

`app-preferences.ts` directly imports `@react-native-async-storage/async-storage` instead of going through `@adapters/`. This violates the architectural rule that services should use adapters, not vendor packages directly. Other storage services correctly use `@adapters/expo/file-system`.

### 7. Test Coverage Gaps

Significant areas lack test coverage (see `TESTING.md` for full list):
- All Skia adapters (9 files) — partially expected since GPU shaders are hard to unit test
- All UI components (`src/ui/`) — no component tests for primitives, layout, feedback
- LUT services (`src/services/lut/`) — import/export/library services
- Several feature modules: watermark, framing, import-lut, export-lut, preset-browser
- Export pipeline: `export-render.service.ts`, `export-request-builder.ts`

### 8. New Architecture Disabled

**Location**: `app.config.js`

Both iOS and Android have `newArchEnabled: false`. React Native 0.76 supports the new architecture, and Expo 52 is compatible. Remaining on old arch may limit future performance optimizations and access to new APIs.

## Low Priority

### 9. Postinstall Workaround

**Location**: `scripts/fix-rn-screens-codegen.js`, `package.json` postinstall

A postinstall script patches react-native-screens codegen. This is likely a temporary workaround for a compatibility issue and should be reviewed when upgrading dependencies.

### 10. Test App IDs in Config

**Location**: `app.json`, `app.config.js`

AdMob test IDs (`ca-app-pub-3940256099942544~*`) are hardcoded in config files. While correct for development, production IDs should be managed via environment variables or build-time configuration to avoid accidentally shipping test IDs.

### 11. Hardcoded Error Strings in Layout

**Location**: `app/_layout.tsx` (lines 57-60)

The `ErrorBoundary` in the root layout uses hardcoded hex colors (`#FF4444`, `#AAAAAA`, `#0A0A0A`) instead of importing from `@theme/tokens`. While minor, this is inconsistent with the theme-token convention.

### 12. No EXIF Integration Tests

**Location**: `src/adapters/exif/exif-reader.ts`

The EXIF reader adapter exists but has no tests. EXIF metadata is used for watermark display, so failures here could silently produce incorrect output.

## Architecture Observations

### What's Working Well

- **Module boundary discipline** is strong — AGENTS.md files document and enforce boundaries
- **Immutable state model** (EditState + History) is well-designed and consistently applied
- **Feature-sliced architecture** keeps features self-contained
- **Adapter pattern** cleanly isolates vendor dependencies
- **Error hierarchy** is typed and comprehensive
- **LUT core isolation** in `packages/lut-core/` keeps pure logic cleanly separated

### Areas to Watch

- **Preview pipeline complexity**: `preview-render.service.ts` (179 lines) handles rotation, crop, resize sequentially — each step creates a new URI. Memory pressure could grow with complex edit chains.
- **Draft serialization**: `Float32Array` → `number[]` → JSON serialization in `draft-store.ts` may produce very large files for high-resolution custom LUTs.
- **Batch processing**: Models and services exist (`src/core/batch/`, `src/services/batch/`, `src/features/batch/`) but the feature is described as "planned for a later milestone" in AGENTS.md — yet substantial code is already written.
