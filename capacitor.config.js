/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: "com.acquisitionchecklist.app",
  appName: "Acquisition Checklist",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

module.exports = config;
