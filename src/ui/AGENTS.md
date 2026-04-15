# src/ui — Shared UI Components

Reusable components organized by responsibility tier.

## STRUCTURE

```
ui/
├── primitives/   # Base components (Button, Text, Icon, Input)
├── layout/       # Layout containers (Screen, Row, Spacer, Card)
└── feedback/     # User feedback (Toast, Modal, LoadingOverlay, ErrorBoundary)
```

## CONVENTIONS

- Components use `@theme` tokens for all colors, spacing, typography
- Primitives are atomic — no business logic, no feature awareness
- Layout components handle safe areas, keyboard avoidance
- Feedback components handle loading states, error display

## WHERE TO LOOK

| Task                 | Location      |
| -------------------- | ------------- |
| New basic component  | `primitives/` |
| Page layout wrapper  | `layout/`     |
| Loading/error states | `feedback/`   |

## ANTI-PATTERNS

- Feature-specific logic (belongs in `@features/<name>/components/`)
- Direct theme values (use `@theme` tokens)
- Importing from `@services/*` or `@adapters/*`
