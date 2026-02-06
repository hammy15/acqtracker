/**
 * Push Notifications module for Capacitor native apps.
 *
 * All functions gracefully no-op on web / SSR. The @capacitor/push-notifications
 * package is dynamically imported so it never breaks web builds.
 */

import { Capacitor } from "@capacitor/core";

/** Cached device token so we only register once per session */
let _deviceToken: string | null = null;

/**
 * Check whether we are running inside a native Capacitor shell.
 * Returns false on web, SSR, or if Capacitor is not available.
 */
function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Detect the current native platform for the push token record.
 */
function getPlatform(): "ios" | "android" | "web" {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === "ios") return "ios";
    if (platform === "android") return "android";
    return "web";
  } catch {
    return "web";
  }
}

/**
 * Store the device push token on the server.
 *
 * Because we cannot call tRPC hooks outside of React components, we make a
 * plain fetch to a lightweight API endpoint. If you later add pushToken /
 * pushPlatform columns to the User model you can persist there; for now the
 * server-side mutation simply logs the token.
 */
async function storePushToken(token: string, platform: "ios" | "android" | "web"): Promise<void> {
  try {
    // Use a direct fetch to the tRPC endpoint for the mutation.
    // The tRPC httpBatchLink expects an array of operations.
    const baseUrl = typeof window !== "undefined" ? "" : "http://localhost:3000";
    const body = {
      "0": {
        json: { token, platform },
      },
    };

    const res = await fetch(
      `${baseUrl}/api/trpc/users.registerPushToken?batch=1`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      console.warn("[PushNotifications] Failed to store token on server:", res.status);
    } else {
      console.log("[PushNotifications] Token stored on server successfully");
    }
  } catch (e) {
    console.warn("[PushNotifications] Error storing push token:", e);
  }
}

/**
 * Initialise push notifications.
 *
 * Call once at app startup (e.g. from capacitor-plugins.ts).
 * - Requests permission for push notifications
 * - Registers with APNs (iOS) or FCM (Android)
 * - Listens for registration, foreground, and background tap events
 * - Sends the device token to the server
 */
export async function initPushNotifications(): Promise<void> {
  if (!isNative()) return;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Check existing permission status first
    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt" || permStatus.receive === "prompt-with-rationale") {
      // Don't auto-request on init — let the PushNotificationPrompt component handle it.
      // Just set up listeners so we're ready when permission is granted.
    } else if (permStatus.receive === "granted") {
      // Already granted — register immediately
      await PushNotifications.register();
    }

    // ── Registration: device token received ────────────────────────────
    PushNotifications.addListener("registration", (token) => {
      console.log("[PushNotifications] Device token:", token.value);
      _deviceToken = token.value;

      const platform = getPlatform();
      storePushToken(token.value, platform);
    });

    // ── Registration error ─────────────────────────────────────────────
    PushNotifications.addListener("registrationError", (error) => {
      console.error("[PushNotifications] Registration error:", error);
    });

    // ── Foreground push received ───────────────────────────────────────
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[PushNotifications] Foreground notification:", {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });

      // You can show an in-app toast/banner here if desired.
    });

    // ── User tapped a notification (from background / killed state) ───
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("[PushNotifications] Notification tapped:", {
        actionId: action.actionId,
        notification: action.notification,
      });

      // Handle deep-linking based on notification data
      const data = action.notification.data;
      if (data?.dealId && typeof window !== "undefined") {
        window.location.href = `/deals/${data.dealId}`;
      }
    });

    console.log("[PushNotifications] Listeners initialised");
  } catch (e) {
    console.warn("[PushNotifications] Init failed:", e);
  }
}

/**
 * Request push notification permission from the user and register if granted.
 *
 * Call this from UI (e.g. the PushNotificationPrompt component).
 * Returns true if permission was granted, false otherwise.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isNative()) return false;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    const permResult = await PushNotifications.requestPermissions();

    if (permResult.receive === "granted") {
      await PushNotifications.register();
      console.log("[PushNotifications] Permission granted, registered for push");
      return true;
    }

    console.log("[PushNotifications] Permission denied:", permResult.receive);
    return false;
  } catch (e) {
    console.warn("[PushNotifications] Permission request failed:", e);
    return false;
  }
}

/**
 * Get the current device token (if already registered).
 */
export function getDeviceToken(): string | null {
  return _deviceToken;
}
