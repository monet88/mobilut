# Mobilut Design System

Photo grading app for global creators. Apple-inspired with dark-first UI and Teal accent.

## 1. Visual Theme & Atmosphere

Dark-first interface where user photos are the hero. The UI retreats — every element exists to serve the image being edited. Vast dark expanses provide a neutral canvas that doesn't compete with any photo's color palette.

Typography is tight and confident. Inter (or system font) with negative letter-spacing creates a modern, premium feel without requiring proprietary fonts. Headlines compress, body text breathes.

**Key Characteristics:**
- Dark-first: pure black (`#000000`) as primary canvas
- Single accent: Mobilut Teal (`#00B4A6`) for all interactive elements
- Photo-as-hero: user images dominate, UI elements recede
- Tight headline typography with generous surrounding whitespace
- Glass surfaces for floating controls (sliders, toolbars)
- Pill-shaped CTAs and toggles

## 2. Color Palette & Roles

### Primary Surfaces
| Token | Hex | Usage |
|-------|-----|-------|
| `--surface-black` | `#000000` | Primary canvas, photo editing background |
| `--surface-dark-1` | `#0A0A0A` | Elevated panels, modal backgrounds |
| `--surface-dark-2` | `#141414` | Cards, tool panels |
| `--surface-dark-3` | `#1C1C1E` | Input backgrounds, secondary panels |
| `--surface-light` | `#F5F5F7` | Light mode alternate (settings, onboarding) |

### Interactive (Accent)
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#00B4A6` | Primary CTA, active states, sliders |
| `--accent-hover` | `#00D4C4` | Hover state, focus glow |
| `--accent-muted` | `rgba(0, 180, 166, 0.2)` | Selection backgrounds, subtle highlights |
| `--accent-on-light` | `#00A89B` | Accent on light backgrounds (darker for contrast) |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#FFFFFF` | Headlines, primary labels |
| `--text-secondary` | `rgba(255, 255, 255, 0.7)` | Body text, descriptions |
| `--text-tertiary` | `rgba(255, 255, 255, 0.4)` | Hints, disabled, metadata |
| `--text-on-light` | `#1D1D1F` | Text on light surfaces |
| `--text-on-accent` | `#FFFFFF` | Text on accent buttons |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#34C759` | Export complete, save confirmed |
| `--warning` | `#FF9F0A` | Large file warning, unsaved changes |
| `--error` | `#FF453A` | Invalid LUT, export failed |

### Shadows & Overlays
| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-card` | `0 4px 24px rgba(0, 0, 0, 0.5)` | Floating panels, modals |
| `--shadow-glow` | `0 0 20px rgba(0, 180, 166, 0.3)` | Active slider, focus states |
| `--overlay-scrim` | `rgba(0, 0, 0, 0.6)` | Modal backdrop, photo dimming |
| `--glass-bg` | `rgba(28, 28, 30, 0.8)` | Toolbar background with blur |

## 3. Typography Rules

### Font Stack
```
Primary: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
Mono: "SF Mono", "Fira Code", Consolas, monospace (for EXIF data, values)
```

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Display | 32px | 600 | 1.1 | -0.5px | Splash, empty states |
| Headline | 24px | 600 | 1.15 | -0.3px | Screen titles |
| Title | 20px | 600 | 1.2 | -0.2px | Section headers |
| Body | 16px | 400 | 1.5 | -0.2px | Descriptions, instructions |
| Label | 14px | 500 | 1.3 | -0.1px | Button text, input labels |
| Caption | 12px | 400 | 1.4 | 0 | Metadata, hints |
| Micro | 10px | 500 | 1.3 | 0.2px | Badges, tiny labels |

### Principles
- Negative letter-spacing at all sizes except micro
- Semibold (600) for headlines, regular (400) for body
- Tight line-heights for headlines (1.1-1.2), relaxed for body (1.5)
- Numeric values in mono font for precision feel

## 4. Component Stylings

### Buttons

**Primary (Accent)**
```
Background: #00B4A6
Text: #FFFFFF
Padding: 12px 24px
Radius: 980px (full pill)
Font: 14px, weight 500
Active: scale(0.98), brightness(1.1)
```

**Secondary (Outline)**
```
Background: transparent
Border: 1px solid rgba(255, 255, 255, 0.3)
Text: #FFFFFF
Padding: 12px 24px
Radius: 980px
Hover: border-color rgba(255, 255, 255, 0.6)
```

**Ghost**
```
Background: transparent
Text: rgba(255, 255, 255, 0.7)
Padding: 8px 16px
Hover: text #FFFFFF
```

**Icon Button**
```
Background: rgba(255, 255, 255, 0.1)
Size: 44px x 44px (touch target)
Radius: 12px
Icon: 24px, rgba(255, 255, 255, 0.8)
Active: background rgba(0, 180, 166, 0.2)
```

### Sliders (Critical for photo grading)

```
Track: 4px height, rgba(255, 255, 255, 0.2), radius 2px
Fill: #00B4A6
Thumb: 20px circle, #FFFFFF, shadow 0 2px 8px rgba(0,0,0,0.3)
Active: thumb glow 0 0 12px rgba(0, 180, 166, 0.5)
Value label: 12px mono, appears on drag
```

### Cards & Panels

**Tool Panel**
```
Background: rgba(28, 28, 30, 0.9)
Backdrop-filter: blur(20px)
Radius: 16px
Padding: 16px
Shadow: 0 4px 24px rgba(0, 0, 0, 0.4)
```

**LUT Preview Card**
```
Background: #141414
Radius: 12px
Padding: 8px
Thumbnail: aspect-ratio 1:1, radius 8px
Label: 12px, centered below
Selected: 2px solid #00B4A6
```

### Navigation & Toolbars

**Bottom Toolbar (Edit Screen)**
```
Background: rgba(0, 0, 0, 0.9)
Backdrop-filter: blur(20px)
Height: 80px + safe-area
Border-top: 1px solid rgba(255, 255, 255, 0.1)
Icons: 28px, spaced evenly
Active icon: #00B4A6
```

**Top Bar**
```
Background: transparent or rgba(0, 0, 0, 0.5)
Height: 56px + safe-area
Back button: left, icon only
Actions: right, icon buttons
Title: center, 16px weight 600
```

### Modals & Sheets

**Bottom Sheet**
```
Background: #1C1C1E
Radius: 24px 24px 0 0
Handle: 36px x 4px, rgba(255, 255, 255, 0.3), radius 2px
Backdrop: rgba(0, 0, 0, 0.6)
Animation: spring, 300ms
```

**Alert Modal**
```
Background: #1C1C1E
Radius: 16px
Width: 280px
Padding: 24px
Title: 17px weight 600, centered
Body: 14px, rgba(255, 255, 255, 0.7), centered
Buttons: stacked or side-by-side, full width
```

## 5. Layout Principles

### Spacing Scale
```
4px   - Micro gaps, icon padding
8px   - Tight element spacing
12px  - Default internal padding
16px  - Card padding, section gaps
24px  - Major section spacing
32px  - Screen padding horizontal
48px  - Large vertical spacing
```

### Photo Canvas
- Photo always centered in available space
- Maintain aspect ratio, never crop in preview
- Dark letterboxing for non-fitting photos
- Pinch-to-zoom with momentum

### Safe Areas
- Respect iOS/Android safe areas
- Bottom toolbar above home indicator
- Top bar below notch/dynamic island
- Minimum 44px touch targets

### Grid
- Tool panels: 4-column grid for icons
- LUT browser: 3-column grid, 8px gap
- Settings: single column, full width rows

## 6. Depth & Elevation

| Level | Treatment | Usage |
|-------|-----------|-------|
| 0 (Canvas) | Pure black, no effects | Photo editing background |
| 1 (Surface) | `#0A0A0A`, no shadow | Panels resting on canvas |
| 2 (Elevated) | `#141414`, subtle shadow | Cards, tool panels |
| 3 (Floating) | Glass bg + blur + shadow | Toolbars, floating controls |
| 4 (Modal) | `#1C1C1E` + heavy shadow + scrim | Modals, bottom sheets |

### Glass Effect (Signature)
```css
background: rgba(28, 28, 30, 0.8);
backdrop-filter: saturate(180%) blur(20px);
-webkit-backdrop-filter: saturate(180%) blur(20px);
```

## 7. Motion & Animation

### Timing
| Type | Duration | Easing |
|------|----------|--------|
| Micro (button press) | 100ms | ease-out |
| Standard (panel slide) | 200ms | ease-out |
| Emphasis (modal) | 300ms | spring(1, 80, 10) |
| Photo transition | 250ms | ease-in-out |

### Principles
- Photo transitions: crossfade, never slide
- Tool panels: slide from edge
- Modals: scale up from 0.95 + fade
- Sliders: immediate response, no delay
- LUT preview: instant, no animation

## 8. Do's and Don'ts

### Do
- Keep photo as the largest element on screen
- Use Teal (`#00B4A6`) only for interactive elements
- Apply glass effect to floating toolbars
- Use pill shapes (980px radius) for primary CTAs
- Maintain 44px minimum touch targets
- Show slider values during drag
- Use subtle haptic feedback on iOS

### Don't
- Don't introduce additional accent colors
- Don't use borders on dark surfaces (use elevation instead)
- Don't animate photo previews when applying LUTs
- Don't use pure white backgrounds in edit mode
- Don't obscure the photo with UI (use transparency)
- Don't use shadows on the photo canvas
- Don't auto-hide controls during editing

## 9. Platform Considerations

### iOS Specific
- SF Symbols for icons where available
- Native blur via `UIVisualEffectView`
- Haptic feedback on slider endpoints
- Respect Dynamic Type (limited range)

### Android Specific
- Material Icons as fallback
- `RenderEffect.blur()` for glass (API 31+)
- Fallback to solid dark for older devices
- Edge-to-edge with system bar handling

### React Native / Expo
```javascript
// Glass effect with Skia
import { BlurView } from 'expo-blur';
// or
import { Blur } from '@shopify/react-native-skia';

// Haptics
import * as Haptics from 'expo-haptics';
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

## 10. Quick Reference

### Colors (Copy-paste)
```javascript
const colors = {
  // Surfaces
  black: '#000000',
  dark1: '#0A0A0A',
  dark2: '#141414',
  dark3: '#1C1C1E',
  light: '#F5F5F7',
  
  // Accent
  accent: '#00B4A6',
  accentHover: '#00D4C4',
  accentMuted: 'rgba(0, 180, 166, 0.2)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',
  
  // Semantic
  success: '#34C759',
  warning: '#FF9F0A',
  error: '#FF453A',
};
```

### Border Radius Scale
```javascript
const radius = {
  xs: 4,    // Tags, badges
  sm: 8,    // Small buttons, thumbnails
  md: 12,   // Cards, icon buttons
  lg: 16,   // Panels, large cards
  xl: 24,   // Bottom sheets
  pill: 980, // CTAs, toggles
};
```

### Component Prompt Examples

- "Create an edit screen toolbar: glass background with 20px blur, 80px height, 5 evenly spaced icon buttons (28px icons), active state uses Teal #00B4A6, inactive uses rgba(255,255,255,0.6)."

- "Design a LUT browser grid: 3 columns, 8px gap, each card is #141414 with 12px radius, square thumbnail with 8px radius, 12px label below, selected state has 2px Teal border."

- "Build an intensity slider: white thumb 20px circle, Teal fill on track, 4px track height, show value label (mono font) above thumb while dragging."
