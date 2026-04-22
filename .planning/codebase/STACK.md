# Technology Stack

> Last mapped: 2026-04-22

## Languages & Runtime

| Language | Version | Usage |
|----------|---------|-------|
| TypeScript | 5.6.3 | Primary language, strict mode enabled |
| SkSL (Skia Shader Language) | — | GPU shaders for LUT application, masking, framing, artistic effects |
| JavaScript | — | Config files only (`babel.config.js`, `metro.config.js`, `app.config.js`) |

## Framework & Platform

| Component | Version | Notes |
|-----------|---------|-------|
| React Native | 0.76.3 | Cross-platform mobile (iOS + Android) |
| React | 18.3.1 | UI library |
| Expo | ~52.0.0 | Managed workflow with EAS Build |
| Expo Router | ~4.0.0 | File-system-based routing (`app/` directory) |
| New Architecture | **disabled** | `newArchEnabled: false` on both iOS and Android |

## Monorepo Structure

npm workspaces with two packages:

| Package | Path | Purpose |
|---------|------|---------|
| Root app (`lut-app`) | `/` | React Native + Expo application |
| `@lut-app/lut-core` | `packages/lut-core/` | Pure TypeScript LUT parsing/interpolation (zero RN deps) |

Metro is configured to watch `packages/` and resolve symlinks (`unstable_enableSymlinks: true`).

## Key Dependencies

### Production

| Package | Version | Purpose |
|---------|---------|---------|
| `@shopify/react-native-skia` | 1.5.0 | GPU rendering, shaders, canvas-based image processing |
| `react-native-reanimated` | ~3.16.1 | Gesture-driven animations |
| `react-native-safe-area-context` | 5.7.0 | Safe area insets |
| `react-native-screens` | 4.24.0 | Native screen containers |
| `react-native-google-mobile-ads` | 14.8.0 | AdMob banner ads |
| `@react-native-async-storage/async-storage` | 2.0.0 | Key-value persistence (preferences) |
| `i18next` + `react-i18next` | 25.0.0 / 15.0.0 | Internationalization (EN + VI) |
| `expo-file-system` | ~18.0.0 | File I/O (drafts, LUT storage) |
| `expo-image-picker` | ~16.0.0 | Gallery/camera image selection |
| `expo-image-manipulator` | ~13.0.0 | CPU-side image resize/crop/rotate |
| `expo-media-library` | ~17.0.0 | Save exports to device gallery |
| `expo-document-picker` | ~13.0.0 | .cube file import |
| `expo-sharing` | ~13.0.0 | Share exported files |
| `expo-asset` | ~11.0.5 | Bundled asset loading |
| `expo-dev-client` | ~5.0.0 | Development builds |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `jest` + `jest-expo` | 29.7.0 / ~52.0.0 | Testing framework |
| `@testing-library/react-native` | 13.0.0 | Component testing |
| `react-test-renderer` | 18.3.1 | Snapshot rendering |
| `eslint` + `eslint-config-expo` | 8.57.1 / ~8.0.1 | Linting |
| `prettier` | 3.3.3 | Code formatting |
| `babel-plugin-module-resolver` | 5.0.2 | Path alias resolution |

## Path Aliases

Configured in `tsconfig.json`, `babel.config.js`, and `jest.config.js`:

| Alias | Target |
|-------|--------|
| `@core/*` | `src/core/*` |
| `@features/*` | `src/features/*` |
| `@services/*` | `src/services/*` |
| `@adapters/*` | `src/adapters/*` |
| `@ui/*` | `src/ui/*` |
| `@theme` / `@theme/*` | `src/theme` / `src/theme/*` |
| `@hooks` / `@hooks/*` | `src/hooks` / `src/hooks/*` |
| `@lib` / `@lib/*` | `src/lib` / `src/lib/*` |
| `@i18n` / `@i18n/*` | `src/i18n` / `src/i18n/*` |
| `@lut-core` / `@lut-core/*` | `packages/lut-core/src` / `packages/lut-core/src/*` |

## Build & CI Configuration

- **EAS Build** (`eas.json`): 3 profiles — `development` (dev client, internal), `preview` (internal), `production` (auto-increment)
- **EAS CLI**: `>= 16.0.1`, app version source `remote`
- **Typed Routes**: enabled via `experiments.typedRoutes: true`
- **Postinstall script**: `scripts/fix-rn-screens-codegen.js` (patches react-native-screens codegen issue)

## Code Style Configuration

- **ESLint**: `eslint-config-expo` base, `no-console: warn`
- **Prettier**: single quotes, trailing commas, semicolons, 100 char print width
- **TypeScript**: strict mode, extends `expo/tsconfig.base`
