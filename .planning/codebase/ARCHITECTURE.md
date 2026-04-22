# Architecture

> Last mapped: 2026-04-22

## Architectural Pattern

**Layered Architecture** with strict module boundaries, enforced by convention and AGENTS.md files.

```
┌─────────────────────────────────────────────────────┐
│  app/  (Expo Router — routes, layouts, navigation)  │
├─────────────────────────────────────────────────────┤
│  src/features/  (Feature-sliced UI + hooks)         │
├─────────────────────────────────────────────────────┤
│  src/services/  (Orchestration, business logic)     │
├─────────────────────────────────────────────────────┤
│  src/adapters/  (Vendor API wrappers)               │
├─────────────────────────────────────────────────────┤
│  src/core/  (Pure TS domain models & contracts)     │
│  packages/lut-core/  (Pure TS LUT engine)           │
└─────────────────────────────────────────────────────┘
```

### Dependency Rules (Top-Down Only)

| Layer | Can import from | Must NOT import from |
|-------|-----------------|---------------------|
| `app/` | `@features/*`, `@theme`, `@i18n` | `@core/*`, `@services/*`, `@adapters/*` directly |
| `src/features/` | `@core/*`, `@services/*`, `@adapters/*`, `@ui/*`, `@theme` | Vendor packages directly |
| `src/services/` | `@core/*`, `@adapters/*`, `@lut-core` | `@features/*`, `@ui/*`, React components |
| `src/adapters/` | `@core/*`, vendor packages | `@features/*`, `@services/*` |
| `src/core/` | `@lut-core` | Expo, Skia, RN, route params |
| `packages/lut-core/` | Nothing external | React Native, Expo, Skia |

## Data Flow

### Single Photo Edit Flow

```
User picks photo (ImagePicker)
  → app/index.tsx routes to editor/[assetId]
    → EditorScreen creates EditState (immutable)
      → useEditorSession manages History<EditState>
        → buildPreviewRequest(state) → renderPreview() → PreviewCanvas
        → on export: buildExportRequest(state) → renderExport() → save to gallery
```

### Key Data Types

| Type | Location | Role |
|------|----------|------|
| `EditState` | `src/core/edit-session/edit-state.ts` | Immutable snapshot of all edits (LUT, adjustments, crop, rotation, blend, watermark, etc.) |
| `EditAction` | `src/core/edit-session/edit-action.ts` | Discriminated union of all edit operations (26 action types) |
| `History<T>` | `src/core/edit-session/history.ts` | Undo/redo stack: `{ past, present, future }` |
| `EditorState` | `src/features/editor/editor-reducer.ts` | UI state wrapping History + loading/error |
| `PreviewRequest` / `ExportRequest` | `src/core/image-pipeline/` | Renderer-agnostic transform pipeline specs |
| `LutTable` | `packages/lut-core/src/model/` | Parsed LUT data (`{ size, data: Float32Array }`) |

### Preview vs. Export Pipeline (Critical Invariant)

| Aspect | Preview | Export |
|--------|---------|--------|
| Max dimension | 1080px | 8192px |
| Quality | 0.8 (80%) | Configurable (high/medium/low) |
| Source | Downscaled URI | Original full-resolution URI |
| Service | `preview-render.service.ts` | `export-render.service.ts` |
| Reuse | **Never reuse** preview bitmap for export | Always re-process from original |

## State Management

- **No global state library** — React's `useReducer` pattern throughout
- `editorReducer` handles all edit state transitions via `EditAction` dispatch
- State is immutable — `Object.freeze()` on initial state, spread operators for updates
- History (undo/redo) managed through pure `pushHistory/undoHistory/redoHistory` functions
- Draft persistence: serialize `History<EditState>` to JSON on `expo-file-system`

## Error Architecture

Typed error hierarchy in `src/core/errors/`:

| Error File | Covers |
|-----------|--------|
| `import-errors.ts` | File too large, unsupported format, read failure |
| `export-errors.ts` | Dimension too large, OOM, write failure, permission denied |
| `lut-errors.ts` | Malformed .cube, unsupported size, parse failure |
| `render-errors.ts` | Shader compile failure, runtime error |
| `error-messages.ts` | User-facing copy for all error types |

## Entry Points

| Entry | File | Purpose |
|-------|------|---------|
| App root | `app/_layout.tsx` | SafeAreaProvider → ThemeProvider → Stack navigator |
| Home screen | `app/index.tsx` → `src/features/home/home.screen.tsx` | Draft grid + navigation |
| Editor | `app/editor/[assetId].tsx` → `src/features/editor/editor.screen.tsx` | Main editing experience |
| Import | `app/import/index.tsx` | Image/LUT import routing |
| Export | `app/export/index.tsx` | Image/LUT export routing |
| Presets | `app/presets/index.tsx` | Preset LUT browser |
| Settings | `app/settings/index.tsx` | App preferences |
| Batch | `app/batch/index.tsx` | Batch photo processing |

## GPU Rendering (Skia)

Skia integration follows a multi-level approach:

1. **Shader Sources** (`adapters/skia/shader-sources.ts`) — SkSL code for LUT, mask, frame effects
2. **Specialized Shaders** — `artistic-look-shader.ts` (color matrix + vignette + grain), `clarity-shader.ts` (Laplacian sharpness)
3. **Runtime Effect Factory** — Compiles SkSL → Skia RuntimeEffect
4. **Preview Canvas** — React component with Skia `Canvas` + `Image` + blend layer compositing
5. **Offscreen Render** — GPU export without visible canvas

### LUT Application (Currently Placeholder)

The LUT shader in `shader-sources.ts` contains a **placeholder** for strip texture lookup (tagged "Wave 4"). The actual GPU LUT application is not yet wired — preview currently uses CPU-side image manipulation only.
