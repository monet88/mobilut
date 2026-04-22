# External Integrations

> Last mapped: 2026-04-22

## Overview

Mobilut is a **local-first** app — no backend, no cloud sync, no user accounts in v1. All integrations are on-device SDKs or native APIs.

## Google Mobile Ads (AdMob)

| Item | Detail |
|------|--------|
| Package | `react-native-google-mobile-ads` 14.8.0 |
| Config | `app.json` + `app.config.js` plugin |
| iOS App ID | `ca-app-pub-3940256099942544~1458002511` (test) |
| Android App ID | `ca-app-pub-3940256099942544~3347511713` (test) |
| Ad Format | Banner only (`BannerAdSize.ANCHORED_ADAPTIVE_BANNER`) |
| Placement | Home screen banner (`src/features/home/home-ad-banner.tsx`) |

### Code Flow

1. **Adapter**: `src/adapters/ads/mobile-ads.tsx` — wraps `mobileAds()`, `BannerAd`, `TestIds`
2. **Service**: `src/services/ads/ad-manager.ts` — initialization singleton, unit ID resolution, render policy
3. **Feature**: `src/features/home/home-ad-banner.tsx` — renders banner in home screen

### Configuration

- In dev (`__DEV__`): always uses `TestIds.BANNER`
- In production: reads `EXPO_PUBLIC_HOME_BANNER_AD_UNIT_ID` env var; returns `null` if not configured (banner hidden)

## Expo Native Modules

All accessed through `src/adapters/expo/`:

| Module | Adapter File | Purpose |
|--------|-------------|---------|
| `expo-image-picker` | `image-picker.ts` | Pick photos from gallery or camera |
| `expo-document-picker` | `document-picker.ts` | Pick `.cube` LUT files from filesystem |
| `expo-file-system` | `file-system.ts` | Read/write files (drafts, LUT storage, exports) |
| `expo-image-manipulator` | `image-manipulator.ts` | CPU-side crop, rotate, resize, format conversion |
| `expo-media-library` | `media-library.ts` | Save exported images to device photo library |
| `expo-sharing` | `sharing.ts` | Share exported files via system share sheet |

## Skia Runtime

| Item | Detail |
|------|--------|
| Package | `@shopify/react-native-skia` 1.5.0 |
| Adapter | `src/adapters/skia/` (9 files) |
| GPU Shaders | LUT application, blend modes, masking, framing, artistic looks, pro clarity |

### Shader Components

| File | Purpose |
|------|---------|
| `shader-sources.ts` | SkSL source code: LUT strip lookup, mask compositing, frame border |
| `artistic-look-shader.ts` | Color matrix transform + vignette + grain + contrast |
| `clarity-shader.ts` | Laplacian sharpness, clarity, structure, micro-contrast |
| `blend-shader.ts` | Blend mode mapping (Skia blend modes) |
| `preview-canvas.tsx` | React component wrapping Skia `Canvas` + `Image` + blend layers |
| `offscreen-render.tsx` | Offscreen GPU rendering for export |
| `mask-renderer.ts` | Region mask rendering |
| `runtime-effect-factory.ts` | `RuntimeEffect.Make()` wrapper |

## On-Device Storage

| Store | Mechanism | Location |
|-------|-----------|----------|
| App Preferences | `@react-native-async-storage/async-storage` | Key-value (language, theme, export quality, watermark toggle) |
| Drafts | `expo-file-system` | `<documentDir>/drafts/` (JSON files + index) |
| Imported LUTs | `expo-file-system` | `<documentDir>/luts/` |
| Recent Items | `@react-native-async-storage/async-storage` | Recent asset IDs |

## Internationalization

| Item | Detail |
|------|--------|
| Library | `i18next` 25.0.0 + `react-i18next` 15.0.0 |
| Languages | English (`en.ts`), Vietnamese (`vi.ts`) |
| Default | English |
| Init | `src/i18n/index.ts` → called from `app/_layout.tsx` |

## No External APIs

The following are explicitly **not used** in v1:
- No backend server
- No cloud storage
- No analytics service (diagnostics module is a placeholder)
- No crash reporting
- No auth provider
- No push notifications
