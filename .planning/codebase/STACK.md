# Technology Stack

**Mapped:** 2026-04-20

## Language & Runtime

| Technology | Version | Notes |
|-----------|---------|-------|
| TypeScript | 5.6.3 | Strict mode enabled |
| React | 18.3.1 | Standard hooks-based patterns |
| React Native | 0.76.3 | New Architecture disabled (`newArchEnabled: false`) |

## Framework

| Component | Technology | Version |
|-----------|-----------|---------|
| App Framework | Expo | ~52.0.0 |
| Router | expo-router | ~4.0.0 |
| Bundler | Metro | Default Expo config, symlinks enabled |
| Build Service | EAS Build | CLI >= 16.0.1 |

Expo managed workflow with typed routes (`experiments.typedRoutes: true`). Entry point via `expo-router/entry`.

## Key Dependencies

### Core Runtime
| Package | Version | Purpose |
|---------|---------|---------|
| `@shopify/react-native-skia` | 1.5.0 | GPU-accelerated rendering, GLSL shaders for LUT application |
| `react-native-reanimated` | ~3.16.1 | Gesture-driven animations |
| `react-native-safe-area-context` | 5.7.0 | Safe area insets |
| `react-native-screens` | 4.24.0 | Native navigation screens |

### Expo Modules
| Package | Version | Purpose |
|---------|---------|---------|
| `expo-file-system` | ~18.0.0 | File I/O for LUT import/export |
| `expo-image-picker` | ~16.0.0 | Photo library access |
| `expo-image-manipulator` | ~13.0.0 | Image resizing/manipulation |
| `expo-document-picker` | ~13.0.0 | .cube file import |
| `expo-media-library` | ~17.0.0 | Save to camera roll |
| `expo-sharing` | ~13.0.0 | Share exported images |
| `expo-asset` | ~11.0.5 | Bundled asset loading |
| `expo-dev-client` | ~5.0.0 | Development builds |
| `expo-modules-core` | ~2.0.0 | Native module bridge |

### Data & State
| Package | Version | Purpose |
|---------|---------|---------|
| `@react-native-async-storage/async-storage` | 2.0.0 | Local persistence (imported LUT records, preferences) |

### Internationalization
| Package | Version | Purpose |
|---------|---------|---------|
| `i18next` | 25.0.0 | Translation framework |
| `react-i18next` | 15.0.0 | React bindings for i18n |

### Monetization
| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-google-mobile-ads` | 14.8.0 | AdMob integration (test IDs configured) |

## Dev Tooling

| Tool | Version | Config File |
|------|---------|-------------|
| Jest | 29.7.0 | `jest.config.js` |
| jest-expo | ~52.0.0 | Preset for Expo |
| @testing-library/react-native | 13.0.0 | Component testing |
| ESLint | 8.57.1 | `.eslintrc.js` (extends `expo`) |
| Prettier | 3.3.3 | `.prettierrc` |
| babel-plugin-module-resolver | 5.0.2 | Path alias resolution |

## Monorepo

npm workspaces with one internal package:

- **Root:** React Native + Expo app
- **`packages/lut-core`** (`@lut-app/lut-core`): Pure TypeScript LUT library — no React Native dependencies, no Expo imports. Independently testable.

Metro configured with `config.watchFolders` and `unstable_enableSymlinks` for monorepo resolution.

## Path Aliases

Configured in both `tsconfig.json` and `babel.config.js` (via `module-resolver`):

| Alias | Path |
|-------|------|
| `@core/*` | `src/core/*` |
| `@features/*` | `src/features/*` |
| `@services/*` | `src/services/*` |
| `@adapters/*` | `src/adapters/*` |
| `@ui/*` | `src/ui/*` |
| `@theme` / `@theme/*` | `src/theme` |
| `@hooks` / `@hooks/*` | `src/hooks` |
| `@lib` / `@lib/*` | `src/lib` |
| `@i18n` / `@i18n/*` | `src/i18n` |
| `@lut-core` / `@lut-core/*` | `packages/lut-core/src` |

## Build Configuration

- **Platforms:** iOS + Android only (no web)
- **iOS bundle:** `com.anonymous.lut-app`
- **Android package:** `com.anonymous.lutapp`
- **URL scheme:** `lutapp`
- **Postinstall:** `scripts/fix-rn-screens-codegen.js` — patches react-native-screens codegen

## EAS Build Profiles

| Profile | Distribution | Dev Client | Auto Increment |
|---------|-------------|------------|----------------|
| development | internal | yes | yes |
| preview | internal | no | yes |
| production | — | no | yes |
