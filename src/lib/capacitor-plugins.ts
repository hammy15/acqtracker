/**
 * Initialize Capacitor native plugins.
 * Call once at app startup. All operations are no-ops on the web platform.
 */

import { Capacitor } from "@capacitor/core";

export async function initCapacitorPlugins() {
  if (!Capacitor.isNativePlatform()) return;

  // Status Bar
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#fafafa" });
  } catch (e) {
    console.warn("[Capacitor] StatusBar init failed:", e);
  }

  // Splash Screen — hide after app is ready
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch (e) {
    console.warn("[Capacitor] SplashScreen init failed:", e);
  }

  // Push Notifications — request permission
  try {
    const { PushNotifications } = await import(
      "@capacitor/push-notifications"
    );
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive === "granted") {
      await PushNotifications.register();
    }

    PushNotifications.addListener("registration", (token) => {
      console.log("[Capacitor] Push registration token:", token.value);
    });

    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("[Capacitor] Push received:", notification);
      },
    );

    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        console.log("[Capacitor] Push action:", notification);
      },
    );
  } catch (e) {
    console.warn("[Capacitor] PushNotifications init failed:", e);
  }
}
