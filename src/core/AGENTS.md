# src/core — Domain Layer

Pure TypeScript contracts, domain models, and error hierarchy. **Zero vendor imports** (no Expo, no Skia, no React Native).

## STRUCTURE

```
core/
├── errors/           # Typed error hierarchy (LutError, ImageError, etc.)
├── edit-session/     # Immutable EditState model + session types
├── image-pipeline/   # Pipeline contracts, resolution types, quality configs
└── lut/              # LUT domain types (LutDescriptor, color space, size)
```

## WHERE TO LOOK

| Task                      | Location                                 |
| ------------------------- | ---------------------------------------- |
| Add a new error type      | `errors/` — extend base error class      |
| Define new domain model   | Create new subdir with types + index.ts  |
| Edit session state shape  | `edit-session/` — EditState is immutable |
| Pipeline resolution types | `image-pipeline/`                        |
| LUT metadata/descriptor   | `lut/`                                   |

## CONVENTIONS

- All types are plain TS interfaces/types — no class instances with methods
- EditState is **immutable** — create new objects, never mutate
- No Skia types leak into EditState or any model here
- Every module has `index.ts` barrel export

## ANTI-PATTERNS

- Importing from `@adapters/*`, `@services/*`, `expo-*`, or `@shopify/react-native-skia`
- Mutable state in domain models
- Route params or navigation types
