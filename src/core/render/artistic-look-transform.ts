import type { ArtisticLookParams } from '@core/stylistic/artistic-look-model';
import { getArtisticLookById } from '@core/stylistic/artistic-look-model';

export function isArtisticLookActive(params: ArtisticLookParams | null): boolean {
  if (!params) return false;
  if (!getArtisticLookById(params.styleId)) return false;
  return params.intensity > 0;
}
