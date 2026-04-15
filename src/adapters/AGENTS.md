# src/adapters — Platform Abstraction Layer

Thin wrappers around vendor APIs. Features and services import adapters — never vendor packages directly.

## STRUCTURE

```
adapters/
├── expo/    # Expo module wrappers (ImagePicker, FileSystem, MediaLibrary, etc.)
├── skia/    # @shopify/react-native-skia wrappers (Canvas, Shaders, Image)
└── exif/    # EXIF metadata reading
```

## CONVENTIONS

- Each adapter exports a stable interface that hides vendor API details
- Adapters contain **no business logic** — pure delegation + type mapping
- When vendor API changes, only the adapter changes — not features/services

## WHERE TO LOOK

| Task                   | Location                                  |
| ---------------------- | ----------------------------------------- |
| Wrap new Expo module   | `expo/` — add new file, export from index |
| Skia rendering changes | `skia/` — Canvas, shader, image wrappers  |
| EXIF metadata          | `exif/`                                   |

## ANTI-PATTERNS

- Business logic (validation, orchestration) — belongs in `@services/*`
- Direct feature imports (`@features/*`)
- Exposing raw vendor types to consumers — map to `@core/*` types
