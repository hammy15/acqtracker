import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.CAPACITOR_ENV === "development";

const config: CapacitorConfig = {
  appId: "com.acquisitionchecklist.app",
  appName: "Acquisition Checklist",
  webDir: "cap-www",

  server: {
    url: isDev ? undefined : "https://acqtracker.vercel.app",
    cleartext: isDev,
    androidScheme: "https",
    allowNavigation: ["acqtracker.vercel.app", "*.vercel.app"],
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#fafafa",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#fafafa",
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
