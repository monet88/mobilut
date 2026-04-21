import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BannerAdView } from '@adapters/ads';
import { getHomeBannerUnitId, initializeAds, shouldRenderHomeBanner } from '@services/ads';
import { Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

export function HomeAdBanner(): React.JSX.Element | null {
  const [adsReady, setAdsReady] = React.useState(false);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const unitId = React.useMemo(() => getHomeBannerUnitId(), []);

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

  if (unitId === null || !shouldRenderHomeBanner({ adsReady, loadFailed }, unitId)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sponsored</Text>
      <BannerAdView unitId={unitId} onLoadFailed={() => setLoadFailed(true)} />
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
