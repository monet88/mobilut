# Phase 3E: Home Ads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-blocking Home banner ad that initializes safely, hides itself on failure, and never interrupts the trusted editing loop.

**Architecture:** `src/services/ads/` owns SDK initialization and unit-ID selection. `HomeAdBanner` is a thin feature component that renders only when the service says ads are allowed. If initialization or ad loading fails, Home continues to work exactly as before.

**Tech Stack:** React Native, `react-native-google-mobile-ads`, existing Home screen + feedback primitives

**Prerequisites:** Phase 1C complete. `react-native-google-mobile-ads` plugin config remains present in `app.config.js`.

---

## File Structure

### New Files

| Path | Responsibility |
|------|----------------|
| `src/services/ads/ad-manager.ts` | SDK initialization, test-unit fallback, visibility policy |
| `src/services/ads/index.ts` | Ads barrel |
| `src/features/home/home-ad-banner.tsx` | Home banner wrapper with graceful failure handling |
| `__tests__/services/ad-manager.test.ts` | Ad manager unit tests |
| `__tests__/features/home-ad-banner.test.tsx` | Banner component tests |

### Modified Files

| Path | Changes |
|------|---------|
| `src/features/home/home.screen.tsx` | Render banner below primary actions/stats |

---

## Task 1: Ad Manager Service

**Files:**
- Create: `src/services/ads/ad-manager.ts`
- Create: `src/services/ads/index.ts`
- Test: `__tests__/services/ad-manager.test.ts`

- [ ] **Step 1: Write the failing ad-manager test**

```ts
// __tests__/services/ad-manager.test.ts
import mobileAds, { TestIds } from 'react-native-google-mobile-ads';

import {
  getHomeBannerUnitId,
  initializeAds,
  shouldRenderHomeBanner,
} from '@services/ads';

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
  })),
  TestIds: {
    BANNER: 'test-banner-id',
  },
}));

describe('ad-manager', () => {
  it('initializes the SDK once and falls back to the test banner id', async () => {
    await initializeAds();
    await initializeAds();

    expect(mobileAds).toHaveBeenCalledTimes(1);
    expect(getHomeBannerUnitId()).toBe(TestIds.BANNER);
    expect(shouldRenderHomeBanner({ adsReady: true, loadFailed: false })).toBe(true);
    expect(shouldRenderHomeBanner({ adsReady: false, loadFailed: true })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the service test to verify it fails**

Run: `npm test -- --runInBand ad-manager`
Expected: FAIL with `Cannot find module '@services/ads'`

- [ ] **Step 3: Implement the ad manager**

```ts
// src/services/ads/ad-manager.ts
import mobileAds, { TestIds } from 'react-native-google-mobile-ads';

let initialization: Promise<void> | null = null;

export interface HomeBannerPolicy {
  readonly adsReady: boolean;
  readonly loadFailed: boolean;
}

export function getHomeBannerUnitId(): string {
  return __DEV__
    ? TestIds.BANNER
    : process.env.EXPO_PUBLIC_HOME_BANNER_AD_UNIT_ID ?? TestIds.BANNER;
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
```

```ts
// src/services/ads/index.ts
export * from './ad-manager';
```

- [ ] **Step 4: Run the service test to verify it passes**

Run: `npm test -- --runInBand ad-manager`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/ads __tests__/services/ad-manager.test.ts

git commit -m "$(cat <<'EOF'
Hide ad-SDK complexity behind a tiny home-banner policy service

Home should not know how to initialize the mobile ads SDK, choose a unit ID, or
recover when ads are unavailable. A small service keeps that behavior explicit.

Constraint: Home ads must never block the trusted editing loop
Rejected: Initialize ads directly inside HomeScreen | mixes SDK behavior into feature layout logic
Confidence: high
Scope-risk: narrow
Reversibility: clean
Directive: Keep production unit IDs outside source control and default safely in dev/test
Tested: npm test -- --runInBand ad-manager
Not-tested: Production ad-unit configuration on device
EOF
)"
```

---

## Task 2: Home Banner Component

**Files:**
- Create: `src/features/home/home-ad-banner.tsx`
- Test: `__tests__/features/home-ad-banner.test.tsx`

- [ ] **Step 1: Write the failing banner-component test**

```tsx
// __tests__/features/home-ad-banner.test.tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';

import { HomeAdBanner } from '@features/home/home-ad-banner';

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: ({ onAdFailedToLoad }: { onAdFailedToLoad?: () => void }) => (
    <View testID="mock-banner" onTouchEnd={onAdFailedToLoad} />
  ),
  BannerAdSize: {
    ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  },
}));

jest.mock('@services/ads', () => ({
  getHomeBannerUnitId: jest.fn(() => 'test-banner-id'),
  initializeAds: jest.fn(() => Promise.resolve()),
  shouldRenderHomeBanner: jest.fn(({ adsReady, loadFailed }) => adsReady && !loadFailed),
}));

describe('HomeAdBanner', () => {
  it('renders after sdk init and hides itself after load failure', async () => {
    const screen = render(<HomeAdBanner />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-banner')).toBeTruthy();
    });

    fireEvent(screen.getByTestId('mock-banner'), 'onTouchEnd');

    await waitFor(() => {
      expect(screen.queryByText('Sponsored')).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run the banner-component test to verify it fails**

Run: `npm test -- --runInBand home-ad-banner`
Expected: FAIL with missing module error for `home-ad-banner`

- [ ] **Step 3: Implement the banner component**

```tsx
// src/features/home/home-ad-banner.tsx
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
      <Text variant="caption">Sponsored</Text>
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
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
});
```

- [ ] **Step 4: Run the banner-component test to verify it passes**

Run: `npm test -- --runInBand home-ad-banner`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/home/home-ad-banner.tsx __tests__/features/home-ad-banner.test.tsx

git commit -m "$(cat <<'EOF'
Render the home banner ad only when it is safe and non-blocking

The home surface can host a banner ad in Phase 3, but the component must vanish
cleanly when initialization or ad loading fails so the main actions stay usable.

Constraint: Offline or failed ads should degrade to no banner, not an error state
Rejected: Show a static placeholder when ads fail | adds noise without monetization value
Confidence: medium
Scope-risk: narrow
Reversibility: clean
Directive: Keep the banner below the primary create/resume actions
Tested: npm test -- --runInBand home-ad-banner
Not-tested: Real ad loading, consent, and refresh behavior on device
EOF
)"
```

---

## Task 3: Home Screen Integration

**Files:**
- Modify: `src/features/home/home.screen.tsx`

- [ ] **Step 1: Write a failing home-screen integration test**

```tsx
// add to __tests__/features/home.screen.phase3.test.tsx or similar
import React from 'react';
import { render } from '@testing-library/react-native';

import { HomeScreen } from '@features/home/home.screen';

jest.mock('@features/home/home-ad-banner', () => ({
  HomeAdBanner: () => 'Sponsored',
}));

describe('HomeScreen phase 3', () => {
  it('renders the batch entry and the banner below the primary actions', () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByText('Add New Photo')).toBeTruthy();
    expect(screen.getByText('Batch')).toBeTruthy();
    expect(screen.getByText('Sponsored')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the home-screen test to verify it fails**

Run: `npm test -- --runInBand home.screen.phase3`
Expected: FAIL because `HomeScreen` does not render the new banner/Batch entry yet

- [ ] **Step 3: Update the home screen**

```tsx
// src/features/home/home.screen.tsx (relevant additions only)
import { HomeAdBanner } from './home-ad-banner';

<View style={styles.secondaryActions}>
  <Button label="Batch" variant="secondary" onPress={() => router.push('/batch')} />
</View>

<HomeAdBanner />
```

```ts
// src/features/home/home.screen.tsx (style additions)
secondaryActions: {
  gap: spacing.sm,
},
```

- [ ] **Step 4: Run the home-screen test to verify it passes**

Run: `npm test -- --runInBand home.screen.phase3`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/home/home.screen.tsx

git commit -m "$(cat <<'EOF'
Integrate Phase 3 batch and banner affordances without demoting Home's primary action

Home still exists to start or resume editing. Batch and ads can appear in Phase 3,
but both must sit below the main creator action band so trust stays intact.

Constraint: The primary create/resume actions remain above the fold
Rejected: Put the banner at the top of Home | weakens the premium/trust posture
Confidence: medium
Scope-risk: narrow
Reversibility: clean
Directive: If Home gets denser later, move the banner lower before shrinking the main CTA
Tested: npm test -- --runInBand home.screen.phase3
Not-tested: Real-device spacing and banner height on small screens
EOF
)"
```

---

## Completion Checklist

- [ ] Ads initialize once through a dedicated service
- [ ] Home banner hides itself on SDK or load failure
- [ ] Home renders Batch + Sponsored sections without demoting the main CTA
- [ ] Focused service/component/home tests pass

**Next:** Phase 3F - Integration + Verification
