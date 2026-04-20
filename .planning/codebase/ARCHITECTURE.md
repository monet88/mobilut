# Architecture

**Mapped:** 2026-04-20

## Pattern

**Layered feature-based architecture** with strict module boundaries:

```
┌──────────────────────────────────────────────────┐
│  app/             Routes & Navigation            │
├──────────────────────────────────────────────────┤
│  src/features/    Feature UI + Hooks             │
├──────────────────────────────────────────────────┤
│  src/services/    Orchestration                  │
├──────────────────────────────────────────────────┤
│  src/core/        Domain Types & Rules           │
├──────────────────────────────────────────────────┤
│  src/adapters/    Expo/Skia/EXIF Wrappers        │
├──────────────────────────────────────────────────┤
│  packages/lut-core/  Pure TS LUT Math            │
└──────────────────────────────────────────────────┘
```

Dependencies flow **downward only**. No layer may import from above.

## Module Boundaries

| Module | Responsibility | MUST NOT contain |
|--------|---------------|------------------|
| `app/` | Routes, layouts, navigation wiring | Business logic, parser logic, shader logic |
| `src/core/` | Pure contracts, domain rules, types | Expo imports, Skia imports, route params |
| `src/features/` | Feature UI, hooks, screen composition | Direct vendor API calls |
| `src/services/` | Orchestration, preview/export separation | UI components |
| `src/adapters/` | Wrappers for Expo modules, Skia, EXIF | Business logic |
| `packages/lut-core/` | LUT parse/validate/serialize/interpolate | React Native code, Expo imports |

## Key Abstractions

### EditState (Immutable, Renderer-Agnostic)
- Defined in `src/core/edit-session/edit-state.ts`
- Central model holding all edits: preset, adjustments, rotation, crop, region mask, framing, watermark
- All fields `readonly`, constructed via `Object.freeze()`
- **No Skia types** — intentionally renderer-agnostic

### EditAction (Discriminated Union)
- Defined in `src/core/edit-session/edit-action.ts`
- 18 action types covering all edit operations
- Consumed by `editor-reducer.ts` in features layer

### Transform Pipeline
- `src/core/image-pipeline/transform.ts` — discriminated union of pipeline ops
- `src/core/image-pipeline/preview-request.ts` / `export-request.ts` — separate request types
- **Preview ≠ Export**: Preview optimized for responsiveness (downscaled), export for full resolution

### LutTable (Pure Math)
- `packages/lut-core/src/model/lut-table.ts` — `Float32Array`-backed LUT storage
- Parse → validate → create table → serialize pipeline
- Supports `.cube` (text) and HaldCLUT PNG (pixel data) formats

## Data Flow

### Photo Edit Flow
```
Image Picker → ImageAsset → EditState → PreviewRequest → Skia Canvas
                                ↓
                         [user edits via EditActions]
                                ↓
                         ExportRequest → Image Manipulator → Media Library
```

### LUT Import Flow
```
Document Picker → File System → cube-parser → LutTable → ImportedLutRecord → AsyncStorage
                                 (or)
                 Image Picker → hald-parser → LutTable → ImportedLutRecord → AsyncStorage
```

### Rendering Pipeline
```
EditState → buildPreviewRequest() → Transform[] → Skia Shaders → Canvas
                                                    ↓
                                             LUT_APPLY_SHADER
                                             MASK_SHADER
                                             FRAME_SHADER
```

## Entry Points

| Entry | File | Purpose |
|-------|------|---------|
| App entry | `app/_layout.tsx` | RootLayout: SafeAreaProvider → ThemeProvider → Stack |
| Home | `app/index.tsx` | Landing screen |
| Editor | `app/editor/[assetId].tsx` | Dynamic route for photo editing |
| Import | `app/import/index.tsx` | Image import screen |
| Export | `app/export/index.tsx` | Export screen |
| Presets | `app/presets/index.tsx` | Preset browser screen |
| Settings | `app/settings/index.tsx` | App settings |

## State Management

- **No global state library** — React state + useReducer per feature
- **Edit session**: `useEditorSession` hook wraps reducer + undo/redo history
- **Persistence**: AsyncStorage for imported LUTs, preferences, recent items
- **Theme**: React Context via `ThemeProvider` in `src/theme/use-theme.tsx`

## Error Architecture

Typed error classes with i18n-ready messages:
- `ImportImageError` (`src/core/errors/import-errors.ts`)
- `RenderError` (`src/core/errors/render-errors.ts`)
- `ExportError` (`src/core/errors/export-errors.ts`)
- `LutError` (`src/core/errors/lut-errors.ts`)

Each error carries: `code` (machine-readable), `message` (developer), `userMessageKey` (i18n key).

## i18n Architecture

- i18next + react-i18next
- Two locales: English (`en.ts`) and Vietnamese (`vi.ts`)
- Default language: Vietnamese (`'vi'`)
- v1 UI ships English-only per product direction, but i18n infrastructure is ready
