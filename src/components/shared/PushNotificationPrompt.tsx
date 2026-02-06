"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestPushPermission } from "@/lib/push-notifications";

const STORAGE_KEY = "acqtracker_push_prompt_dismissed";

/**
 * A small banner that appears once on native apps prompting the user to enable
 * push notifications. Tracks dismissal in localStorage so it only shows once.
 *
 * Renders nothing on web or if the user has already accepted/dismissed.
 */
export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on native platforms
    let isNative = false;
    try {
      // Dynamic import would be overkill here — just check Capacitor global
      const { Capacitor } = require("@capacitor/core");
      isNative = Capacitor.isNativePlatform();
    } catch {
      isNative = false;
    }

    if (!isNative) return;

    // Check if previously dismissed
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed === "true") return;
    } catch {
      // localStorage unavailable — show the prompt anyway
    }

    // Check if permission already granted
    (async () => {
      try {
        const { PushNotifications } = await import(
          "@capacitor/push-notifications"
        );
        const status = await PushNotifications.checkPermissions();
        if (status.receive === "granted") {
          // Already have permission — no need to prompt
          return;
        }
      } catch {
        // If we can't check, show the prompt as a safe default
      }

      setVisible(true);
    })();
  }, []);

  const handleAccept = async () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }

    await requestPushPermission();
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-800 dark:text-surface-100">
            Stay updated on your deals
          </p>
          <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
            Enable push notifications to get real-time updates on task changes,
            messages, and transition day events.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={handleAccept}>
              Enable Notifications
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not Now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
