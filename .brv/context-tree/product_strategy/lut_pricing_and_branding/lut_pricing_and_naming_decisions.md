---
title: LUT Pricing and Naming Decisions
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-04-14T10:17:01.120Z'
updatedAt: '2026-04-14T10:17:01.120Z'
---
## Raw Concept
**Task:**
Document pricing, licensing, and naming conventions for the LUT catalog.

**Changes:**
- Defined a 200-preset catalog with 30 complimentary LUTs and 170 unlocked for a one-time $2.99 fee.
- Clarified that there is no ongoing subscription; access is granted via a single purchase unlock.
- Documented the licensed LUT sources that will feed the collection.
- Mandated that LUT names use mood/style descriptors and explicitly avoid trademarked brand names.

**Files:**
- tools/identity_test.cube

**Flow:**
Curate LUT assets -> assign source licenses -> price unlock bundle -> rename assets to mood/style descriptors -> publish without subscription

**Timestamp:** 2026-04-14

**Author:** Product Team

## Narrative
### Structure
The LUT catalog will ship with 200 presets refreshed from curated sources; 30 presets stay free to sample while a single $2.99 unlock grants the remaining 170 presets.

### Dependencies
Reuses G'MIC Film-Luts (MIT license), Pat David HaldCLUTs (RawTherapee film simulation), and Popul-AR/gmic-luts assets to build the catalog.

### Highlights
The product avoids subscription fatigue by relying on a one-time unlock, supports MIT and open-source LUT collections, and enforces mood/style naming to sidestep trademark risks.

### Rules
Rule: All LUT names must be descriptive of mood or style and never refer to brand names such as Kodak or Fuji.

### Examples
Example naming: Sunset Warmth, Urban Clay, Noir Contrast (instead of using Fujifilm or Kodak references).

## Facts
- **lut_count**: 200 LUT presets total are planned for the product. [project]
- **lut_pricing**: 30 LUT presets are free and 170 unlock via a one-time $2.99 purchase. [project]
- **subscription_model**: The LUT catalog offers no subscription option. [project]
- **gmic_source**: LUT sources include G'MIC Film-Luts under the MIT license. [project]
- **haldclut_source**: LUT sources include the Pat David HaldCLUT collection based on RawTherapee film simulations. [project]
- **popular_source**: LUT sources include the Popul-AR/gmic-luts repository. [project]
- **lut_naming**: LUT names must be renamed to mood/style names and avoid brand names such as Kodak or Fuji. [convention]
