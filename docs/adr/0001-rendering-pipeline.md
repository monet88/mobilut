# ADR 0001: Rendering Pipeline

Status: Proposed
Date: 2026-04-15

## Context

The app needs a fast LUT preview/export pipeline on mobile, while handling shader failures, large images, and correctness verification against a CPU reference path.

## Decision

Use a GPU-first rendering pipeline with Skia on the app runtime, backed by a CPU fallback path for correctness checking and failure recovery.

## Drivers

- Real-time preview performance
- Need for runtime proof on Android
- Need for fallback when shader compile fails
- Need for deterministic parity testing

## Chosen Approach

- Use Expo bare + Skia for the runtime harness and production path
- Keep parsing/encoding/interpolation logic in a reusable TS core
- Compare GPU output against CPU reference on approved fixtures
- Trigger rescue behavior when shader compile fails

## Alternatives Considered

### Alternative 1: CPU-only rendering

- Pros:
- Cons:

### Alternative 2: GPU-only without fallback

- Pros:
- Cons:

### Alternative 3: Native platform-specific rendering path

- Pros:
- Cons:

## Consequences

### Positive

- 
- 

### Negative

- 
- 

## Follow-ups

- Define parity tolerance
- Define export path requirements
- Validate runtime on target Android device

