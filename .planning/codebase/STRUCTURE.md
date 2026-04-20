# Project Structure

**Mapped:** 2026-04-20

## Directory Layout

```
mobilut/
├── app/                        # Expo Router routes (navigation only)
│   ├── _layout.tsx             # Root layout: SafeAreaProvider → ThemeProvider → Stack
│   ├── index.tsx               # Home screen
│   ├── editor/
│   │   └── [assetId].tsx       # Dynamic editor route
│   ├── export/
│   │   └── index.tsx           # Export screen
│   ├── import/
│   │   └── index.tsx           # Import screen
│   ├── presets/
│   │   └── index.tsx           # Preset browser screen
│   └── settings/
│       └── index.tsx           # Settings screen
│
├── src/
│   ├── adapters/               # Vendor wrappers (no business logic)
│   │   ├── exif/
│   │   │   ├── exif-reader.ts
│   │   │   └── index.ts
│   │   ├── expo/
│   │   │   ├── document-picker.ts
│   │   │   ├── file-system.ts
│   │   │   ├── image-manipulator.ts
│   │   │   ├── image-picker.ts
│   │   │   ├── media-library.ts
│   │   │   ├── sharing.ts
│   │   │   └── index.ts
│   │   └── skia/
│   │       ├── preview-canvas.tsx
│   │       ├── runtime-effect-factory.ts
│   │       ├── shader-sources.ts
│   │       ├── mask-renderer.ts
│   │       └── index.ts
│   │
│   ├── core/                   # Pure domain types & rules (no vendor imports)
│   │   ├── edit-session/
│   │   │   ├── edit-state.ts       # EditState, AdjustmentParams, CropParams, etc.
│   │   │   ├── edit-action.ts      # EditAction discriminated union
│   │   │   ├── history.ts          # Undo/redo stack
│   │   │   ├── session-selectors.ts
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   ├── error-messages.ts
│   │   │   ├── export-errors.ts
│   │   │   ├── import-errors.ts
│   │   │   ├── lut-errors.ts
│   │   │   ├── render-errors.ts
│   │   │   └── index.ts
│   │   ├── image-pipeline/
│   │   │   ├── export-request.ts
│   │   │   ├── image-asset.ts
│   │   │   ├── pipeline-constraints.ts
│   │   │   ├── preview-request.ts
│   │   │   ├── transform.ts
│   │   │   └── index.ts
│   │   └── lut/
│   │       ├── preset-model.ts
│   │       ├── runtime-lut.ts
│   │       └── index.ts
│   │
│   ├── features/               # Feature UI + hooks (per-feature folders)
│   │   ├── editor/
│   │   │   ├── editor.screen.tsx       # Main editor screen
│   │   │   ├── editor-reducer.ts       # EditAction reducer
│   │   │   ├── use-editor-session.ts   # Session hook (reducer + history)
│   │   │   ├── before-after.tsx        # Before/after comparison
│   │   │   ├── components/
│   │   │   │   ├── adjustment-panel.tsx
│   │   │   │   ├── crop-overlay.tsx
│   │   │   │   └── rotate-controls.tsx
│   │   │   ├── region-effects/
│   │   │   │   ├── region-mask-editor.tsx
│   │   │   │   └── use-region-mask.ts
│   │   │   └── index.ts
│   │   ├── export-image/
│   │   │   ├── export-image.screen.tsx
│   │   │   ├── use-export-image.ts
│   │   │   └── index.ts
│   │   ├── export-lut/
│   │   │   ├── export-lut.screen.tsx
│   │   │   ├── use-export-lut.ts
│   │   │   └── index.ts
│   │   ├── framing-toolkit/
│   │   │   ├── framing-panel.tsx
│   │   │   ├── use-framing.ts
│   │   │   └── index.ts
│   │   ├── import-image/
│   │   │   ├── import-image.screen.tsx
│   │   │   ├── use-import-image.ts
│   │   │   └── index.ts
│   │   ├── import-lut/
│   │   │   ├── import-lut.screen.tsx
│   │   │   ├── use-import-lut.ts
│   │   │   └── index.ts
│   │   ├── preset-browser/
│   │   │   ├── preset-browser.tsx
│   │   │   ├── use-preset-browser.ts
│   │   │   └── index.ts
│   │   ├── quick-color-copy/
│   │   │   ├── quick-color-copy.screen.tsx
│   │   │   ├── reinhard-transfer.ts
│   │   │   ├── use-quick-color-copy.ts
│   │   │   └── index.ts
│   │   ├── settings/
│   │   │   ├── settings.screen.tsx
│   │   │   └── index.ts
│   │   └── watermark/
│   │       ├── watermark-panel.tsx
│   │       ├── use-watermark.ts
│   │       └── index.ts
│   │
│   ├── services/               # Orchestration (no UI)
│   │   ├── diagnostics/
│   │   │   └── index.ts
│   │   ├── image/
│   │   │   ├── preview-render.service.ts
│   │   │   ├── export-render.service.ts
│   │   │   ├── cpu-render.service.ts
│   │   │   └── index.ts
│   │   ├── lut/
│   │   │   ├── lut-import.service.ts
│   │   │   ├── lut-export.service.ts
│   │   │   ├── lut-library.service.ts
│   │   │   └── index.ts
│   │   └── storage/
│   │       ├── app-preferences.ts
│   │       ├── imported-lut-store.ts
│   │       ├── recent-items.ts
│   │       └── index.ts
│   │
│   ├── hooks/                  # Shared hooks (placeholder)
│   │   └── index.ts
│   ├── i18n/                   # Internationalization
│   │   ├── en.ts
│   │   ├── vi.ts
│   │   └── index.ts
│   ├── lib/                    # Shared utilities (placeholder)
│   │   └── index.ts
│   ├── theme/                  # Design tokens & provider
│   │   ├── tokens.ts
│   │   ├── use-theme.tsx
│   │   └── index.ts
│   └── ui/                     # Shared UI components
│       ├── feedback/
│       │   ├── error-banner.tsx
│       │   ├── loading-overlay.tsx
│       │   ├── toast.tsx
│       │   └── index.ts
│       ├── layout/
│       │   ├── bottom-sheet.tsx
│       │   ├── safe-area-view.tsx
│       │   └── index.ts
│       └── primitives/
│           ├── button.tsx
│           ├── icon-button.tsx
│           ├── slider.tsx
│           ├── text.tsx
│           └── index.ts
│
├── packages/
│   └── lut-core/               # Pure TS LUT library (no RN)
│       ├── src/
│       │   ├── cube/           # .cube format parse/validate/serialize
│       │   ├── hald/           # HaldCLUT PNG parse/validate/convert
│       │   ├── interpolate/    # Trilinear interpolation, strip sampler
│       │   ├── model/          # LutTable, LutMetadata, ParseResult
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── __tests__/                  # Test files
│   ├── features/
│   ├── helpers/
│   ├── import-export/
│   ├── lut-core/
│   └── services/
│
├── docs/                       # Documentation & references
│   ├── mobilut-ui-sample/
│   └── superpowers/
│
├── assets/                     # Static assets
├── scripts/                    # Build scripts
│   └── fix-rn-screens-codegen.js
└── tools/                      # Dev tooling
```

## File Count by Module

| Module | .ts files | .tsx files | Total |
|--------|-----------|------------|-------|
| `app/` | 0 | 7 | 7 |
| `src/core/` | 15 | 0 | 15 |
| `src/features/` | 14 | 14 | 28 |
| `src/services/` | 9 | 0 | 9 |
| `src/adapters/` | 8 | 1 | 9 |
| `src/ui/` | 0 | 7 | 7 |
| `src/theme/` | 1 | 1 | 2 |
| `src/i18n/` | 3 | 0 | 3 |
| `src/hooks/` | 1 | 0 | 1 |
| `src/lib/` | 1 | 0 | 1 |
| `packages/lut-core/` | 16 | 0 | 16 |
| `__tests__/` | 12 | 1 | 13 |
| **Total** | | | **~111** |

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Route files | `index.tsx` or `[param].tsx` | `app/editor/[assetId].tsx` |
| Screen components | `{name}.screen.tsx` | `editor.screen.tsx` |
| Hooks | `use-{name}.ts` | `use-editor-session.ts` |
| Services | `{name}.service.ts` | `preview-render.service.ts` |
| Types | `{name}.ts` in core | `edit-state.ts`, `transform.ts` |
| Barrel exports | `index.ts` per directory | Every module has one |
| Test files | `{name}.test.ts(x)` | `cube-parser.test.ts` |

## Key Locations

| What | Where |
|------|-------|
| Design system tokens | `src/theme/tokens.ts` |
| Design document | `DESIGN.md` (root) |
| GLSL shaders | `src/adapters/skia/shader-sources.ts` |
| LUT parsing core | `packages/lut-core/src/cube/cube-parser.ts` |
| Central edit model | `src/core/edit-session/edit-state.ts` |
| Module boundary docs | `src/*/AGENTS.md` (per-module) |
| Architecture decisions | `docs/adr/` (mentioned but may be empty) |
