# Code Conventions

**Mapped:** 2026-04-20

## TypeScript Style

- **Strict mode** enabled via `tsconfig.json`
- **`readonly` everywhere** — all interface properties, function params, return types use `readonly`
- **`as const`** assertions on constant objects (e.g., `ImportErrors`, `colors`, `spacing`)
- **`Object.freeze()`** on state objects (`EditState`, `DEFAULT_ADJUSTMENTS`)
- **No `any`** — types are explicit throughout

## Immutability Pattern

The codebase enforces immutability at the type level:

```typescript
// All state interfaces use readonly
export interface EditState {
  readonly assetId: string;
  readonly selectedPresetId: string | null;
  readonly adjustments: AdjustmentParams;
  // ...
}

// Frozen on creation
return Object.freeze({ ...state });
```

## Error Handling

**Typed error pattern with factory functions:**

```typescript
export class ImportImageError extends Error {
  readonly code: string;
  readonly userMessageKey: string;
  // ...
}

export const ImportErrors = {
  FILE_TOO_LARGE: (fileSize: number) =>
    new ImportImageError('IMPORT_FILE_TOO_LARGE', `...`, 'errors.import.fileTooLarge'),
} as const;
```

Each error carries:
- `code` — machine-readable identifier
- `message` — developer-facing description
- `userMessageKey` — i18n key for user-facing copy

## Result Type (lut-core)

`packages/lut-core` uses a custom `ParseResult<T>` type instead of throwing:

```typescript
type ParseResult<T> = { ok: true; value: T } | { ok: false; error: ParseError };
```

With `ok()` and `err()` factory functions. Callers must check `.ok` before accessing `.value`.

## Component Patterns

### Screen Components
- Named `{Feature}Screen` (e.g., `EditorScreen`, `ExportImageScreen`)
- Accept props, don't access navigation directly
- Located in `src/features/{feature}/{feature}.screen.tsx`

### Custom Hooks
- Named `use{Feature}` (e.g., `useEditorSession`, `usePresetBrowser`)
- Encapsulate state + side effects
- Return object (not tuple) for named access

### Reducer Pattern
- `useReducer` with discriminated union actions
- Reducer in separate file (`editor-reducer.ts`)
- Actions in core layer (`edit-action.ts`), reducer in features layer

## Import Organization

Imports follow this order (observed pattern):
1. React / React Native
2. External libraries
3. `@adapters/*`
4. `@core/*`
5. `@features/*`
6. `@services/*`
7. `@ui/*`
8. `@theme/*`
9. Relative imports

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `edit-state.ts`, `preview-render.service.ts` |
| Components | PascalCase | `EditorScreen`, `PresetBrowser` |
| Hooks | camelCase, `use` prefix | `useEditorSession` |
| Types/Interfaces | PascalCase | `EditState`, `AdjustmentParams` |
| Constants | SCREAMING_SNAKE or camelCase | `DEFAULT_ADJUSTMENTS`, `colors` |
| Discriminated unions | SCREAMING_SNAKE type field | `'SELECT_PRESET'`, `'SET_CROP'` |

## Formatting

Enforced via Prettier:
- Single quotes
- Trailing commas (all)
- Semicolons
- 100 character print width

## Linting

ESLint extends `expo` preset with:
- `no-console: warn` — discourages console.log in production code

## Module Boundary Enforcement

Each module (`src/core/`, `src/features/`, etc.) has its own `AGENTS.md` documenting:
- What the module is responsible for
- What it must NOT import
- Patterns to follow

This is convention-based (no build-time enforcement), relying on review discipline.

## Barrel Exports

Every directory has an `index.ts` barrel file. Some are placeholders:
- `src/hooks/index.ts` — `// TODO: export module contents`
- `src/lib/index.ts` — `// TODO: export module contents`
- `src/services/diagnostics/index.ts` — `// TODO: export module contents`
