# LUT Encoding Spec

Status: Draft
Owner:
Last updated:

## Scope

This document defines the source-of-truth encoding and lookup rules for LUT parsing, conversion, texture layout, and round-trip verification.

## References

- `tools/cube_to_hald.py`
- `tools/identity_test.cube`
- `tools/identity_hald_test.png`

## Supported Inputs

- `.cube`:
- HaldCLUT PNG:
- Supported LUT sizes:
- Rejected LUT sizes:

## Coordinate / Index Convention

- Channel order:
- Outer axis:
- Inner axis:
- Flattening rule:
- Expected parser layout in memory:

## Texture / Strip Layout

- Texture dimensions:
- Packing strategy:
- Texel ordering:
- Edge handling:

## Texel Centering

- Sampling rule:
- Coordinate formula:
- Boundary behavior:

## Interpolation

- Interpolation type:
- Precision requirements:
- CPU reference behavior:
- GPU expected behavior:

## Color Handling

- Assumed color space:
- Input normalization:
- Output normalization:
- Known caveats:

## Round-Trip Verification

- Identity LUT expectation:
- GPU-to-CPU parity tolerance:
- Required fixtures:
- Pass criteria:

## Error Handling Rules

- Unsupported LUT size:
- Malformed `.cube`:
- Invalid HaldCLUT dimensions:
- Oversized PNG:

## Open Questions

- 
- 

