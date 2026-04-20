# Mobilut UI/UX Redesign Specification

**Date:** 2026-04-20  
**Status:** Approved  
**Reference:** MODIPIX app screenshots (`/Users/gold/Documents/mobilut-ui/`)

---

## 1. Product Direction & Experience Principles

### 1.1 Product Positioning

Mobilut is a dark-first mobile photo grading app for creators, focused on fast, intuitive, premium-feeling editing. The app borrows from MODIPIX in flow and interaction design — photo-first composition, bottom toolbar + bottom sheet controls, clear batch editing, and simple home/settings organization — but does not copy MODIPIX's visual identity.

Mobilut keeps the existing identity from `DESIGN.md`:
- Dark-first UI
- Teal accent `#00B4A6`
- Glass surfaces for floating UI
- Modern typography (Inter/system font)
- Photo remains the hero

### 1.2 Core Product Principles

1. **Photo-first** — The photo is always the most important element on screen. UI should support the image, not compete with it.

2. **Fast-to-edit** — Moving from Home to Editor should feel immediate. Opening a new image or resuming a draft should take the user directly into editing.

3. **Tools feel local, not page-based** — Editing tools belong inside the Editor experience, not as separate full-screen routes.

4. **Local-first and offline** — All core flows must work offline. No backend in v1.

5. **Re-editable workflow** — Drafts, modification logs, LUT imports, and batch sessions must all support coming back and continuing work later.

6. **Borrow flow, not brand** — Mobilut borrows screen hierarchy, tool entry model, batch interaction pattern, simple settings structure. Mobilut does NOT borrow light theme, serif editorial branding, or paywall/pro upgrade UX.

### 1.3 Product Scope

#### Core Surfaces
- Home
- Editor
- Batch
- Settings

#### Core Editing Capabilities (9 Tools, Phased)

| Phase | Tools | Rationale |
|-------|-------|-----------|
| **Phase 1** | Crop, Adjust, LUT, Border/Frame | Foundation exists, ship editor shell |
| **Phase 2** | Artistic Look, Smart Filter, Pro Clarity | Deterministic styles, need tuning |
| **Phase 3** | Blend | Asset management + layer complexity |

**Notes:**
- Border + Frame = 1 framing subsystem internally
- Smart Filter = deterministic auto-enhance, NOT AI
- Blend deferred due to memory/export complexity

### 1.4 Monetization

- **Ads only** — Banner on Home screen for v1
- No paywall / IAP / pro unlock
- If interstitial added later: cap max 1 ad / 5 minutes

### 1.5 Localization

- **English only** for v1
- No language switcher in Settings
- Architecture must remain i18n-ready (centralized copy, no hardcoded strings)

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
- Batch
- Settings

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
| Home → Batch | `router.push('/batch')` |
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
│  EST. 2026 / VOL. 01                    ⚙️  │
├─────────────────────────────────────────────┤
│                                             │
│  MOBILUT                                    │
│  CREATIVE STUDIO                            │
│                                             │
│  COLLECTION        STATUS                   │
│  12                Drafts: 3                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │Draft│ │Draft│ │Draft│  ← Tap to resume  │
│  │  1  │ │  2  │ │  3  │                   │
│  └─────┘ └─────┘ └─────┘                   │
│                                             │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │      ADD NEW PHOTO +                 │   │
│  └─────────────────────────────────────┘   │
│                                       🔲   │ ← Batch entry
│                                             │
│  ━━━━━━━━━━ AD BANNER ━━━━━━━━━━━━━━━━━━  │
└─────────────────────────────────────────────┘
```

**Elements:**
- Brand header with logo
- Collection count + draft count
- Draft grid (tap to resume editing)
- "ADD NEW PHOTO +" CTA → opens image picker
- Settings icon (top right) → Settings screen
- Batch icon → Batch screen
- Ad banner (bottom)

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
│  🎨  Theme                               >  │
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
- Theme (for future light mode)
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
├── media/               # Photo-specific
│   ├── photo-thumbnail.tsx   # Square thumbnail with selection
│   ├── photo-canvas.tsx      # Main editing canvas
│   └── before-after.tsx      # Comparison slider
│
└── composite/           # Assembled from above
    ├── tool-grid.tsx         # 4-column tool icons
    ├── lut-browser.tsx       # Categories + grid
    ├── modification-log.tsx  # History list
    └── draft-card.tsx        # Home screen draft item
```

**Principles:**
- Each component has 1 responsibility
- Props fully typed with TypeScript
- No business logic imports in UI components
- Storybook-ready (can test isolated)

---

## 6. Implementation Phases

### Phase 1: Editor Shell + Core Tools

**Goal:** Usable editor with MODIPIX-inspired flow, grounded on existing logic.

**Deliverables:**
1. Component library (primitives, controls, layout)
2. New Home screen with drafts
3. New Editor screen with bottom toolbar
4. Bottom sheet infrastructure
5. Tools: Crop, Adjust, LUT, Border/Frame
6. Draft persistence
7. Modification Log
8. Export sheet + progress
9. Settings screen
10. Ad banner integration

### Phase 2: Stylistic Tools

**Goal:** Add curated style tools.

**Deliverables:**
1. Artistic Look tool (preset style families)
2. Smart Filter tool (deterministic auto-enhance)
3. Pro Clarity tool (clarity/sharpening stack)

### Phase 3: Batch + Advanced

**Goal:** Full batch workflow + Blend tool.

**Deliverables:**
1. Batch screen
2. Multi-photo picker (Recent + Albums)
3. Batch LUT application
4. Batch export
5. Blend tool (if prioritized)

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
| 2 | Batch | In scope, LUT-first workflow |
| 3 | Paywall | No, ads only |
| 4 | Tools | 9 tools, phased |
| 5 | LUT Categories | Full |
| 6 | Home | Logo + Collection + Drafts |
| 7 | Mod Log | Full snapshots, 50 steps |
| 8 | Settings | Full + extras |
| 9 | Navigation | Stack + Bottom sheets |
| 10 | Draft persistence | File-based |
| 11 | Batch limit | 20 photos |
| 12 | Export | In-editor sheet, JPEG + PNG |
| 13 | Ads | Banner on Home |
| 14 | Localization | English only, i18n-ready |
| 15 | Onboarding | None |
| 16 | Batch scope | LUT/style apply only |
