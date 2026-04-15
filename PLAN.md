# Implementation Plan: LUT App — Mobile Photo Color Grading

**Branch:** main
**Status:** DRAFT — awaiting /autoplan review
**Design doc:** ~/.gstack/projects/lut-app/monet-main-design-20260414-142913.md
**Author:** monet
**Created:** 2026-04-15

---

## Vision

Build a mobile photo color grading app targeting Vietnamese content creators (18-28).
Differentiate from Modipix/Prequel via one-time purchase pricing ($2.99) instead of
subscription. 200 built-in LUT presets, .cube/.png import, basic editing tools.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    React Native App                  │
│                   (TypeScript + Expo)                │
├─────────────┬──────────────┬────────────────────────┤
│   Screens   │  Components  │     Navigation         │
│  ─────────  │  ──────────  │  ──────────────        │
│  Home       │  LUTGrid     │  React Navigation      │
│  Editor     │  ImageView   │  Stack + Bottom Tab     │
│  LUTBrowse  │  Slider      │                        │
│  Settings   │  CropOverlay │                        │
│  Import     │  ExportModal │                        │
├─────────────┴──────────────┴────────────────────────┤
│                  Core Services                       │
│  ─────────────────────────────────────────────────   │
│  LUTEngine (Skia RuntimeEffect SKSL shaders)        │
│  ImageProcessor (resize, crop, export JPEG)          │
│  CubeParser (.cube file → 3D LUT → 2D strip)        │
│  HaldParser (.png HaldCLUT → 3D LUT → 2D strip)     │
│  LUTCatalog (200 presets, categories, free/paid)     │
│  PurchaseManager (RevenueCat non-consumable IAP)     │
│  I18nService (react-i18next, vi + en)                │
│  StorageService (AsyncStorage for preferences)       │
├──────────────────────────────────────────────────────┤
│                  Native Layer                        │
│  ─────────────────────────────────────────────────   │
│  @shopify/react-native-skia  (GPU rendering)         │
│  react-native-image-picker   (photo selection)       │
│  @react-native-camera-roll   (save to gallery)       │
│  react-native-purchases      (RevenueCat IAP)        │
│  react-native-fs             (file system access)    │
└──────────────────────────────────────────────────────┘
```

## Phase 1: Core LUT App (8-10 weeks)

### Sprint 1: Project Setup & Core Engine (Week 1-2)

| Task | Description | Est |
|------|-------------|-----|
| 1.1 | Init Expo bare workflow project (TypeScript) | 2h |
| 1.2 | Configure react-native-skia, image-picker, camera-roll | 4h |
| 1.3 | Build CubeParser: parse .cube → 64x64x64 float grid | 8h |
| 1.4 | Build LUT 2D strip encoder: 3D grid → 512x512 RGBA texture | 8h |
| 1.5 | Build SKSL RuntimeEffect shader for LUT application | 12h |
| 1.6 | Build HaldCLUT parser: .png → 3D LUT → reuse strip format | 6h |
| 1.7 | LUT intensity blend uniform (0.0-1.0) in SKSL | 4h |
| 1.8 | Unit tests: CubeParser, HaldParser, strip encoder | 8h |

### Sprint 2: Image Pipeline & Editor UI (Week 3-4)

| Task | Description | Est |
|------|-------------|-----|
| 2.1 | Image picker integration (gallery + camera) | 4h |
| 2.2 | Image resize pipeline (max 2048px for preview) | 4h |
| 2.3 | Editor screen layout: image preview + controls | 12h |
| 2.4 | LUT intensity slider component | 4h |
| 2.5 | Basic adjustment sliders: brightness, contrast, saturation, temperature, sharpen | 16h |
| 2.6 | Full-res export: re-render at original size → JPEG → save to camera roll | 8h |
| 2.7 | Crop tool with aspect ratio selector (1:1, 4:3, 16:9, free) | 12h |
| 2.8 | Integration tests: image pipeline end-to-end | 8h |

### Sprint 3: LUT Catalog & Browse UI (Week 5-6)

| Task | Description | Est |
|------|-------------|-----|
| 3.1 | LUT catalog data structure (200 presets, 10 categories) | 4h |
| 3.2 | Bundle 200 LUT files as app assets (after licensing resolved) | 8h |
| 3.3 | LUT browse screen: category tabs + grid thumbnails | 12h |
| 3.4 | LUT thumbnail generation: apply LUT to sample image → cache | 8h |
| 3.5 | Free/paid gating: 30 free LUTs, lock icon on 170 paid | 4h |
| 3.6 | LUT import screen: file picker for .cube and .png files | 8h |
| 3.7 | Imported LUT persistence (save to app documents) | 4h |
| 3.8 | UI tests: LUT browse, selection, import flow | 8h |

### Sprint 4: Monetization & Localization (Week 7-8)

| Task | Description | Est |
|------|-------------|-----|
| 4.1 | RevenueCat setup: non-consumable IAP ($2.99 unlock all) | 8h |
| 4.2 | Purchase flow UI: paywall screen, restore purchases | 8h |
| 4.3 | Purchase state management: unlock paid LUTs after purchase | 4h |
| 4.4 | react-i18next setup: vi + en translation files | 4h |
| 4.5 | Translate all UI strings (Vietnamese + English) | 8h |
| 4.6 | Settings screen: language toggle, about, restore purchases | 6h |
| 4.7 | IAP integration tests (sandbox) | 6h |

### Sprint 5: Polish, Permissions & Release Prep (Week 9-10)

| Task | Description | Est |
|------|-------------|-----|
| 5.1 | iOS permissions: NSPhotoLibraryUsageDescription, NSPhotoLibraryAddUsageDescription | 2h |
| 5.2 | Android permissions: READ_MEDIA_IMAGES (13+), READ_EXTERNAL_STORAGE (12-) | 2h |
| 5.3 | Error handling: malformed .cube, corrupt images, export failures | 8h |
| 5.4 | App icon, splash screen design | 8h |
| 5.5 | Home screen: recent edits, quick LUT access | 8h |
| 5.6 | Navigation: React Navigation stack + bottom tabs | 6h |
| 5.7 | Performance: test on 12MP+ images, memory profiling | 8h |
| 5.8 | E2E tests: full user journey (pick image → apply LUT → export) | 12h |
| 5.9 | Build APK, submit to Google Play Console | 4h |
| 5.10 | Privacy policy: no data collection, offline-first | 4h |

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React Native (Expo bare) | Cross-platform, TypeScript, access native modules |
| Rendering | @shopify/react-native-skia | GPU LUT rendering via SKSL shaders, 2D texture sampling |
| Image Picker | react-native-image-picker | Mature, well-maintained, gallery + camera |
| Save to Gallery | @react-native-camera-roll/camera-roll | Standard for saving images |
| IAP | react-native-purchases (RevenueCat) | Non-consumable IAP, restore purchases, analytics |
| i18n | react-i18next | Standard for RN, vi + en |
| Navigation | @react-navigation/native | Stack + bottom tab navigation |
| Storage | @react-native-async-storage | User preferences, imported LUT metadata |
| File System | react-native-fs | Read .cube files, save imported LUTs |
| Testing | Jest + React Native Testing Library | Unit + integration tests |
| E2E | Detox | End-to-end testing on real devices |

## LUT Rendering Pipeline (Skia SKSL)

```
User picks photo → ImagePicker → decode → resize (max 2048px preview)
                                                    ↓
                                         Skia Canvas <Image>
                                                    ↓
LUT selected → CubeParser/.cube → 3D float grid ──→ 2D strip (512×512 RGBA)
          or → HaldParser/.png  → 3D float grid ──→ 2D strip (512×512 RGBA)
                                                    ↓
                                         Skia.Image.MakeImage(strip)
                                                    ↓
                                    RuntimeEffect (SKSL shader)
                                    ├── uniform: inputImage
                                    ├── uniform: lutTexture
                                    └── uniform: intensity (0.0-1.0)
                                                    ↓
                                         mix(original, lutColor, intensity)
                                                    ↓
                                    Preview: <Canvas> component (real-time)
                                    Export:  makeImageSnapshot() → JPEG → save
```

## Monetization Model

- **Free tier:** 30 LUT presets (3 per category) + full editing tools + import own LUTs
- **One-time purchase:** $2.99 → unlock 170 additional LUT presets
- **Implementation:** RevenueCat non-consumable IAP
- **Restore purchases:** Required by App Store, implemented in Settings

## Localization

- Primary: Vietnamese (vi) — target market
- Secondary: English (en) — global distribution
- Implementation: react-i18next with JSON translation files
- All UI strings externalized from day 1

## Success Criteria

- 100 downloads in first month (organic)
- 10 users purchase one-time unlock ($2.99)
- App Store rating >= 4.0
- No crashes on images >= 12MP
- LUT preview renders in < 100ms on mid-range devices
- Export full-res image in < 3 seconds

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| LUT licensing unclear | HIGH | MEDIUM | Resolve before coding — use Envato + self-made |
| Skia shader complexity | MEDIUM | MEDIUM | Prototype shader first, fallback to CPU rendering |
| 12MP+ memory pressure | HIGH | HIGH | Stream processing, limit preview to 2048px |
| App Store IAP rejection | MEDIUM | LOW | Follow RevenueCat best practices, test in sandbox |
| Market saturation | HIGH | HIGH | Differentiate via pricing (one-time vs subscription) |
| No user validation yet | CRITICAL | HIGH | Run "The Assignment" before coding |

## Launch Blockers

1. **LUT licensing** — Must have commercial license for 200 LUTs before bundling
2. **"The Assignment"** — Post in 3 VN photography Facebook groups, collect 20 responses
3. **App name** — "lut-app" is placeholder, need brand name for store submission
4. **Apple Developer account** — $99/year required for iOS distribution
5. **Privacy policy** — Required for both stores, must state no data collection

## Phase 2 (Post-launch, after >= 10 purchases)

- More LUT packs (IAP bundles)
- Watermark / EXIF frame templates
- PNG and HEIC export formats
- EXIF preservation (strip location, keep camera info)

## Phase 3 (Post Phase 2 validation)

- Color transfer AI from reference photo (TFLite model)
- Batch processing (image queue architecture redesign)
- Live camera preview with LUT (react-native-vision-camera)

## Distribution

- **Android first** — Play Console $25 one-time, faster review
- **iOS second** — after Android stable
- **CI/CD:** GitHub Actions → Fastlane → Play Console / TestFlight
- **Marketing day 1:** VN photography Facebook groups, Reddit r/analog, TikTok demo videos
