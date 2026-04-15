# ADR 0002: LUT Asset Bundling Strategy

Status: Proposed
Date: 2026-04-15

## Context

The app wants built-in LUT presets and thumbnails, but APK size, licensing, and first-launch performance create real constraints.

## Decision

Decision pending. This ADR will record the chosen bundling format and thumbnail strategy after Phase 1a evaluation.

## Drivers

- Licensing constraints
- APK / asset size
- First-launch performance
- Thumbnail generation cost
- Import-first fallback path

## Options

### Option 1: Bundle full LUT catalog in-app

- Pros:
- Cons:

### Option 2: Ship minimal built-in set + import-first flow

- Pros:
- Cons:

### Option 3: Pre-encoded assets with pre-generated thumbnails

- Pros:
- Cons:

## Decision Criteria

- Legally safe to distribute
- Small enough for store delivery
- Does not freeze first launch
- Compatible with chosen rendering pipeline

## Thumbnail Strategy

- Build-time generation:
- Runtime generation:
- Cache strategy:

## Consequences

### Positive

- 

### Negative

- 

## Follow-ups

- Finalize built-in preset count
- Finalize thumbnail format
- Re-check APK size budget
