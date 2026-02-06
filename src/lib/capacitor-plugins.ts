/**
 * Initialize Capacitor native plugins.
 * Call once at app startup. All operations are no-ops on the web platform.
 */

import { Capacitor } from "@capacitor/core";
import { initPushNotifications } from "@/lib/push-notifications";

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

  // Push Notifications — set up listeners and register if already permitted
  await initPushNotifications();
}
