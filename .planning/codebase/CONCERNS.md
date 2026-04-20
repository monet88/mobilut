# Concerns

**Mapped:** 2026-04-20

## Critical Concerns

### 1. LUT Shader is a Placeholder
**File:** `src/adapters/skia/shader-sources.ts`
**Severity:** HIGH

The `LUT_APPLY_SHADER` GLSL code contains a comment "Placeholder for strip texture lookup in Wave 4" and does NOT actually apply the LUT:
```glsl
float _unused = r + g + b + intensity + lutStrip.eval(coord).a;
return color;  // Returns ORIGINAL color unchanged
```

The shader calculates LUT coordinates but discards them, returning the unmodified pixel. LUT color grading is **not functional** in the current preview/export pipeline.

### 2. Theme Token Mismatch with DESIGN.md
**Files:** `src/theme/tokens.ts` vs `DESIGN.md`
**Severity:** MEDIUM

The theme tokens don't match the design system spec:
| Token | `tokens.ts` | `DESIGN.md` |
|-------|-------------|-------------|
| accent | `#FF6B35` (orange) | `#00B4A6` (teal) |
| background | `#0A0A0A` | `#000000` |
| surface | `#1A1A1A` | `#0A0A0A` |
| error | `#FF4444` | `#FF453A` |

The running code uses different colors than the design spec. This needs reconciliation before UI polish.

### 3. Preview ≠ Export Not Fully Wired
**Files:** `src/services/image/preview-render.service.ts`, `src/services/image/export-render.service.ts`
**Severity:** MEDIUM

`renderPreview()` currently returns a passthrough result (same URI, scaled dimensions) without actually running transforms through the Skia pipeline. The preview/export separation architecture exists in types but the actual GPU rendering pipeline is incomplete.

## Technical Debt

### Placeholder Modules
Three modules are empty barrels with TODO comments:
- `src/hooks/index.ts` — `// TODO: export module contents`
- `src/lib/index.ts` — `// TODO: export module contents`
- `src/services/diagnostics/index.ts` — `// TODO: export module contents`

### AdMob Test IDs in Config
**File:** `app.config.js`

Google AdMob is configured with test app IDs. These must be replaced with production IDs before store release:
- Android: `ca-app-pub-3940256099942544~3347511713` (test)
- iOS: `ca-app-pub-3940256099942544~1458002511` (test)

### Anonymous Bundle Identifiers
- iOS: `com.anonymous.lut-app`
- Android: `com.anonymous.lutapp`

These are placeholder identifiers that need to be updated to real app identifiers before release.

### i18n Default Language
**File:** `src/i18n/index.ts`

Default language is set to `'vi'` (Vietnamese), but AGENTS.md says v1 UI is English-only. This may cause confusion — the default should probably be `'en'` for v1.

## Fragile Areas

### New Architecture Disabled
Both iOS and Android have `newArchEnabled: false`. This pins the app to the old architecture, which may limit performance and compatibility with newer RN libraries.

### react-native-screens Codegen Patch
A postinstall script (`scripts/fix-rn-screens-codegen.js`) patches react-native-screens. This is fragile and may break on version updates.

### No Error Boundary at Feature Level
The root layout has an `ErrorBoundary` class component, but there are no per-feature error boundaries. A Skia shader crash could take down the entire app.

## Performance Considerations

### Image Size Constraints
- `pipeline-constraints.ts` defines `MAX_PREVIEW_DIMENSION` for preview downscaling
- Export must handle full-resolution images without OOM
- No lazy loading pattern for preset thumbnails observed

### LUT Table Memory
- `LutTable` uses `Float32Array` backed storage
- A 64³ LUT = 64×64×64×3×4 = ~3MB per table
- Multiple LUTs loaded simultaneously could be significant on low-memory devices

## Security

### No Sensitive Data
- No authentication, no tokens, no API keys (except test AdMob IDs)
- All data is local — no network attack surface in v1
- File system access limited to user-selected photos and documents

### Input Validation
- .cube parser validates size, value ranges (0..1), data count — good
- HaldCLUT parser validates PNG dimensions — good
- Image import validates file size and format — good
