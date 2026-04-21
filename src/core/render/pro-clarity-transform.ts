import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';
import { hasProClarityApplied } from '@core/stylistic/pro-clarity-model';

export function isProClarityActive(params: ProClarityParams | null): boolean {
  return params !== null && hasProClarityApplied(params);
}
