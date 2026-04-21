export interface ProClarityParams {
  readonly clarity: number; // -1 to 1 (mid-tone local contrast)
  readonly sharpness: number; // -1 to 1 (edge sharpening)
  readonly structure: number; // -1 to 1 (texture definition)
  readonly microContrast: number; // -1 to 1 (fine detail enhancement)
}

export const DEFAULT_PRO_CLARITY: ProClarityParams = Object.freeze({
  clarity: 0,
  sharpness: 0,
  structure: 0,
  microContrast: 0,
});

export function hasProClarityApplied(params: ProClarityParams): boolean {
  return (
    params.clarity !== 0 ||
    params.sharpness !== 0 ||
    params.structure !== 0 ||
    params.microContrast !== 0
  );
}

export function clampProClarityParams(params: Partial<ProClarityParams>): ProClarityParams {
  const clamp = (v: number | undefined) => Math.max(-1, Math.min(1, v ?? 0));
  return {
    clarity: clamp(params.clarity),
    sharpness: clamp(params.sharpness),
    structure: clamp(params.structure),
    microContrast: clamp(params.microContrast),
  };
}
