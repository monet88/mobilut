module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@core": "./src/core",
            "@features": "./src/features",
            "@services": "./src/services",
            "@adapters": "./src/adapters",
            "@ui": "./src/ui",
            "@theme": "./src/theme",
            "@hooks": "./src/hooks",
            "@lib": "./src/lib",
            "@i18n": "./src/i18n",
            "@lut-core": "./packages/lut-core/src",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
