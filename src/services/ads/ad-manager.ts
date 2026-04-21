import mobileAds, { TestIds } from 'react-native-google-mobile-ads';

let initialization: Promise<void> | null = null;

export interface HomeBannerPolicy {
  readonly adsReady: boolean;
  readonly loadFailed: boolean;
}

export function getHomeBannerUnitId(): string {
  return __DEV__
    ? TestIds.BANNER
    : (process.env['EXPO_PUBLIC_HOME_BANNER_AD_UNIT_ID'] ?? TestIds.BANNER);
}

export function initializeAds(): Promise<void> {
  if (!initialization) {
    initialization = mobileAds()
      .initialize()
      .then(() => undefined)
      .catch(() => undefined);
  }
  return initialization;
}

export function shouldRenderHomeBanner(policy: HomeBannerPolicy): boolean {
  return policy.adsReady && !policy.loadFailed;
}
