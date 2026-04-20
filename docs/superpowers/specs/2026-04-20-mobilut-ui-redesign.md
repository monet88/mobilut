<!-- /autoplan restore point: /Users/gold/.gstack/projects/monet88-mobilut/master-autoplan-restore-20260420-091926.md -->
# Mobilut UI/UX Redesign Specification

**Date:** 2026-04-20  
**Status:** Approved  
**Reference:** MODIPIX app screenshots (`/Users/gold/Documents/mobilut-ui/`)

---

## 1. Product Direction & Experience Principles

### 1.1 Product Positioning

Mobilut is a dark-first mobile photo grading app for creators, focused on a **trusted offline LUT workflow**: import or generate a look, preview it truthfully, resume later, and export with confidence. The app may borrow useful flow ideas from MODIPIX — photo-first composition, bottom-toolbar ergonomics, and local-feeling tool entry — but those patterns are subordinate to render truth, draft trust, and Mobilut's own product identity.

Mobilut keeps the existing identity from `DESIGN.md`:
- Dark-first UI
- Teal accent `#00B4A6`
- Glass surfaces for floating UI
- Modern typography (Inter/system font)
- Photo remains the hero

### 1.2 Core Product Principles

1. **Photo-first** — The photo is always the most important element on screen. UI should support the image, not compete with it.

2. **Trusted offline LUT workflow** — Preview truth and export truth matter more than chrome. If a look cannot be previewed, resumed, and exported consistently, the product promise fails.

3. **Fast-to-edit** — Moving from Home to Editor should feel immediate. Opening a new image or resuming a draft should take the user directly into editing.

4. **Tools feel local, not page-based** — Editing tools belong inside the Editor experience, not as separate full-screen routes.

5. **Local-first and offline** — All core flows must work offline. No backend in v1.

6. **Re-editable workflow** — Drafts, modification logs, LUT imports, and batch sessions must all support coming back and continuing work later.

7. **Borrow flow, not brand** — Mobilut borrows screen hierarchy and tool entry patterns where useful. Mobilut does NOT borrow a competitor's identity, monetization posture, or feature priorities blindly.

### 1.3 Product Scope

#### Core Surfaces
- Phase 1: Home, Editor, Settings
- Phase 3: Batch

#### Core Editing Capabilities (9 Tools, Phased)

| Phase | Tools | Rationale |
|-------|-------|-----------|
| **Phase 1** | Crop, Adjust, LUT, Border/Frame | Establish trusted single-photo loop, render parity, and draft resume |
| **Phase 2** | Artistic Look, Smart Filter, Pro Clarity | Deterministic styles, need tuning |
| **Phase 3** | Batch, Blend | Larger memory, session, and export complexity |

**Notes:**
- Border + Frame = 1 framing subsystem internally
- Smart Filter = deterministic auto-enhance, NOT AI
- Blend deferred due to memory/export complexity

### 1.4 Monetization

- **Ads only, but not in Phase 1** — Home banner and ad work are deferred to **Phase 3**
- No paywall / IAP / pro unlock in this redesign scope
- If interstitial added later: cap max 1 ad / 5 minutes
- Monetization must never block the trusted editing loop

### 1.5 Localization

- **English-only UI** for v1
- No language switcher in Settings
- Architecture must remain i18n-ready: centralized copy, no hardcoded strings, future Vietnamese support stays feasible

### 1.6 First-Time Experience

- **Straight to Home** — No onboarding slides or tooltip tour
- Compensate with good inline guidance and empty-state copy

---

## 2. Screen Flows & Navigation

### 2.1 Navigation Model

Stack navigation for major screens + bottom sheets for tool interactions inside Editor.

#### Stack Screens
- Home
- Editor
- Settings
- Batch (Phase 3)

#### Bottom Sheet Surfaces (inside Editor)
- Tools sheet (full 9-tool grid)
- LUT picker sheet
- Crop sheet
- Adjust sheet
- Modification log sheet
- Export sheet
- Future tool sheets

**Rule:** Tool-specific interaction does not create new full-screen routes. User remains in Editor and works through sheets.

### 2.2 Navigation Routes

| Action | Route |
|--------|-------|
| Home → Editor | `router.push('/editor/[assetId]')` |
| Home → Settings | `router.push('/settings')` |
| Home → Batch | `router.push('/batch')` (Phase 3 only) |
| Editor → Tool Sheet | Bottom sheet overlay |
| Editor → Export | Bottom sheet overlay + progress |

### 2.3 Back / Dismiss Behavior

1. If a bottom sheet is open, back/swipe down closes the sheet first
2. If in Editor and no sheet is open, tapping close saves a draft and returns Home
3. If in Batch, back returns to Home (may preserve batch session for resume)

---

## 3. Screen Specifications

### 3.1 Home Screen

```
┌─────────────────────────────────────────────┐
│  MOBILUT                               ⚙️   │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │        + ADD NEW PHOTO              │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│                                             │
│  CONTINUE EDITING                           │
│  ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │Draft│ │Draft│ │Draft│  ← Tap to resume  │
│  │  1  │ │  2  │ │  3  │                   │
│  └─────┘ └─────┘ └─────┘                   │
│                                             │
├─────────────────────────────────────────────┤
│  Collection: 12        Drafts: 3           │
└─────────────────────────────────────────────┘
```

**Elements:**
- Compact header with logo / wordmark and settings entry
- Primary `ADD NEW PHOTO` CTA above the fold
- Draft grid under a clear `CONTINUE EDITING` label
- Small stats row after the primary action area
- Settings icon (top right) → Settings screen

**Phase 1 scope note:**
- Home prioritizes `Resume draft` and `Add new photo` above utilities.
- Batch entry does **not** ship in Phase 1. It appears with the Phase 3 batch workflow.
- Home ad banner does **not** ship in Phase 1. It is deferred to Phase 3.

**Empty State:**
- "NO CONTENT FOUND." with helpful copy
- Prominent "ADD NEW PHOTO +" button

### 3.2 Editor Screen

```
┌─────────────────────────────────────────────┐
│  ✕                                  EXPORT  │ ← Top bar
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│              PHOTO CANVAS                   │
│           (photo is the hero)               │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  🔲   ✂️   🎚️   🎨   📋   ⟲   ⟳          │ ← Bottom toolbar
│ Tools Crop Adj  LUT  Log Undo Redo         │
└─────────────────────────────────────────────┘
```

**Top Bar:**
- Left: Close (✕) — saves draft, returns to Home
- Right: EXPORT button — opens export sheet

**Phase 1 architecture note:**
- The Editor shell ships only after preview/export parity and draft/session hydration are in place.

**Bottom Toolbar (7 items):**
1. **Tools** — opens full 9-tool grid sheet
2. **Crop** — opens crop/transform sheet
3. **Adjust** — opens adjustment sliders sheet
4. **LUT** — opens LUT picker sheet
5. **Log** — opens modification log sheet
6. **Undo** — direct action
7. **Redo** — direct action

**Tool Access Model:**
- Shortcuts for most-used tools in bottom bar
- "Tools" opens full catalog for all 9 tools

### 3.3 Tools Sheet (Full Catalog)

```
┌─────────────────────────────────────────────┐
│                    ━━━                      │ ← Drag handle
│                  TOOLS                      │
├─────────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐           │
│  │Crop│  │Adj │  │LUT │  │Smrt│           │
│  └────┘  └────┘  └────┘  └────┘           │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐           │
│  │Pro │  │Art │  │Bord│  │Blnd│           │
│  └────┘  └────┘  └────┘  └────┘           │
│  ┌────┐                                    │
│  │Fram│                                    │
│  └────┘                                    │
└─────────────────────────────────────────────┘
```

4-column grid, 9 tools total. Tapping opens respective tool sheet.

### 3.4 LUT Picker Sheet

```
┌─────────────────────────────────────────────┐
│                    ━━━                      │
├─────────────────────────────────────────────┤
│  [Favorites] [My LUTs] [Lifestyle] [Land..] │ ← Category tabs
├─────────────────────────────────────────────┤
│  [+ IMPORT NEW LUT]                         │
│  Supports .cube, .png files                 │
├─────────────────────────────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐                         │
│  │LUT│ │LUT│ │LUT│                         │ ← 3-col grid
│  │ 1 │ │ 2 │ │ 3 │                         │
│  └───┘ └───┘ └───┘                         │
├─────────────────────────────────────────────┤
│  Intensity: 100%  ━━━━━━●━━━━━             │
│                                             │
│  [ ✕ Cancel ]              [ ✓ Apply ]     │
└─────────────────────────────────────────────┘
```

**Categories:**
- Favorites
- My LUTs (imported)
- Lifestyle
- Landscape
- Nature
- Portrait
- Cinematic
- B&W

**Behavior:**
- Selecting a LUT previews immediately on canvas
- Intensity slider updates live preview
- Import available under "My LUTs"

### 3.5 Crop/Transform Sheet

```
┌─────────────────────────────────────────────┐
│                    ━━━                      │
│          TRANSFORM & CROP                   │
├─────────────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │Free│ │ 1:1│ │4:5 │ │16:9│ │Cust│       │
│  └────┘ └────┘ └────┘ └────┘ └────┘       │
├─────────────────────────────────────────────┤
│  [Ratio] [Corners] [Straighten] [PerspX]..  │
├─────────────────────────────────────────────┤
│  Straighten: 0°  ━━━━━━●━━━━━              │
├─────────────────────────────────────────────┤
│  [ ✕ ]  [ ⟲ Reset ]              [ ✓ ]    │
└─────────────────────────────────────────────┘
```

**Controls:**
- Ratio presets (Free, 1:1, 4:5, 9:16, 16:9, Custom)
- Corners (rounded corners control)
- Straighten (rotation slider)
- Perspective X
- Perspective Y

### 3.6 Adjustment Sheet

```
┌─────────────────────────────────────────────┐
│                    ━━━                      │
│               ADJUSTMENTS                   │
├─────────────────────────────────────────────┤
│  Exposure      ━━━━━━●━━━━━━        +0.5   │
│  Contrast      ━━━━━━●━━━━━━        +10    │
│  Highlights    ━━━━●━━━━━━━━        -20    │
│  Shadows       ━━━━━━━●━━━━━        +15    │
│  Saturation    ━━━━━━●━━━━━━        +5     │
│  Vibrance      ━━━━━━●━━━━━━        +10    │
│  Temperature   ━━━━━━●━━━━━━        0      │
│  Tint          ━━━━━━●━━━━━━        0      │
├─────────────────────────────────────────────┤
│  [ ✕ ]  [ ⟲ Reset ]              [ ✓ ]    │
└─────────────────────────────────────────────┘
```

**Sliders:**
- Exposure, Contrast, Highlights, Shadows
- Saturation, Vibrance
- Temperature, Tint

**Behavior:**
- Real-time preview on canvas
- Continuous slider drags coalesce into single history step

### 3.7 Modification Log Sheet

```
┌─────────────────────────────────────────────┐
│                    ━━━                      │
│  🔖 MODIFICATION LOG              3 STEPS  │
├─────────────────────────────────────────────┤
│  👁️ #1  ┌────┐  CROP                    ✕  │
│         │prev│  Crop applied                │
│         └────┘                              │
├─────────────────────────────────────────────┤
│  👁️ #2  ┌────┐  ADJUST                  ✕  │
│         │prev│  Exposure +0.5               │
│         └────┘                              │
├─────────────────────────────────────────────┤
│  👁️ #3  ┌────┐  LUT                     ✕  │
│         │prev│  LC1 @ 80%                   │
│         └────┘                              │
└─────────────────────────────────────────────┘
```

**Features:**
- List of all edit steps
- Thumbnail preview for each step
- Eye icon to preview that state
- X to delete individual step
- Max 50 steps
- Full EditState snapshot per step

### 3.8 Export Sheet

```
┌─────────────────────────────────────────────┐
│                    ━━━                      │
│          SELECT EXPORT FORMAT               │
├─────────────────────────────────────────────┤
│  ┌────┐                                    │
│  │PNG │  High Quality (Lossless)        >  │
│  └────┘                                    │
├─────────────────────────────────────────────┤
│  ┌────┐                                    │
│  │JPEG│  Standard (Most Compatible)     >  │
│  └────┘                                    │
└─────────────────────────────────────────────┘
```

**V1 Formats:**
- PNG — High Quality (Lossless)
- JPEG — Standard (Most Compatible)
- WEBP/HEIC — Deferred

**Export Progress:**
```
┌─────────────────────────────────────────────┐
│  ✕                                    ⟳    │
├─────────────────────────────────────────────┤
│                                             │
│           ┌─────────────────┐               │
│           │                 │               │
│           │  (blurred)      │               │
│           │                 │               │
│           │  ━━━━━━━━━━━━━  │               │
│           │      50%        │               │
│           │  EXPORTING...   │               │
│           │                 │               │
│           └─────────────────┘               │
│                                             │
└─────────────────────────────────────────────┘
```

- Blur/dim canvas during export
- Progress bar with percentage
- "EXPORTING..." label

### 3.9 Batch Screen

**Phase note:** Batch is explicitly deferred to **Phase 3**. It is not part of the trusted single-photo loop milestone.

```
┌─────────────────────────────────────────────┐
│  <      BATCH PROCESS               EXPORT  │
├─────────────────────────────────────────────┤
│  [+] [1] [2] [3] [4] [5] [6] ...           │ ← Thumbnail strip
├─────────────────────────────────────────────┤
│                                             │
│        [<]    ACTIVE PREVIEW    [>]         │
│                                             │
├─────────────────────────────────────────────┤
│  🗑️   100%  ━━━━━●━━━━━   [ ✓ APPLY ALL ]  │
├─────────────────────────────────────────────┤
│  [Favorites] [My LUTs] [Lifestyle] ...      │
├─────────────────────────────────────────────┤
│  [+ IMPORT NEW LUT]                         │
│  ┌────┐ LC1 - FREE                     ♡   │
│  └────┘                                     │
│  ┌────┐ LC2 - FREE                     ♡   │
│  └────┘                                     │
└─────────────────────────────────────────────┘
```

**Batch v1 Scope:**

| Supports | Does NOT Support |
|----------|------------------|
| Multi-photo selection (max 20) | Crop per image |
| Prepare workspace state | Adjust panel per image |
| Thumbnail strip with + add | Border/Frame per image |
| Active preview with prev/next | Blend |
| Category tabs | Full per-image tool stack |
| LUT/style browser | |
| Import LUT | |
| Intensity slider | |
| Apply All | |
| Batch export | |

**Photo Selection:**
- Two-tab picker: Recent + Albums
- Max 20 photos per batch session

### 3.10 Settings Screen

```
┌─────────────────────────────────────────────┐
│  ←  PREFERENCES                             │
├─────────────────────────────────────────────┤
│                                             │
│  SETTINGS                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                             │
│  🌐  Export Quality                      >  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🗑️  Clear Cache                         >  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ⭐  Rate Us                              >  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🔒  Privacy Policy                       >  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  📄  Terms of Service                     >  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  </>  Developer                           >  │
│       Mobilut Team                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ℹ️  Version                                │
│      v1.0.0                                 │
└─────────────────────────────────────────────┘
```

**Settings Items:**
- Export Quality
- Clear Cache
- Rate Us
- Privacy Policy
- Terms of Service
- Developer
- Version

---

## 4. Data Architecture

### 4.1 Draft Persistence

**Storage:** File-based (not AsyncStorage or SQLite)

```
drafts/
└── <draftId>/
    ├── draft.json      # EditState, history metadata, timestamps
    └── preview.jpg     # Thumbnail for Home screen
```

**draft.json contains:**
- Asset reference (URI, dimensions)
- Current EditState
- Modification log metadata
- Timestamps (created, modified)
- Tool state

**Does NOT contain:**
- Full rendered bitmaps
- Raw LUT blobs (use import store)
- Data that can be regenerated

### 4.2 Modification Log

- **Full EditState snapshot** per step
- **Max 50 steps**
- **Coalesce continuous interactions** (slider drag → 1 commit)

### 4.3 LUT Storage

Existing structure maintained:
- Imported LUTs in app documents folder
- Categories as metadata
- Favorites as user preference

---

## 5. Component Architecture

```
src/ui/
├── primitives/          # Atoms - no business logic
│   ├── text.tsx         # Typography variants
│   ├── button.tsx       # Primary, Secondary, Ghost, Icon
│   ├── icon.tsx         # Icon wrapper with size/color tokens
│   └── spacer.tsx       # Consistent spacing
│
├── controls/            # Interactive elements
│   ├── slider.tsx       # Value slider with label
│   ├── toggle.tsx       # On/off switch
│   ├── segmented-control.tsx  # Tab-like selection
│   └── stepper.tsx      # +/- increment control
│
├── layout/              # Structural components
│   ├── safe-area-view.tsx
│   ├── bottom-sheet.tsx      # Draggable sheet
│   ├── tool-panel.tsx        # Glass background panel
│   ├── category-tabs.tsx     # Horizontal scrollable tabs
│   └── grid.tsx              # Configurable grid layout
│
├── feedback/            # Status & notifications
│   ├── toast.tsx
│   ├── loading-overlay.tsx
│   ├── error-banner.tsx
│   └── progress-bar.tsx
│
├── media/               # Photo-specific UI without renderer ownership
│   ├── photo-thumbnail.tsx   # Square thumbnail with selection
│   └── photo-placeholder.tsx # Pure UI fallback / empty media state
│
└── composite/           # Assembled from above
    ├── tool-grid.tsx         # 4-column tool icons
    ├── lut-browser.tsx       # Categories + grid
    ├── modification-log.tsx  # History list
    └── draft-card.tsx        # Home screen draft item

src/adapters/skia/
├── preview-canvas.tsx        # Renderer-backed canvas
└── before-after-view.tsx     # Renderer-backed compare surface
```

**Principles:**
- Each component has 1 responsibility
- Props fully typed with TypeScript
- No business logic imports in UI components
- Storybook-ready (can test isolated)
- Renderer-backed surfaces such as `PreviewCanvas` and `BeforeAfter` stay at the feature / adapter boundary, not in shared `src/ui/`

---

## 6. Implementation Phases

### Phase 1: Trusted Single-Photo Loop

**Goal:** Ship a truthful single-photo editing loop first: real preview/export parity, draft resume, and a faster Home → Editor experience.

**Deliverables:**
1. Render parity milestone: preview and export apply the same supported Phase 1 transforms
2. Draft/session repository with hydration and resume contracts
3. New Home screen with draft-first information architecture
4. New Editor shell with bottom toolbar and tool sheets
5. Tools: Crop, Adjust, LUT, Border/Frame
6. Modification Log with coalesced interactive edit commits
7. Export sheet + progress with explicit success/failure states
8. Settings screen with no language switcher and Theme hidden/disabled in v1
9. Regression coverage for editor, export, storage, and route hydration

### Phase 2: Stylistic Tools

**Goal:** Add curated style tools.

**Deliverables:**
1. Artistic Look tool (preset style families)
2. Smart Filter tool (deterministic auto-enhance)
3. Pro Clarity tool (clarity/sharpening stack)

### Phase 3: Batch + Advanced

**Goal:** Add Batch only after the single-photo loop is trusted, then expand into higher-order workflows.

**Deliverables:**
1. Batch screen
2. Multi-photo picker (Recent + Albums)
3. Batch LUT application
4. Batch export
5. Home batch entry
6. Home ad banner integration
7. Blend tool (if prioritized)

---

## 7. Visual Design Reference

All visual styling follows `DESIGN.md`:

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-black` | `#000000` | Primary canvas |
| `--surface-dark-1` | `#0A0A0A` | Panels |
| `--surface-dark-2` | `#141414` | Cards |
| `--accent` | `#00B4A6` | CTAs, active states |
| `--text-primary` | `#FFFFFF` | Headlines |
| `--text-secondary` | `rgba(255,255,255,0.7)` | Body |
| `--glass-bg` | `rgba(28,28,30,0.8)` | Toolbar blur |

**Key Visual Rules:**
- Photo always hero
- Glass effect for floating toolbars
- Pill-shaped CTAs (980px radius)
- 44px minimum touch targets
- Teal accent for interactive elements only

---

## 8. Appendix

### A. Files to Keep (Existing Core)

- `src/core/` — Edit session, errors, image pipeline, LUT models
- `src/services/` — Render services, LUT import/export, storage
- `src/adapters/` — Expo modules, Skia runtime
- `packages/lut-core/` — Pure TS LUT parsing library

### B. Reference Screenshots

Located at `/Users/gold/Documents/mobilut-ui/` and `/Users/gold/Documents/`:
- MODIPIX Home, Editor, Batch, Settings, Paywall screens
- Export UI reference
- Batch process reference

### C. Decision Log

| # | Topic | Decision |
|---|-------|----------|
| 1 | Theme | Keep DESIGN.md |
| 2 | Batch | Yes, but Phase 3 only |
| 3 | Paywall | No, ads only, deferred to Phase 3 |
| 4 | Tools | 9 tools, phased |
| 5 | LUT Categories | Full |
| 6 | Home | Draft-first action above the fold, then brand/stats |
| 7 | Mod Log | Full snapshots, 50 steps |
| 8 | Settings | Full + extras, but no language switcher and Theme hidden/disabled in v1 |
| 9 | Navigation | Stack + Bottom sheets |
| 10 | Draft persistence | File-based |
| 11 | Batch limit | 20 photos |
| 12 | Export | In-editor sheet, JPEG + PNG |
| 13 | Ads | Banner on Home, Phase 3 only |
| 14 | Localization | English-only UI, i18n-ready for future Vietnamese support |
| 15 | Onboarding | None |
| 16 | Batch scope | LUT/style apply only |

---

## /autoplan Review Intake

- Base branch: `master`
- Platform: GitHub
- Review target: this spec file
- UI scope: Yes
- DX scope: No. This is an end-user mobile app redesign, not an API/CLI/SDK/product-for-developers plan.
- Design mockups: Skipped. `DESIGN_NOT_AVAILABLE` from gstack design setup.
- Restore point: `/Users/gold/.gstack/projects/monet88-mobilut/master-autoplan-restore-20260420-091926.md`
- Test plan artifact: `/Users/gold/.gstack/projects/monet88-mobilut/gold-master-test-plan-20260420-094319.md`

**Plan summary**

This spec tries to turn Mobilut into a dark, premium, MODIPIX-inspired mobile editor with a new Home, a bottom-sheet-first Editor, a Batch surface, richer draft persistence, and a broader visual system.

The core review question is not whether that shell looks good. It is whether the repo actually has the foundations to make that shell truthful: preview/export parity, draft/session hydration, LUT persistence, failure recovery, and a clear wedge for who this product is for.

---

## Phase 1 — CEO Review

### Step 0A — Premise Challenge

| Premise | Evidence | Verdict |
|---|---|---|
| Borrowing MODIPIX flow is the fastest way to a strong product | The spec is benchmark-led at `1.1` and `1.2`, but the repo already has a more differentiated offline creator mechanic in `src/features/quick-color-copy/quick-color-copy.screen.tsx`. | Weak. This is a style benchmark, not a moat. |
| Phase 1 is “grounded on existing logic” | Current Home is just `ImportImageScreen` in `app/index.tsx`. Editor state is reducer-local in `src/features/editor/use-editor-session.ts`. Preview ignores transforms in `src/services/image/preview-render.service.ts`. | False as written. Large parts of Phase 1 are net-new infrastructure. |
| English-only is the right v1 language choice | Repo contract says “Vietnamese creators” in `CLAUDE.md`. Current settings and defaults already support Vietnamese and English in `src/features/settings/settings.screen.tsx` and `src/services/storage/app-preferences.ts`. | Unproven and currently contradictory. |
| Ads-only can coexist with a premium-feeling creator tool | The spec places a banner ad on Home and makes ad work a Phase 1 deliverable. | High risk. Premium feeling and ad-first economics pull in opposite directions. |
| Batch belongs in the core redesign | Project scope in `CLAUDE.md` explicitly defers batch processing, while this spec restores it as a core surface and a full phase. | Overreach. This is a second product. |

### Step 0B — Existing Code Leverage

| Sub-problem | Existing code | Reuse level | Review note |
|---|---|---|---|
| Photo import entry | `app/index.tsx`, `src/features/import-image/*` | Partial | Entry exists, but Home is import-first and not draft-first. |
| Editor state, undo/redo | `src/features/editor/use-editor-session.ts`, `editor-reducer.ts`, `src/core/edit-session/*` | Partial | Useful base for single-photo editing, but reducer is ephemeral and not hydrated from storage. |
| LUT browser/catalog | `src/features/preset-browser/*`, `src/services/lut/lut-library.service.ts` | Partial | Catalog and category browsing exist, but no Home/editor shell integration like this spec assumes. |
| LUT import | `src/features/import-lut/*`, `src/services/lut/lut-import.service.ts` | Partial | `.cube` import exists, but persistence is AsyncStorage metadata only. No real app-documents repository yet. |
| Preview path | `src/services/image/preview-render.service.ts`, `src/adapters/skia/preview-canvas.tsx` | Weak | Request builder exists, but preview output is still just the source image URI with scaled dimensions. |
| Export path | `src/features/export-image/*`, `src/services/image/export-render.service.ts` | Partial | Crop/rotate/resize exists. Claimed Phase 1 transforms do not all render today. |
| Settings/preferences | `src/features/settings/*`, `src/services/storage/app-preferences.ts` | Partial | Working base, but the current language/theme/export model conflicts with this spec. |
| Draft persistence | none | None | Entirely new system. |
| Batch | no route in `app/`, no feature surface | None | Entirely new system. |
| Ads | package + config only | Weak | SDK is present, but the product, consent, and offline behavior are not designed. |

### Step 0C — Dream State Mapping

```text
CURRENT STATE
Basic offline import -> single-photo editor shell -> crop/adjust/LUT state -> JPEG export
No real draft repository, no preview/export parity, no batch, no trusted resume loop

THIS PLAN
Premium dark shell, draft-centric Home, bottom-sheet editor, richer tool catalog, batch,
ads, and redesign-wide visual refresh

12-MONTH IDEAL
Fastest trusted offline LUT workflow for creators, with preview/export parity, resilient
draft resume, a clear audience wedge, and optional higher-order flows that sit on top
of proven editing truth instead of replacing it
```

### Step 0C-bis — Implementation Alternatives

**Approach A: UI-First MODIPIX Shell**

- Summary: Lead with Home, toolbar, sheets, visual redesign, and the full screen taxonomy.
- Effort: L
- Risk: High
- Pros: Immediate visual change, easy to demo, closer to the reference app fast.
- Cons: Bakes new chrome on top of unproven render/session truth, invites fake-premium failure, spreads the team across too many surfaces.
- Reuses: Existing editor shell, existing preset browser, existing settings screen.

**Approach B: Render-Truth-First Single-Photo Loop**

- Summary: Start by fixing preview/export parity, draft/session hydration, and undo/history transactions, then wrap those in the new shell.
- Effort: M
- Risk: Medium
- Pros: Strengthens the product’s most important promise, keeps scope around one loop, gives every later UI surface something truthful to sit on.
- Cons: Less immediately flashy, delays batch and ad experiments.
- Reuses: Current editor reducer, export hook, LUT services, preview request builder.

**Approach C: Creator-Wedge-First Architecture**

- Summary: Make the differentiator explicit, “trusted offline look matching + drafts + export parity,” and use Quick Color Copy / LUT workflows as the brand anchor instead of benchmark mimicry.
- Effort: L
- Risk: Medium
- Pros: Gives Mobilut a reason to exist, clarifies user, clarifies roadmap, cuts scope drift.
- Cons: Requires product reframing, not just design polish.
- Reuses: Quick Color Copy, LUT core, preset/import/export stack.

**Recommendation:** Choose Approach B now, then explicitly borrow elements of Approach C for product positioning. It is the smallest plan that fixes the part users will actually judge.

### Step 0D — SELECTIVE_EXPANSION Analysis

- Complexity check: this plan spans `app/`, `src/features/`, `src/ui/`, `src/services/`, `src/core/`, theme tokens, storage, ads, and a brand migration. It is far beyond “ship editor shell.”
- Minimum set that achieves the stated core objective:
  1. Real draft/session hydration
  2. Preview/export parity for the Phase 1 transform set
  3. Editor/Home information architecture that makes one action obvious
  4. A clean migration plan for tokens, language, and settings
- Expansion scan results:
  - Batch is a product expansion, not a shell detail.
  - Ads-first monetization is a business-model expansion, not an editor requirement.
  - Phase 2 labels (“Artistic Look”, “Smart Filter”, “Pro Clarity”) are taxonomy extensions without a user outcome definition.

### Step 0E — Temporal Interrogation

- Hour 1: user imports a photo, opens editor, expects the preview to be true.
- Hour 6: user returns to a saved draft, expects it to load and still point at a real asset.
- Week 2: user compares export to preview, and this is where trust is either won or lost.
- Month 6 regret if unchanged: the app looks polished but still feels unreliable, derivative, and over-scoped.

### Step 0F — Mode Selection Confirmation

- Selected mode: `SELECTIVE_EXPANSION`
- Why: the current spec has too much surface area for the strength of the current foundations. The right move is not “cut ambition,” it is “reorder ambition around truth first.”

### CEO Dual Voices

**CLAUDE SUBAGENT (CEO — strategic independence)**

- Reframe the product around “fastest, most trusted offline LUT editor for Vietnamese creators.”
- Stop optimizing UI chrome before render truth.
- Challenge English-only, batch-as-core, and ads-first as unproven or contradictory.
- Make the brand/token migration explicit instead of hiding it inside design polish.

**CODEX SAYS (CEO — strategy challenge)**

- The plan is competitor-chasing disguised as strategy.
- The repo already has a more distinct wedge in offline Quick Color Copy and LUT workflows.
- Batch and ads-first both smell like inherited competitor scope, not first-principles product work.
- The roadmap has labels and phases, but no success definition or moat.

### CEO DUAL VOICES — CONSENSUS TABLE

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| 1. Premises valid? | No | No | CONFIRMED |
| 2. Right problem to solve? | No, reframe around trust + wedge | No, reframe around wedge + creator job | CONFIRMED |
| 3. Scope calibration correct? | No | No | CONFIRMED |
| 4. Alternatives sufficiently explored? | No | No | CONFIRMED |
| 5. Competitive / market risks covered? | No | No | CONFIRMED |
| 6. 6-month trajectory sound? | No | No | CONFIRMED |

### CEO Review Sections

#### Section 1 — Architecture Review

**System architecture, current vs proposed**

```text
CURRENT
Home(import CTA)
  -> ImportImageScreen
  -> router.push('/editor/[assetId]')
  -> EditorScreen
      -> useEditorSession
      -> PreviewCanvas(raw asset)
      -> PresetBrowser
      -> AdjustmentPanel
      -> RotateControls
      -> CropOverlay
      -> ExportImageScreen
          -> useExportImage
          -> renderExport(crop/rotate/resize)

SETTINGS
  -> SettingsScreen
      -> AsyncStorage preferences

PROPOSED BY THIS SPEC
Home(drafts/stats/add/batch/ad)
  -> DraftRepository
  -> Draft thumbnails
  -> Editor shell with sheet router
      -> Preview executor parity
      -> Export executor parity
      -> Modification log repository
      -> LUT repository
      -> Batch workspace (new)
```

Findings:
- The spec assumes the new Home and Editor are mostly presentational, but draft hydration and parity are new architecture, not polish.
- Batch introduces a separate memory, scheduling, and failure domain.
- Theme, language, and monetization changes create a product migration layer the spec does not acknowledge.

#### Section 2 — Error & Rescue Map

| Method / Codepath | What Can Go Wrong | Exception / Failure Class | Rescued? | Rescue Action | User Sees |
|---|---|---|---|---|---|
| Photo import | permission denied | picker permission error | Y today | `ErrorBanner`, retry | Clear inline error |
| Draft load | asset missing or moved | stale asset reference | N | None yet | Placeholder or broken editor |
| LUT import | malformed `.cube` | parse failed | Y today | typed LUT error + retry | Good |
| LUT import persistence | metadata saved, file URI stale | stale imported asset | N | None yet | My LUTs breaks later |
| Preview render | requested transform ignored | parity defect | N | None yet | Silent wrong preview |
| Export render | transform unsupported | export parity defect | N | None yet | Silent wrong export |
| Batch export | item N fails mid-run | partial batch failure | N | Not designed | Unknown |
| Ad load | network / consent / SDK fail | ad runtime failure | N | Not designed | Unknown |

#### Section 3 — Security Review

- There is no user auth boundary to design. This is local-first.
- The real trust boundary is user-supplied files plus ad SDK behavior.
- Critical missing boundary rules:
  - oversized image rejection before expensive reads
  - `.cube` vs Hald validation before persistence
  - ad failure / offline fallback so ads never block the core flow

#### Section 4 — Data Flow & Interaction Edge Cases

| Interaction | Edge Case | Handled? | Review Note |
|---|---|---|---|
| Resume draft | source asset deleted | No | No session hydration contract yet |
| Slider drag | 40 move events | No | Current reducer likely creates too many history steps |
| Export | save/share permission denied | Partial | error UI exists, destination flow unclear |
| LUT browser | imported LUT URI stale | No | metadata-only persistence today |
| Batch export | item 7 of 20 fails | No | no partial-success model |

#### Section 5 — Code Quality Review

- “Foundation exists” should be split into “already real” and “net-new.”
- The plan is benchmark-specific where it should be user-specific.
- The component architecture risks moving renderer-backed logic into generic UI.
- Several major choices are framed as decisions without evidence: English-only, ads-only, no onboarding, batch as core.

#### Section 6 — Test Review

- The risky paths are almost entirely unprotected today.
- Current automated coverage is strong for `lut-core`, light for import, and almost absent for editor/export/settings shell behavior.
- Required new test diagram and artifact are attached in `/Users/gold/.gstack/projects/monet88-mobilut/gold-master-test-plan-20260420-094319.md`.

#### Section 7 — Performance Review

- Full snapshots + thumbnail previews + eager history writes are the biggest hidden performance risk.
- Batch is the biggest likely OOM / jank source in the spec.
- Duplicated preview/export transform logic invites both performance waste and correctness drift.

#### Section 8 — Observability Review

- The spec does not define logging/diagnostics around draft restore, import failure, export failure, or batch failure.
- This repo has `src/services/diagnostics/`, but the plan never says when to record errors vs recover silently.

#### Section 9 — Deployment Review

- Ad SDK rollout, token migration, and route migration all need rollback posture.
- Current rollback posture is effectively “git revert,” but there is no feature flag or phased rollout defined.

#### Section 10 — Future-Proofing Review

- Reversibility: `2/5`
- Main debt if unchanged:
  1. derivative product framing
  2. render truth debt
  3. draft/session debt
  4. token migration debt
  5. batch memory debt
  6. monetization confusion

#### Section 11 — Design Escalations

- Home hierarchy is backwards for a tool that wants “fast-to-edit.”
- State coverage is weak outside Home empty state.
- Completion beats are underspecified.
- Design system alignment is compromised by the current orange token set and a still-visible Theme row.

### NOT in Scope (CEO)

- Full light-theme support. The plan references Theme, but dark-first is the real v1 posture.
- Full batch workflow, unless the user explicitly keeps it after the final gate.
- Ads-first monetization rollout until trust and retention are proven.
- Any developer-facing DX work. Not the product surface here.

### What Already Exists (CEO)

- Import flow, basic editor reducer, preset browser, export shell, settings shell, LUT import, and a design system document all exist.
- Draft repository, batch workspace, preview/export parity, and explicit migration rules do not.

### Dream State Delta

This plan moves toward a more polished editor shell, but without the recommended reframe it moves away from the 12-month ideal by prioritizing benchmark mimicry over creator trust.

### Error & Rescue Registry

See Section 2 above. The unresolved critical gaps are `draft load`, `preview parity`, `export parity`, `batch partial failure`, and `ad fallback`.

### Failure Modes Registry

| Codepath | Failure Mode | Rescued? | Test? | User Sees? | Logged? |
|---|---|---|---|---|---|
| Draft resume | source asset missing | No | No | Placeholder / broken resume | No |
| Preview render | transform ignored | No | No | Silent wrong preview | No |
| Export render | transform ignored | No | No | Silent wrong export | No |
| LUT browser | imported file URI stale | No | No | Broken My LUTs entry | No |
| Batch export | partial completion | No | No | Undefined | No |
| Ad banner | SDK / consent / offline failure | No | No | Undefined | No |

Rows 1-6 are all critical until the plan defines rescue behavior.

### CEO Completion Summary

| Item | Result |
|---|---|
| Mode selected | SELECTIVE_EXPANSION |
| Section 1 (Arch) | 4 major issues |
| Section 2 (Errors) | 8 codepaths mapped, 5 unresolved gaps |
| Section 3 (Security) | 2 non-auth trust boundaries flagged |
| Section 4 (Data/UX) | 5 interaction gaps |
| Section 5 (Quality) | 4 strategic-quality issues |
| Section 6 (Tests) | artifact written, major gaps remain |
| Section 7 (Perf) | 3 issues |
| Section 8 (Observability) | 2 gaps |
| Section 9 (Deploy) | 2 rollout / rollback risks |
| Section 10 (Future) | reversibility 2/5 |
| Section 11 (Design) | 5 escalations |
| Dual voices | ran, codex + subagent |
| Consensus | 6/6 confirmed |

**Phase 1 complete.** Codex: 8 concerns. Claude subagent: 8 issues. Consensus: 6/6 confirmed.

---

## Phase 2 — Design Review

### Step 0 — Design Scope Assessment

- Initial design completeness: `6/10`
- What a 10 looks like here: one obvious first action, explicit state coverage, clear completion beats, numeric tokens that match the real app, and no ambiguous migration work hiding inside a “redesign.”
- DESIGN.md status: present, useful, and more specific than the spec in several places.
- Existing design leverage:
  - `DESIGN.md` already defines spacing, safe areas, motion, depth, and token intent.
  - `src/ui/layout/bottom-sheet.tsx` provides the sheet shell.
  - `src/features/preset-browser/preset-browser.tsx` gives category-chip and card patterns that can be evolved rather than replaced.
  - `src/features/settings/settings.screen.tsx` shows the current card-row vocabulary that the redesign is partially replacing.

### Step 0.5 — Visual Mockups

- Skipped. `DESIGN_NOT_AVAILABLE`.
- Text-only review proceeded against this spec plus `DESIGN.md` plus the current token/component inventory.

### Design Dual Voices

**CLAUDE SUBAGENT (design — independent review)**

- Home prioritizes brand/stat blocks before action.
- Loading/error/partial states are largely unspecified.
- The emotional arc has no satisfying completion beat.
- Several implementation-defining details are still vague: metric definitions, export destination, batch session lifecycle, Theme row behavior.

**CODEX SAYS (design — UX challenge)**

- Unavailable after repeated CLI timeout.
- Primary review proceeded using repo evidence (`DESIGN.md`, current tokens, current Home/editor/settings shells).

### Design Litmus Scorecard

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| 1. Brand/product unmistakable in first screen? | Mixed | N/A | N/A |
| 2. One strong visual anchor present? | No | N/A | N/A |
| 3. Page understandable by scanning headlines only? | Partial | N/A | N/A |
| 4. Each section has one job? | Partial | N/A | N/A |
| 5. Are cards actually necessary? | Mixed | N/A | N/A |
| 6. Does motion improve hierarchy or atmosphere? | Unspecified | N/A | N/A |
| 7. Would it still feel premium without shadows? | Unclear | N/A | N/A |

### Review Passes

#### Pass 1 — Information Architecture

- Score: `6/10`
- Main issue: Home puts date/brand/stats first, drafts second, and action third.
- Fix to 10: make either `Resume last draft` or `Add new photo` the first-action band above the fold.

#### Pass 2 — Interaction State Coverage

- Score: `3/10`
- Only the Home empty state is explicit.
- Missing: loading, permission denied, stale draft, import failure, export failure, partial batch failure, success confirmation.

#### Pass 3 — User Journey & Emotional Arc

- Score: `5/10`
- The journey gets the user into the editor, but never defines the satisfying “done” loop.
- Missing: draft saved confirmation, tool applied confirmation, export completed / where did the file go / what next.

#### Pass 4 — AI Slop Risk

- Score: `6/10`
- The spec is more concrete than generic SaaS slop, but it is still too benchmark-driven.
- Risk areas:
  - Home header reads like a mood board before it reads like a tool.
  - Tool taxonomy is broad without a clear creator outcome.
  - Batch + ad banner + hero branding compete for attention in the first frame.

#### Pass 5 — Design System Alignment

- Score: `5/10`
- `DESIGN.md` and the spec both want teal/glass/dark-first.
- The live app token file is still orange-accented and the current settings surface still exposes a language/theme model that the spec partially denies.

#### Pass 6 — Responsive & Accessibility

- Score: `4/10`
- Good: `44px` touch target rule, safe-area intent, clear bottom-sheet orientation.
- Missing: screen reader behavior, large text / Dynamic Type handling in this specific redesign, landscape tablet behavior, reduced-motion fallback, permission and error copy visibility.

#### Pass 7 — Unresolved Design Decisions

| Decision Needed | If Deferred, What Happens |
|---|---|
| What is the Home first action? Resume draft or add new photo? | Home feels ornamental instead of fast |
| What do `Collection` and `Drafts` count exactly? | Engineers invent metrics |
| Is Theme visible in v1? | UI implies light mode that product does not actually support |
| Where does export land, and what does success look like? | Export feels unfinished |
| What survives in a batch session, and how is resume handled? | Batch becomes inconsistent fast |
| How do non-empty failure states look on LUT import/export/draft resume? | Silent bad states ship |

### NOT in Scope (Design)

- Full light-mode design pass
- Marketing / landing page work
- Desktop/tablet-specific layout system beyond what the user explicitly approves later

### What Already Exists (Design)

- Teal/glass/dark-first rules already exist in `DESIGN.md`.
- `bottom-sheet.tsx`, preset chips/cards, and settings card rows are reusable patterns.
- The current theme token file needs migration before the spec can claim alignment.

### Design Completion Summary

| Item | Result |
|---|---|
| Step 0 | 6/10 initial completeness |
| Pass 1 (Info Arch) | 6/10 |
| Pass 2 (States) | 3/10 |
| Pass 3 (Journey) | 5/10 |
| Pass 4 (AI Slop) | 6/10 |
| Pass 5 (Design System) | 5/10 |
| Pass 6 (Responsive/A11y) | 4/10 |
| Pass 7 (Decisions) | 6 unresolved |
| Overall design score | 5/10 current, 8/10 if fixes are adopted |
| Voices | subagent-only, codex unavailable |

**Phase 2 complete.** Codex: unavailable after timeout. Claude subagent: 5 issues. Consensus: N/A [subagent-only].

---

## Phase 3 — Eng Review

### Step 0 — Scope Challenge With Actual Code

The current app already has a viable single-photo backbone, but the spec tries to jump directly to a much larger system:

- Home is still just import-to-editor (`app/index.tsx`).
- Editor state is in-memory and route-param-light (`app/editor/[assetId].tsx`, `src/features/editor/use-editor-session.ts`).
- Preview is dimension-scaling only (`src/services/image/preview-render.service.ts`).
- Export is crop/rotate/resize only (`src/services/image/export-render.service.ts`).
- Storage for recents, imported LUTs, and preferences is still AsyncStorage-based (`src/services/storage/*`).
- There is no `/batch` route.

The plan therefore crosses from “UI redesign” into “editor engine hardening + storage migration + route migration + potential batch scheduler.”

### Eng Dual Voices

**CLAUDE SUBAGENT (eng — independent review)**

- Phase 1 is not grounded on enough existing logic to claim shell-first safety.
- The editor/session model would currently open a blank editor on redesign assumptions.
- Modification log design hides the biggest performance risk.
- Batch is the biggest 10x-load and failure-domain expansion.
- Test coverage is far behind the proposed blast radius.

**CODEX SAYS (eng — architecture challenge)**

- Unavailable after CLI timeout.
- Primary eng review proceeded from direct repo inspection, the test inventory, and the subagent findings.

### ENG DUAL VOICES — CONSENSUS TABLE

| Dimension | Claude | Codex | Consensus |
|---|---|---|---|
| 1. Architecture sound? | No | N/A | N/A |
| 2. Test coverage sufficient? | No | N/A | N/A |
| 3. Performance risks addressed? | No | N/A | N/A |
| 4. Security threats covered? | Partial | N/A | N/A |
| 5. Error paths handled? | No | N/A | N/A |
| 6. Deployment risk manageable? | Partial | N/A | N/A |

### Section 1 — Architecture Review

```text
Lane 0: Existing app shell
  app/index.tsx
    -> ImportImageScreen
    -> router.push('/editor/[assetId]')

Lane 1: Editor state
  EditorRoute
    -> EditorScreen
      -> useEditorSession
      -> editorReducer
      -> EditState/history

Lane 2: Rendering
  EditorScreen
    -> PreviewCanvas(raw image URI today)
  ExportImageScreen
    -> useExportImage
    -> renderExport(crop/rotate/resize today)

Lane 3: Storage
  app-preferences.ts (AsyncStorage)
  recent-items.ts (AsyncStorage)
  imported-lut-store.ts (AsyncStorage)

Lane 4: Proposed but missing
  DraftRepository(file-based)
  SessionLoader / hydration
  Preview parity executor
  Batch workspace / scheduler
```

Architecture findings:
- Preview/export parity has to become a first-class milestone, not an implementation detail.
- Draft/session hydration must exist before Home can honestly be draft-first.
- Renderer-backed photo components should stay near `features` / `adapters`, not be normalized into generic UI primitives.
- Batch needs its own architecture section if it survives the final gate.

### Section 2 — Code Quality Review

- The spec underestimates how much net-new architecture hides inside “Home + sheets + drafts.”
- `src/ui/media` risks breaking the repo’s current module boundaries.
- LUT storage in the spec is stronger than LUT storage in the code today.
- Locale/theme/token migration needs an explicit path instead of implicit “we keep DESIGN.md.”

### Section 3 — Test Review

**Current coverage**

- Present: `lut-core`, `.cube` round trip, `preview-render`, `import-image`, `quick-color-copy`
- Missing: `EditorScreen`, `useEditorSession`, `ExportImageScreen`, `useExportImage`, `SettingsScreen`, `BottomSheet`, draft storage, batch, token migration, route hydration

**Test diagram**

```text
NEW UX FLOWS
  Home -> add photo
  Home -> resume draft
  Editor -> open/close sheets
  Editor -> crop/adjust/LUT/framing history
  Export -> choose PNG/JPEG -> save/share
  Batch -> create/apply/export (if kept)

NEW DATA FLOWS
  asset -> draft/session -> preview
  EditState -> preview request -> preview executor
  EditState -> export request -> export executor
  imported LUT -> file copy -> LUT repository -> editor
  batch workspace -> thumbnail cache -> export queue

NEW ERROR / RESCUE PATHS
  stale draft asset
  malformed or oversized LUT
  preview/export parity mismatch
  save/share permission denied
  partial batch export failure
  ad SDK / offline failure on Home
```

**Artifact:** `/Users/gold/.gstack/projects/monet88-mobilut/gold-master-test-plan-20260420-094319.md`

### Section 4 — Performance Review

- History snapshots plus per-step thumbnails plus uncoalesced sliders are the highest-probability jank path.
- Batch thumbnails and export queues are the highest-probability memory path.
- Separate preview/export execution logic is the highest-probability drift path.

### NOT in Scope (Eng)

- Full batch scheduler implementation until the user explicitly keeps batch in scope.
- Any light-mode token system.
- Any new backend/auth system. Not relevant here.

### What Already Exists (Eng)

- Reducer/history core
- LUT core and preset browsing
- Import/export shells
- Settings persistence
- Theme provider + token file

What does **not** already exist:

- trustworthy preview renderer
- trustworthy multi-transform export renderer
- draft/session repository
- batch route + workspace
- regression coverage for the new shell

### Failure Modes

| Codepath | Failure Mode | Test? | Error Handling? | User Sees |
|---|---|---|---|---|
| Home -> editor hydration | missing asset URI | No | No | Placeholder or broken resume |
| Preview renderer | transform silently omitted | No | No | Wrong preview |
| Export renderer | transform silently omitted | No | Partial | Wrong export |
| LUT import persistence | stale file URI | No | No | Broken My LUTs |
| Batch export | partial success | No | No | Undefined |
| Ad banner | offline / consent / SDK failure | No | No | Undefined |

### Worktree Parallelization Strategy

| Step | Modules touched | Depends on |
|---|---|---|
| Render parity core | `src/core/`, `src/services/image/`, `src/adapters/`, `src/features/export-image/`, `src/features/editor/` | — |
| Draft/session hydration | `src/services/storage/`, `src/features/editor/`, `app/`, `src/core/edit-session/` | render parity core |
| Home/Editor shell redesign | `app/`, `src/features/editor/`, `src/ui/`, theme files | draft/session hydration |
| LUT repository hardening | `src/services/lut/`, `src/services/storage/`, `src/features/import-lut/`, `src/features/preset-browser/` | — |
| Batch workspace | `app/`, `src/features/`, `src/services/image/`, `src/services/storage/`, `src/ui/` | render parity core, draft/session hydration |

Parallel lanes:

- Lane A: `Render parity core -> Draft/session hydration -> Home/Editor shell`
- Lane B: `LUT repository hardening`
- Lane C: `Batch workspace` only if the user explicitly keeps batch

Execution order:

- Launch A and B in parallel.
- Merge B into A after render/session contracts stabilize.
- Launch C only after A is merged or if batch is cut, skip C entirely.

Conflict flags:

- Lanes A and B both touch storage contracts. Coordinate schema decisions first.
- Lane C conflicts with both A and B across editor/storage/image modules. It is not a safe early parallel lane.

### Eng Completion Summary

| Item | Result |
|---|---|
| Step 0 | Scope larger than “UI redesign”; core engine/storage work required |
| Architecture Review | 4 major issues |
| Code Quality Review | 4 major issues |
| Test Review | artifact produced, major gaps remain |
| Performance Review | 3 major issues |
| Failure modes | 6 critical gaps |
| Parallelization | 3 lanes, only 2 safe before user decision on batch |
| Voices | subagent-only, codex unavailable |

**Phase 3 complete.** Codex: unavailable after timeout. Claude subagent: 9 issues. Consensus: N/A [subagent-only].

---

## Phase 3.5 — DX Review

Skipped. No developer-facing surface detected.

---

## Cross-Phase Themes

### Theme: Render Truth Before Chrome

Flagged in CEO and Eng. This is the highest-confidence signal in the whole review.

### Theme: Scope Drift Around Batch / Ads / Language

Flagged in CEO, Design, and Eng. These are not tiny implementation details. They change who the product is for and how trustworthy it feels.

### Theme: Hidden Migration Work

Flagged in CEO, Design, and Eng. Token migration, locale migration, storage migration, and route migration are all implicit in the spec but not named as work.

### Theme: Missing State / Recovery Contracts

Flagged in Design and Eng. The plan names happy paths and surfaces, but not the non-happy states that determine whether the app feels premium or brittle.

---

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|---|---|---|---|---|---|
| 1 | Intake | Skip DX review | Mechanical | Pragmatic | This is not a developer-product plan | False-positive keyword count |
| 2 | Intake | Skip design mockups | Mechanical | Bias toward action | Designer binary unavailable | Waiting for unavailable tooling |
| 3 | CEO | Use SELECTIVE_EXPANSION | Mechanical | Pragmatic | Scope is too large for hold-scope confidence | Scope expansion as default |
| 4 | CEO | Recommend render-truth-first alternative | Taste | Explicit over clever | Stronger product truth with less fake-premium risk | UI-first shell |
| 5 | CEO | Surface MODIPIX-led positioning as a user challenge | User Challenge | Completeness | Both voices want a differentiated wedge | Silent acceptance of benchmark mimicry |
| 6 | CEO | Surface Batch-as-core as a user challenge | User Challenge | Boil lakes | Batch is outside the current trusted loop and current repo scope | Silent acceptance of batch expansion |
| 7 | CEO | Surface English-only as a user challenge | User Challenge | Evidence over assumption | Conflicts with repo defaults and audience framing | Silent locale pivot |
| 8 | CEO | Surface ads-only home banner as a user challenge | User Challenge | User outcome first | Premium trust and banner ads are in tension | Silent ads-first rollout |
| 9 | Design | Require explicit state matrix | Mechanical | Completeness | Missing non-happy states would haunt implementation | Hand-wavy “works” assumptions |
| 10 | Design | Treat Theme row as unresolved design debt | Taste | Explicit over clever | Current product is dark-first; Theme visibility needs a clear rule | Leaving misleading UI copy |
| 11 | Eng | Keep photo rendering out of generic `src/ui/media` | Taste | Module boundaries | Repo boundaries already separate UI from adapters/rendering | Moving renderer-backed components into shared UI |
| 12 | Eng | Create standalone test-plan artifact | Mechanical | Completeness | Risky flows need a concrete verification map | Implicit test follow-up |
| 13 | Eng | Treat codex design voice as unavailable after repeated timeout | Mechanical | Bias toward action | The review should continue when one tool stalls | Blocking on stubborn subprocess |
| 14 | Eng | Treat codex eng voice as unavailable after timeout | Mechanical | Bias toward action | Same reason as above | Blocking on stubborn subprocess |

---

## /autoplan Final Gate Inputs

### Plan Summary

The redesign is directionally strong on visual ambition, but structurally overconfident. The repo is not yet in a state where a shell-first rewrite is safe, because preview/export parity, draft truth, and migration rules are still missing or partial.

### Decisions Made: 14 total (7 auto-decided, 3 taste choices, 4 user challenges)

### User Challenges

**Challenge 1: What problem is Mobilut really solving?** (Phase 1)

- You said: borrow MODIPIX flow and interaction patterns as the organizing idea.
- Both models recommend: re-anchor the plan around a differentiated wedge, trusted offline LUT workflow + render truth + creator trust, then borrow only the UI patterns that serve that wedge.
- Why: benchmark mimicry gives no moat and hides what Mobilut should uniquely win on.
- What context we might be missing: you may have stronger user evidence that MODIPIX-like flow is exactly what your users want.
- If we’re wrong, the cost is: a slower, more opinionated reframing cycle.

**Challenge 2: Should Batch stay in core scope?** (Phase 1)

- You said: Batch is a core surface and a full phase.
- Both models recommend: defer Batch until the single-photo loop is truthful and sticky, or replace it with a smaller “apply last look to another photo” step.
- Why: Batch is a second product with separate memory, scheduling, and failure semantics.
- What context we might be missing: you may already know batch is a top repeated user request.
- If we’re wrong, the cost is: you delay a legitimately valuable workflow.

**Challenge 3: Should v1 really be English-only?** (Phase 1)

- You said: English only, no language switcher.
- Both models recommend: either keep bilingual support or justify the market pivot explicitly.
- Why: current repo defaults and product framing already point at Vietnamese creators.
- What context we might be missing: you may have distribution reasons to pivot global immediately.
- If we’re wrong, the cost is: extra product complexity around two languages.

**Challenge 4: Should Home carry an ad banner in v1?** (Phase 1)

- You said: ads only, banner on Home in v1.
- Both models recommend: do not make ads a Phase 1 requirement for this redesign.
- Why: it weakens the premium/trust signal before the core workflow is proven.
- What context we might be missing: you may need the monetization path in place early for operational reasons.
- If we’re wrong, the cost is: you delay monetization experiments.

### Your Choices

**Choice 1: Home first action** (Phase 2)

- Recommendation: make `Resume last draft` or `Add new photo` the primary above-the-fold anchor.
- Viable alternative: keep the heavy brand/stat block first.
- Impact if you choose the alternative: the app feels more editorial, but slower and less tool-like.

**Choice 2: Theme row in Settings** (Phase 2)

- Recommendation: hide or disable Theme in v1 with a clear “future” explanation.
- Viable alternative: keep Theme visible as-is.
- Impact if you choose the alternative: users may infer light mode support that the redesign explicitly does not want.

**Choice 3: Renderer-backed component placement** (Phase 3)

- Recommendation: keep `photo-canvas` / `before-after` near feature/adapter boundaries.
- Viable alternative: move them into `src/ui/media`.
- Impact if you choose the alternative: cleaner file taxonomy, but weaker renderer/module boundaries.

### Auto-Decided

See the Decision Audit Trail above.

### Review Scores

- CEO: issues open, strategy needs re-ordering around trust and wedge.
- CEO Voices: Codex 8 concerns, Claude subagent 8 issues, Consensus 6/6 confirmed.
- Design: issues open, especially states, hierarchy, and migration ambiguity.
- Design Voices: Codex unavailable, Claude subagent 5 issues, Consensus N/A.
- Eng: issues open, especially parity, session hydration, tests, and batch complexity.
- Eng Voices: Codex unavailable, Claude subagent 9 issues, Consensus N/A.
- DX: skipped, no developer-facing scope.

### Deferred to TODOS.md

- Light-mode support
- Batch hardening work beyond the approved Phase 3 scope
- Monetization experiments beyond core workflow truth
- Additional tool phases until the Phase 1 loop is trustworthy

---

## Approval Outcome

Status: **APPROVED WITH DECISIONS**

### Accepted User Challenge Responses

| Challenge | Final Decision |
|---|---|
| Product wedge | Trusted offline LUT workflow |
| Batch | Keep it, but Phase 3 only |
| Language | English-only UI, i18n-ready architecture, no language switcher |
| Ads | Keep them, but Phase 3 only |

### Applied Conditions

- Keep i18n architecture intact so Vietnamese can be added later without reworking the app shell.
- Remove the language switcher from the v1 plan and current product instructions.
- Update repo guidance so it no longer conflicts with the approved English-only UI direction.

### Accepted Taste Defaults

- Home prioritizes `Resume draft` / `Add new photo` over decorative brand/stat weight.
- Theme is hidden in v1.
- Renderer-backed components remain outside shared `src/ui/media`.

### Resulting Plan Posture

- Phase 1 is the trusted single-photo loop.
- Phase 2 expands style tools on top of that loop.
- Phase 3 adds Batch, Home ad integration, and any larger memory-heavy workflows.
