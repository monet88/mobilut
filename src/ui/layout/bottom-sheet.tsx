import React from 'react';
import { Animated, Modal, Pressable, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@theme/use-theme';

export interface BottomSheetProps {
  readonly visible: boolean;
  readonly title?: string;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
}

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: BottomSheetProps): React.JSX.Element {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const translateY = React.useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : height,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [height, translateY, visible]);

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          style={{
            transform: [{ translateY }],
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            borderCurve: 'continuous',
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.xl,
            gap: theme.spacing.md,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.border,
            }}
          />
          {title ? (
            <View>
              <Animated.Text
                style={{
                  color: theme.colors.primary,
                  fontSize: theme.typography.sizes.lg,
                  fontWeight: theme.typography.weights.semibold,
                }}
              >
                {title}
              </Animated.Text>
            </View>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
