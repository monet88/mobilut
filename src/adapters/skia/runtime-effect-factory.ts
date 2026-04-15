import { Skia } from '@shopify/react-native-skia';

export interface RuntimeEffectHandle {
  readonly effect: NonNullable<ReturnType<typeof Skia.RuntimeEffect.Make>>;
  readonly source: string;
}

export function createRuntimeEffect(shaderSource: string): RuntimeEffectHandle | null {
  try {
    const effect = Skia.RuntimeEffect.Make(shaderSource);

    if (!effect) {
      return null;
    }

    return {
      effect,
      source: shaderSource,
    };
  } catch {
    return null;
  }
}
