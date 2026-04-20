# External Integrations

**Mapped:** 2026-04-20

## Overview

This is a **local-first** app with no backend. All integrations are device-local or via native platform APIs. No network services in v1.

## Device APIs (via Expo Modules)

| Integration | Adapter | Purpose |
|------------|---------|---------|
| Photo Library | `src/adapters/expo/image-picker.ts` | Pick images from user gallery |
| Media Library | `src/adapters/expo/media-library.ts` | Save exported images to camera roll |
| Document Picker | `src/adapters/expo/document-picker.ts` | Import .cube LUT files from Files app |
| File System | `src/adapters/expo/file-system.ts` | Read/write LUT files, temp storage |
| Image Manipulator | `src/adapters/expo/image-manipulator.ts` | Resize/transform images for export |
| Sharing | `src/adapters/expo/sharing.ts` | Share exported images via system sheet |

## Storage

| Store | Technology | Key | Purpose |
|-------|-----------|-----|---------|
| Imported LUTs | AsyncStorage | `@lut-app/importedLuts` | Track imported .cube and HaldCLUT records |
| App Preferences | AsyncStorage | (via `src/services/storage/app-preferences.ts`) | User settings persistence |
| Recent Items | AsyncStorage | (via `src/services/storage/recent-items.ts`) | Recent file access history |

## GPU / Rendering

| Integration | Adapter | Purpose |
|------------|---------|---------|
| Skia Canvas | `src/adapters/skia/preview-canvas.tsx` | GPU-rendered preview display |
| GLSL Shaders | `src/adapters/skia/shader-sources.ts` | LUT application, mask compositing, frame rendering |
| Runtime Effects | `src/adapters/skia/runtime-effect-factory.ts` | Compile GLSL to Skia runtime effects |
| Mask Renderer | `src/adapters/skia/mask-renderer.ts` | Region-based selective editing |

## Monetization

| Integration | Config | Status |
|------------|--------|--------|
| Google AdMob | `app.config.js` plugin | **Test mode** — using Google test app IDs |

Test IDs configured:
- Android: `ca-app-pub-3940256099942544~3347511713`
- iOS: `ca-app-pub-3940256099942544~1458002511`

## EXIF

| Integration | Adapter | Purpose |
|------------|---------|---------|
| EXIF Reader | `src/adapters/exif/exif-reader.ts` | Read photo metadata for watermark display |

## Databases

None. Local-first with AsyncStorage for key-value persistence.

## Cloud Services

None in v1. Cloud sync, user accounts, and backend services are explicitly deferred.

## Auth Providers

None. No user accounts in v1.
