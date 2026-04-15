# src/services — Orchestration Layer

Business logic coordination between core domain, adapters, and features. **No UI components.**

## STRUCTURE

```
services/
├── lut/           # LUT loading, application, format conversion
├── image/         # Image loading, resizing, preview vs export pipeline
├── storage/       # Persistent storage (presets, settings, recent files)
└── diagnostics/   # Error reporting, performance tracking
```

## CONVENTIONS

- Services orchestrate adapters + core logic — they don't call vendor APIs directly
- Preview path and export path are separate — never reuse downscaled preview bitmap for export
- Services are stateless functions or singleton-style modules

## WHERE TO LOOK

| Task                 | Location       |
| -------------------- | -------------- |
| LUT apply/load logic | `lut/`         |
| Image resize/export  | `image/`       |
| Persist user data    | `storage/`     |
| Error/perf tracking  | `diagnostics/` |

## ANTI-PATTERNS

- UI components (React elements, JSX)
- Direct `expo-*` or `@shopify/react-native-skia` imports — use `@adapters/*`
- Leaking Skia types into return values — map to `@core/*` types
