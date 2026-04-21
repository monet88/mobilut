import React from 'react';
import mobileAds, { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export interface BannerAdViewProps {
  readonly unitId: string;
  readonly onLoadFailed: () => void;
}

export function initializeMobileAdsSdk(): Promise<void> {
  return mobileAds()
    .initialize()
    .then(() => undefined);
}

export function getBannerTestAdUnitId(): string {
  return TestIds.BANNER;
}

export function BannerAdView({
  unitId,
  onLoadFailed,
}: BannerAdViewProps): React.JSX.Element {
  return (
    <BannerAd
      unitId={unitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      onAdFailedToLoad={onLoadFailed}
    />
  );
}
