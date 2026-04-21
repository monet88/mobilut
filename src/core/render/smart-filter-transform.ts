import type { SmartFilterParams } from '@core/stylistic/smart-filter-model';

export function isSmartFilterActive(params: SmartFilterParams | null): boolean {
  return params !== null && params.enabled && params.strength > 0;
}
