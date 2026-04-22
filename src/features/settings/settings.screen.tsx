import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { getPreferences, setPreference, type AppPreferences } from '@services/storage';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

const EXPORT_QUALITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;

export function SettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const [preferences, setPreferences] = React.useState<AppPreferences | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    void getPreferences()
      .then((storedPreferences) => {
        if (isMounted) {
          setPreferences(storedPreferences);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const { t } = useTranslation();

  const updatePreference = React.useCallback(
    async <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
      setIsSaving(true);
      setError(null);
      try {
        await setPreference(key, value);
        setPreferences((current) =>
          current
            ? {
                ...current,
                [key]: value,
              }
            : current,
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const currentPreferences =
    preferences ??
    ({
      language: 'en',
      theme: 'system',
      exportQuality: 'high',
      showWatermark: false,
    } satisfies AppPreferences);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      <View style={styles.section}>
        <Text variant="heading">{t('settings.title')}</Text>
        <Text variant="body" style={styles.subtitle}>
          Local app preferences for export defaults and watermark behavior.
        </Text>
      </View>

      {error ? (
        <View style={styles.messageCard}>
          <Text variant="label" color={colors.error}>
            Error
          </Text>
          <Text variant="body">{error.message}</Text>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text variant="label">{t('settings.exportQuality')}</Text>
        <View style={styles.optionRow}>
          {EXPORT_QUALITY_OPTIONS.map((option) => {
            const isSelected = currentPreferences.exportQuality === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => updatePreference('exportQuality', option.value)}
                style={[styles.optionChip, isSelected ? styles.optionChipSelected : null]}
              >
                <Text
                  selectable={false}
                  variant="label"
                  color={isSelected ? colors.background : colors.primary}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text variant="label">{t('settings.watermark')}</Text>
            <Text variant="caption">
              Use the saved watermark preference as the default for new exports.
            </Text>
          </View>
          <Switch
            disabled={isSaving}
            value={currentPreferences.showWatermark}
            onValueChange={(value) => updatePreference('showWatermark', value)}
          />
        </View>
      </View>

      <Button
        label={isSaving ? t('common.loading') : t('common.done')}
        disabled={isSaving}
        onPress={() => router.back()}
        variant="secondary"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  subtitle: {
    color: colors.secondary,
  },
  sectionCard: {
    gap: spacing.md,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  messageCard: {
    gap: spacing.xs,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    minHeight: 40,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  optionChipSelected: {
    backgroundColor: colors.accent,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchCopy: {
    flex: 1,
    gap: spacing.xs,
  },
});
