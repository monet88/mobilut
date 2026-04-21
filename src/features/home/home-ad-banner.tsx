import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getHomeBannerUnitId, initializeAds, shouldRenderHomeBanner } from '@services/ads';
import { Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

export function HomeAdBanner(): React.JSX.Element | null {
  const [adsReady, setAdsReady] = React.useState(false);
  const [loadFailed, setLoadFailed] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    void initializeAds().then(() => {
      if (mounted) {
        setAdsReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!shouldRenderHomeBanner({ adsReady, loadFailed })) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sponsored</Text>
      <BannerAd
        unitId={getHomeBannerUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setLoadFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  label: {
    color: colors.secondary,
    fontSize: 11,
  },
});
