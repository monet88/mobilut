# Phase 1C: Home Screen

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Create new Home screen with draft-first layout and action-oriented information architecture.

**Architecture:** HomeScreen → useDrafts hook → DraftGrid component. Stack navigation to Editor and Settings.

**Tech Stack:** React Native, Expo Router, TypeScript

**Estimated context:** ~30K tokens

**Prerequisites:** Phase 1B (Draft Persistence) complete

**Repo alignment notes:**
- Implement Home as the root `app/index.tsx` screen; do not add a separate `app/home.tsx` route.
- Keep any new Home tests under `__tests__/features/` to match the repo's current Jest structure.
- Prefer current UI barrels (`@ui/primitives`, `@ui/layout`) and `colors`/`spacing` from `@theme/tokens` when translating the example snippets into real code.

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `src/features/home/use-drafts.ts` | Hook for draft list management |
| `src/features/home/draft-grid.tsx` | Draft thumbnails grid |
| `src/features/home/home.screen.tsx` | Home screen component |
| `src/features/home/index.ts` | Barrel export |
| `app/index.tsx` | Root Home route |

### Modified Files
| Path | Changes |
|------|---------|
| `app/index.tsx` | Replace the import-first landing screen with HomeScreen |

---

## Task 1: useDrafts Hook

**Files:**
- Create: `src/features/home/use-drafts.ts`

### Step 1.1: Implement hook

- [ ] **Step 1.1.1: Create useDrafts**

```typescript
// src/features/home/use-drafts.ts
import { useCallback, useEffect, useState } from 'react';
import { listDrafts, deleteDraft } from '@services/draft';
import type { DraftMetadata } from '@core/draft';

export interface UseDraftsResult {
  readonly drafts: readonly DraftMetadata[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly refresh: () => Promise<void>;
  readonly remove: (draftId: string) => Promise<void>;
}

export function useDrafts(): UseDraftsResult {
  const [drafts, setDrafts] = useState<readonly DraftMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listDrafts();
      setDrafts(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load drafts'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (draftId: string) => {
    await deleteDraft(draftId);
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { drafts, isLoading, error, refresh, remove };
}
```

- [ ] **Step 1.1.2: Commit**

```bash
git add src/features/home/use-drafts.ts
git commit -m "feat(home): add useDrafts hook"
```

---

## Task 2: DraftGrid Component

**Files:**
- Create: `src/features/home/draft-grid.tsx`

### Step 2.1: Implement DraftGrid

- [ ] **Step 2.1.1: Create component**

```typescript
// src/features/home/draft-grid.tsx
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui/primitives/text';
import type { DraftMetadata } from '@core/draft';
import { tokens } from '@theme/tokens';

interface DraftGridProps {
  readonly drafts: readonly DraftMetadata[];
  readonly onDraftPress: (draftId: string) => void;
  readonly onDraftLongPress?: (draftId: string) => void;
}

export function DraftGrid({ 
  drafts, 
  onDraftPress, 
  onDraftLongPress,
}: DraftGridProps): React.JSX.Element | null {
  if (drafts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>CONTINUE EDITING</Text>
      <FlatList
        data={drafts}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.draftCard} 
            onPress={() => onDraftPress(item.id)}
            onLongPress={() => onDraftLongPress?.(item.id)}
          >
            {item.previewUri ? (
              <Image source={{ uri: item.previewUri }} style={styles.preview} />
            ) : (
              <View style={[styles.preview, styles.placeholder]}>
                <Text style={styles.placeholderText}>Draft</Text>
              </View>
            )}
            <Text style={styles.timestamp} numberOfLines={1}>
              {formatTimestamp(item.updatedAt)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { 
    marginTop: 24,
  },
  sectionTitle: {
    color: tokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: { 
    paddingHorizontal: 12,
  },
  draftCard: {
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: tokens.colors.surfaceDark2,
  },
  preview: { 
    width: 80, 
    height: 80,
  },
  placeholder: { 
    backgroundColor: tokens.colors.surfaceDark2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: tokens.colors.textSecondary,
    fontSize: 10,
  },
  timestamp: {
    color: tokens.colors.textSecondary,
    fontSize: 10,
    padding: 4,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2.1.2: Commit**

```bash
git add src/features/home/draft-grid.tsx
git commit -m "feat(home): add DraftGrid component"
```

---

## Task 3: HomeScreen Component

**Files:**
- Create: `src/features/home/home.screen.tsx`

### Step 3.1: Implement HomeScreen

- [ ] **Step 3.1.1: Create component**

```typescript
// src/features/home/home.screen.tsx
import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@ui/layout/safe-area-view';
import { Text } from '@ui/primitives/text';
import { IconButton } from '@ui/primitives/icon-button';
import { LoadingOverlay } from '@ui/feedback/loading-overlay';
import { DraftGrid } from './draft-grid';
import { useDrafts } from './use-drafts';
import { useImportImage } from '@features/import-image';
import { tokens } from '@theme/tokens';

export function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { drafts, isLoading, refresh, remove } = useDrafts();
  const { pickImage } = useImportImage();

  const handleAddPhoto = useCallback(async () => {
    const result = await pickImage();
    if (result) {
      router.push(`/editor/${encodeURIComponent(result.assetId)}`);
    }
  }, [pickImage, router]);

  const handleDraftPress = useCallback(
    (draftId: string) => {
      router.push(`/editor/${encodeURIComponent(draftId)}?draft=true`);
    },
    [router],
  );

  const handleDraftLongPress = useCallback(
    (draftId: string) => {
      Alert.alert(
        'Delete Draft',
        'Are you sure you want to delete this draft?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => remove(draftId),
          },
        ],
      );
    },
    [remove],
  );

  const handleSettingsPress = useCallback(() => {
    router.push('/settings');
  }, [router]);

  if (isLoading) {
    return <LoadingOverlay visible message="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>MOBILUT</Text>
        <IconButton icon="settings" onPress={handleSettingsPress} />
      </View>

      <View style={styles.content}>
        {/* Primary CTA */}
        <Pressable style={styles.addButton} onPress={handleAddPhoto}>
          <Text style={styles.addButtonText}>+ ADD NEW PHOTO</Text>
        </Pressable>

        {/* Draft Grid */}
        <DraftGrid 
          drafts={drafts} 
          onDraftPress={handleDraftPress}
          onDraftLongPress={handleDraftLongPress}
        />

        {/* Empty State */}
        {drafts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>NO DRAFTS YET</Text>
            <Text style={styles.emptySubtext}>
              Import a photo to start editing
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            Drafts: {drafts.length}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: tokens.colors.surfaceBlack,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logo: {
    color: tokens.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  content: { 
    flex: 1, 
    paddingTop: 16,
  },
  addButton: {
    backgroundColor: tokens.colors.accent,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 980,
    alignItems: 'center',
  },
  addButtonText: {
    color: tokens.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: tokens.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: tokens.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  stats: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  statsText: {
    color: tokens.colors.textSecondary,
    fontSize: 12,
  },
});
```

- [ ] **Step 3.1.2: Commit**

```bash
git add src/features/home/home.screen.tsx
git commit -m "feat(home): add HomeScreen with draft-first layout"
```

---

## Task 4: Barrel Export

**Files:**
- Create: `src/features/home/index.ts`

### Step 4.1: Create barrel

- [ ] **Step 4.1.1: Create index**

```typescript
// src/features/home/index.ts
export { HomeScreen } from './home.screen';
export { DraftGrid } from './draft-grid';
export { useDrafts } from './use-drafts';
```

- [ ] **Step 4.1.2: Commit**

```bash
git add src/features/home/index.ts
git commit -m "feat(home): add barrel exports"
```

---

## Task 5: Route Wiring

**Files:**
- Modify: `app/index.tsx`

### Step 5.1: Mount HomeScreen at the root route

- [ ] **Step 5.1.1: Replace the import-first index route**

```typescript
// app/index.tsx
import React from 'react';

import { HomeScreen } from '@features/home';

export default function IndexRoute(): React.JSX.Element {
  return <HomeScreen />;
}
```

- [ ] **Step 5.1.2: Commit**

```bash
git add app/index.tsx
git commit -m "feat(routes): make index the Home entry route"
```

---

## Completion Checklist

- [ ] useDrafts hook fetches and manages draft list
- [ ] DraftGrid displays drafts with thumbnails
- [ ] HomeScreen has ADD NEW PHOTO as primary CTA
- [ ] Long press on draft shows delete confirmation
- [ ] Navigation to Editor works for both new photo and draft resume
- [ ] Empty state displayed when no drafts

**Next:** Phase 1D - Editor Shell
