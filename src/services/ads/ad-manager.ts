import { getBannerTestAdUnitId, initializeMobileAdsSdk } from '@adapters/ads';

let initialization: Promise<void> | null = null;

export interface HomeBannerPolicy {
  readonly adsReady: boolean;
  readonly loadFailed: boolean;
}

export function getHomeBannerUnitId(): string | null {
  if (__DEV__) {
    return getBannerTestAdUnitId();
  }

  const configuredUnitId = process.env['EXPO_PUBLIC_HOME_BANNER_AD_UNIT_ID']?.trim();
  return configuredUnitId && configuredUnitId.length > 0 ? configuredUnitId : null;
}

export function initializeAds(): Promise<void> {
  if (!initialization) {
    initialization = initializeMobileAdsSdk().catch(() => undefined);
  }
  return initialization;
}

export function shouldRenderHomeBanner(
  policy: HomeBannerPolicy,
  unitId: string | null,
): boolean {
  return policy.adsReady && !policy.loadFailed && unitId !== null;
}
