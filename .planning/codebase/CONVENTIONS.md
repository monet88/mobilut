# Code Conventions

> Last mapped: 2026-04-22

## TypeScript

- **Strict mode** enabled (`strict: true` in `tsconfig.json`)
- Interfaces for data shapes, type aliases for unions/intersections
- `readonly` on all interface properties and function parameters
- `as const` assertions for constant objects
- Discriminated unions for action types (e.g., `EditAction`)

### Immutability Pattern

Domain models use `Object.freeze()` for initial state and spread operators for updates:

```typescript
// src/core/edit-session/edit-state.ts
export function createInitialEditState(...): EditState {
  return Object.freeze({
    assetId,
    assetUri,
    // ...
  });
}
```

State updates via `{ ...state, field: newValue }` — never mutation.

## Module Organization

### Barrel Exports

Every directory has an `index.ts` that re-exports public API:

```typescript
// src/core/errors/index.ts
export * from './error-messages';
export * from './export-errors';
export * from './import-errors';
// ...
```

### AGENTS.md Per Module

Each major directory contains an `AGENTS.md` documenting:
- Module purpose and structure
- "WHERE TO LOOK" table for common tasks
- Conventions specific to the module
- Anti-patterns to avoid

Located at: `src/core/AGENTS.md`, `src/services/AGENTS.md`, `src/adapters/AGENTS.md`, `src/features/AGENTS.md`, `src/ui/AGENTS.md`, `packages/lut-core/AGENTS.md`

## Feature Module Pattern

Each feature follows a consistent structure:

```
features/<name>/
├── index.ts                  # Barrel export
├── <name>.screen.tsx         # Screen component (receives callbacks via props)
├── use-<name>.ts             # Custom hook (orchestrates services)
└── components/               # (optional) feature-local UI
```

### Screen Component Pattern

Screens receive navigation callbacks as props — they don't import `router` directly:

```typescript
// src/features/home/home.screen.tsx
interface HomeScreenProps {
  onOpenBatch: () => void;
  onOpenEditor: (assetId: string) => void;
  onOpenSettings: () => void;
}
```

The route file in `app/` bridges navigation to the feature screen:

```typescript
// app/index.tsx
export default function IndexRoute() {
  const router = useRouter();
  return (
    <HomeScreen
      onOpenBatch={() => router.push('/batch')}
      onOpenEditor={(assetId) => router.push(`/editor/${encodeURIComponent(assetId)}`)}
    />
  );
}
```

## State Management

### useReducer + Discriminated Union Actions

No global state library. State is managed per-feature via `useReducer`:

```typescript
// src/features/editor/editor-reducer.ts
export type EditorAction =
  | { readonly type: 'EDIT'; readonly action: EditAction }
  | { readonly type: 'UNDO' }
  | { readonly type: 'REDO' }
  | { readonly type: 'SET_LOADING'; readonly loading: boolean }
  | { readonly type: 'SET_ERROR'; readonly error: Error | null }
  | { readonly type: 'HYDRATE'; readonly draft: DraftRecord }
  | { readonly type: 'RESET'; ... };
```

### History/Undo Pattern

Generic `History<T>` type with pure functions:

```typescript
interface History<T> {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
}
// pushHistory, undoHistory, redoHistory — all pure functions
```

## Error Handling

### Typed Error Factories

Errors are factory functions returning typed `Error` subclasses:

```typescript
// src/core/errors/export-errors.ts
export const ExportErrors = {
  DIMENSION_TOO_LARGE: (w: number, h: number) => new ExportError(...),
  OUT_OF_MEMORY: (pixels: number) => new ExportError(...),
};
```

### Error Guard Pattern

```typescript
function isMissingFileError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /ENOENT|does not exist|could not be found/.test(error.message);
}
```

## Adapter Conventions

- Adapters are **thin wrappers** — no business logic
- Each adapter module wraps one vendor package
- Return types map to `@core/*` types, never expose raw vendor types
- `src/adapters/expo/` wraps Expo modules, `src/adapters/skia/` wraps Skia

## Styling

### Theme Tokens

All colors, spacing, radius, and typography defined in `src/theme/tokens.ts`:

```typescript
export const colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  accent: '#FF6B35',
  // ...
} as const;
```

Components use `@theme` tokens — no hardcoded colors in features.

### Design System

A comprehensive design spec exists in `DESIGN.md` at root:
- Dark-first UI, Mobilut Teal (`#00B4A6`) accent
- Glass surfaces with blur for floating controls
- Pill-shaped CTAs, 44px minimum touch targets
- Tight headline typography with negative letter-spacing

**Note**: `DESIGN.md` defines the aspirational design system with Teal accent, while `src/theme/tokens.ts` still uses legacy orange accent (`#FF6B35`). These are not yet aligned.

## Import Conventions

- Always use path aliases (`@core/*`, `@features/*`, etc.) — never relative paths across modules
- Relative imports allowed within the same module (e.g., `./edit-state`)
- Vendor imports only in `src/adapters/` (except `react`, `react-native`, `expo-router`)

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `edit-state.ts`, `use-editor-session.ts` |
| Types/Interfaces | PascalCase | `EditState`, `BlendParams` |
| Functions | camelCase | `createInitialEditState`, `renderPreview` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PREVIEW_DIMENSION`, `DEFAULT_ADJUSTMENTS` |
| Enum-like objects | PascalCase key + SCREAMING value | `ExportErrors.DIMENSION_TOO_LARGE` |
| React components | PascalCase | `PreviewCanvas`, `HomeScreen` |
| Hooks | `use` prefix, camelCase | `useEditorSession`, `useBatchSession` |
| Test files | `<source>.test.ts(x)` | `editor.screen.test.tsx` |
