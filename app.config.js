module.exports = {
  "name": "LUT App",
  "slug": "lut-app",
  "scheme": "lutapp",
  "platforms": [
    "ios",
    "android"
  ],
  "plugins": [
    "expo-router",
    "expo-dev-client",
    [
      "react-native-google-mobile-ads",
      {
        "androidAppId": "ca-app-pub-3940256099942544~3347511713",
        "iosAppId": "ca-app-pub-3940256099942544~1458002511"
      }
    ]
  ],
  "experiments": {
    "typedRoutes": true
  },
  "android": {
    "package": "com.anonymous.lutapp",
    "newArchEnabled": false
  },
  "ios": {
    "bundleIdentifier": "com.anonymous.lut-app",
    "newArchEnabled": false
  }
};
