# Project Structure

> Last mapped: 2026-04-22

## Root Directory

```
mobilut/
├── app/                    # Expo Router file-system routes
├── src/                    # Application source code
│   ├── core/              # Pure domain contracts & types
│   ├── features/          # Feature-sliced UI modules
│   ├── services/          # Orchestration layer
│   ├── adapters/          # Vendor API wrappers
│   ├── ui/                # Shared UI components
│   ├── theme/             # Design tokens & theme provider
│   ├── hooks/             # Shared hooks (placeholder)
│   ├── lib/               # Shared utilities (placeholder)
│   └── i18n/              # Internationalization
├── packages/
│   └── lut-core/          # Pure TS LUT engine (npm workspace)
├── __tests__/             # All test files (not colocated)
├── assets/                # Static assets (fixtures, images, presets)
├── scripts/               # Build scripts
├── docs/                  # Documentation
├── android/               # Native Android project
├── ios/                   # Native iOS project
└── [config files]         # See below
```

## Route Structure (`app/`)

```
app/
├── _layout.tsx             # Root layout: SafeAreaProvider → ThemeProvider → Stack
├── index.tsx               # Home → HomeScreen (draft grid)
├── editor/
│   └── [assetId].tsx       # Dynamic route → EditorScreen
├── batch/
│   └── index.tsx           # Batch processing → BatchScreen
├── import/
│   └── index.tsx           # Import routing (image + LUT)
├── export/
│   └── index.tsx           # Export routing (image + LUT)
├── presets/
│   └── index.tsx           # Preset browser → PresetBrowserScreen
└── settings/
    └── index.tsx           # Settings → SettingsScreen
```

Routes are thin wrappers that import feature screens and pass `router.push()` callbacks.

## Core Layer (`src/core/`)

```
core/
├── AGENTS.md               # Module contract documentation
├── batch/                  # Batch processing models
│   ├── batch-session-model.ts
│   ├── batch-workspace-model.ts
│   └── index.ts
├── blend/                  # Layer blend mode types
│   ├── blend-model.ts      # BlendMode, BlendLayer, BlendParams
│   └── index.ts
├── draft/                  # Draft persistence model
│   ├── draft-model.ts      # DraftRecord, DraftSummary
│   └── index.ts
├── edit-session/           # Central editing model
│   ├── edit-state.ts       # EditState (the big immutable state)
│   ├── edit-action.ts      # EditAction discriminated union (26 types)
│   ├── history.ts          # History<T> undo/redo
│   ├── session-selectors.ts
│   └── index.ts
├── errors/                 # Typed error hierarchy
│   ├── error-messages.ts   # User-facing copy
│   ├── export-errors.ts
│   ├── import-errors.ts
│   ├── lut-errors.ts
│   ├── render-errors.ts
│   └── index.ts
├── image-pipeline/         # Pipeline contracts
│   ├── export-request.ts
│   ├── image-asset.ts
│   ├── pipeline-constraints.ts  # MAX_PREVIEW_DIMENSION, MAX_EXPORT_DIMENSION, etc.
│   ├── preview-request.ts
│   ├── transform.ts        # Transform union type
│   └── index.ts
├── lut/                    # LUT domain types
│   ├── preset-color-matrix.ts
│   ├── preset-model.ts
│   ├── runtime-lut.ts
│   └── index.ts
├── render/                 # Render transform contracts
│   ├── artistic-look-transform.ts
│   ├── pro-clarity-transform.ts
│   └── smart-filter-transform.ts
└── stylistic/              # Stylistic effect models
    ├── artistic-look-model.ts  # ArtisticLookStyle, color matrices
    ├── pro-clarity-model.ts    # ProClarityParams
    ├── smart-filter-model.ts   # SmartFilterParams
    └── index.ts
```

## Features Layer (`src/features/`)

Each feature follows the pattern: `index.ts` (barrel) + `*.screen.tsx` + `use-*.ts` (hook).

```
features/
├── AGENTS.md
├── batch/                  # Batch photo processing
│   ├── batch.screen.tsx
│   ├── batch-photo-picker.tsx
│   ├── batch-preview.tsx
│   ├── batch-thumbnail-strip.tsx
│   ├── use-batch-session.ts
│   └── index.ts
├── editor/                 # Main editor (largest feature)
│   ├── editor.screen.tsx   # 9.3KB — primary editing UI
│   ├── editor-reducer.ts   # State management (editorReducer)
│   ├── use-editor-session.ts
│   ├── before-after.tsx
│   ├── tool-sheet.tsx
│   ├── blend-sheet.tsx     # 9.2KB — blend mode selection
│   ├── artistic-look-sheet.tsx
│   ├── pro-clarity-sheet.tsx
│   ├── smart-filter-sheet.tsx
│   ├── modification-log-sheet.tsx
│   ├── components/
│   │   ├── adjustment-panel.tsx
│   │   ├── crop-overlay.tsx
│   │   └── rotate-controls.tsx
│   ├── region-effects/
│   │   ├── region-mask-editor.tsx
│   │   └── use-region-mask.ts
│   └── index.ts
├── export-image/           # Export edited photo
│   ├── export-image.screen.tsx
│   ├── use-export-image.ts
│   └── index.ts
├── export-lut/             # Export LUT as .cube
│   ├── export-lut.screen.tsx
│   ├── use-export-lut.ts
│   └── index.ts
├── framing-toolkit/        # Border/frame effects
│   ├── framing-panel.tsx
│   ├── use-framing.ts
│   └── index.ts
├── home/                   # Home screen with draft grid
│   ├── home.screen.tsx
│   ├── draft-grid.tsx
│   ├── home-ad-banner.tsx
│   ├── use-drafts.ts
│   └── index.ts
├── import-image/           # Image picker flow
│   ├── import-image.screen.tsx
│   ├── use-import-image.ts
│   └── index.ts
├── import-lut/             # LUT file picker flow
│   ├── import-lut.screen.tsx
│   ├── use-import-lut.ts
│   └── index.ts
├── preset-browser/         # Browse/apply preset LUTs
│   ├── preset-browser.tsx
│   ├── use-preset-browser.ts
│   └── index.ts
├── quick-color-copy/       # Color transfer between images
│   ├── quick-color-copy.screen.tsx
│   ├── reinhard-transfer.ts  # Reinhard color transfer algorithm
│   ├── use-quick-color-copy.ts
│   └── index.ts
├── settings/               # App preferences
│   ├── settings.screen.tsx
│   └── index.ts
└── watermark/              # Watermark overlay
    ├── watermark-panel.tsx
    ├── use-watermark.ts
    └── index.ts
```

## Services Layer (`src/services/`)

```
services/
├── AGENTS.md
├── ads/                    # Ad manager
│   ├── ad-manager.ts       # Init singleton, unit ID, render policy
│   └── index.ts
├── batch/                  # Batch processing orchestration
│   ├── batch-export-queue.ts
│   ├── batch-workspace.ts
│   ├── thumbnail-cache.ts
│   └── index.ts
├── diagnostics/            # Error/perf tracking (placeholder)
│   └── index.ts
├── image/                  # Image rendering pipeline
│   ├── preview-render.service.ts   # buildPreviewRequest + renderPreview
│   ├── export-render.service.ts    # renderExport
│   ├── export-request-builder.ts   # buildExportRequest from EditState
│   ├── cpu-render.service.ts       # CPU fallback rendering
│   ├── preset-render.service.ts    # Preset thumbnail rendering
│   └── index.ts
├── lut/                    # LUT file operations
│   ├── lut-import.service.ts
│   ├── lut-export.service.ts
│   ├── lut-library.service.ts
│   └── index.ts
└── storage/                # Persistence
    ├── app-preferences.ts  # AsyncStorage-based prefs
    ├── draft-store.ts      # File-system draft CRUD
    ├── imported-lut-store.ts
    ├── recent-items.ts
    └── index.ts
```

## Adapters Layer (`src/adapters/`)

```
adapters/
├── AGENTS.md
├── ads/                    # Google Mobile Ads wrapper
│   ├── mobile-ads.tsx
│   └── index.ts
├── exif/                   # EXIF metadata reader
│   ├── exif-reader.ts
│   └── index.ts
├── expo/                   # Expo module wrappers
│   ├── document-picker.ts
│   ├── file-system.ts
│   ├── image-manipulator.ts
│   ├── image-picker.ts
│   ├── media-library.ts
│   ├── sharing.ts
│   └── index.ts
└── skia/                   # Skia rendering wrappers
    ├── artistic-look-shader.ts
    ├── blend-shader.ts
    ├── clarity-shader.ts
    ├── mask-renderer.ts
    ├── offscreen-render.tsx
    ├── preview-canvas.tsx
    ├── runtime-effect-factory.ts
    ├── shader-sources.ts
    └── index.ts
```

## Shared UI (`src/ui/`)

```
ui/
├── AGENTS.md
├── primitives/            # Atomic components
│   ├── button.tsx
│   ├── icon-button.tsx
│   ├── slider.tsx         # 4.6KB — key editing control
│   ├── text.tsx
│   └── index.ts
├── layout/                # Layout containers
│   ├── bottom-sheet.tsx
│   ├── safe-area-view.tsx
│   └── index.ts
└── feedback/              # User feedback
    ├── error-banner.tsx
    ├── loading-overlay.tsx
    ├── toast.tsx
    └── index.ts
```

## LUT Core Package (`packages/lut-core/`)

```
lut-core/
├── AGENTS.md
├── package.json            # @lut-app/lut-core (private)
├── tsconfig.json
└── src/
    ├── index.ts            # Barrel: model, cube, hald, interpolate
    ├── cube/               # .cube file parser + serializer
    ├── hald/               # HaldCLUT PNG encode/decode
    ├── model/              # LutData, LutTable, ParseResult
    └── interpolate/        # Trilinear/tetrahedral interpolation
```

## Test Structure (`__tests__/`)

```
__tests__/
├── app-layout.test.tsx     # Root layout test
├── adapters/
│   └── image-picker.test.ts
├── core/
│   └── stylistic/
├── editor/
│   └── .gitkeep
├── features/               # 16 test files (largest test category)
│   ├── home.screen.test.tsx
│   ├── editor.screen.test.tsx
│   ├── batch.screen.test.tsx
│   ├── blend-sheet.test.tsx
│   ├── use-editor-session.test.ts
│   ├── use-batch-session.test.ts
│   └── ... (10 more)
├── helpers/
│   └── test-utils.ts
├── import-export/
│   └── cube-roundtrip.test.ts
├── lut-core/               # 8 test files
│   ├── cube-parser.test.ts
│   ├── cube-serializer.test.ts
│   ├── cube-validator.test.ts
│   ├── trilinear.test.ts
│   └── ... (4 more)
└── services/               # 6 test files
    ├── draft-store.test.ts
    ├── preview-render.test.ts
    ├── batch-export-queue.test.ts
    └── ... (3 more)
```

## Configuration Files

| File | Purpose |
|------|---------|
| `app.config.js` | Expo config (slug, platforms, plugins, bundle IDs) |
| `app.json` | AdMob app IDs |
| `babel.config.js` | Presets + module-resolver + reanimated plugin |
| `metro.config.js` | Watch folders, symlink support, module resolution |
| `tsconfig.json` | TypeScript config with path aliases |
| `jest.config.js` | Test runner config with module aliases |
| `jest.setup.ts` | Global test setup (placeholder) |
| `eas.json` | EAS Build profiles |
| `.eslintrc.js` | ESLint config |
| `.prettierrc` | Prettier config |
| `DESIGN.md` | Full design system specification |
| `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` | AI agent instructions |

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Route files | kebab-case, `index.tsx` or `[param].tsx` | `app/editor/[assetId].tsx` |
| Feature screens | `<name>.screen.tsx` | `editor.screen.tsx` |
| Feature hooks | `use-<name>.ts` | `use-editor-session.ts` |
| Services | `<name>.service.ts` | `preview-render.service.ts` |
| Models | `<name>-model.ts` | `blend-model.ts` |
| Error files | `<domain>-errors.ts` | `export-errors.ts` |
| Barrel exports | `index.ts` | Every module has one |
| Test files | `<source-name>.test.ts(x)` | `editor.screen.test.tsx` |
