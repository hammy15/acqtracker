"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "acqtracker_welcomed";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage — if already welcomed, never show
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") {
        return;
      }
    } catch {
      // SSR or localStorage unavailable — don't show
      return;
    }

    setVisible(true);
    // Small delay so the entrance animations trigger after mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = useCallback(() => {
    setExiting(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Silently fail if storage is unavailable
    }
    // Wait for the fade-out transition to complete before unmounting
    setTimeout(() => setVisible(false), 500);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "#fafafa" }}
    >
      {/* Subtle decorative gradient orb behind content */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(20,184,166,0.08) 0%, rgba(20,184,166,0) 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -55%)",
        }}
      />

      <div className="relative flex flex-col items-center px-6 text-center">
        {/* Logo badge */}
        <div
          className={`flex items-center justify-center rounded-2xl transition-all duration-700 ease-out ${
            mounted
              ? "opacity-100 scale-100"
              : "opacity-0 scale-50"
          }`}
          style={{
            width: 80,
            height: 80,
            background: "linear-gradient(135deg, #14b8a6, #0d9488)",
            boxShadow:
              "6px 6px 16px rgba(20, 184, 166, 0.25), -4px -4px 12px rgba(255, 255, 255, 0.7)",
          }}
        >
          <span
            className="text-white font-bold select-none"
            style={{ fontSize: 32, letterSpacing: "-0.02em" }}
          >
            AT
          </span>
        </div>

        {/* Title */}
        <h1
          className={`mt-6 text-4xl sm:text-5xl font-bold tracking-tight transition-all duration-700 ease-out ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          style={{
            color: "#18181b",
            transitionDelay: "150ms",
          }}
        >
          AcqTracker
        </h1>

        {/* Subtitle */}
        <p
          className={`mt-3 text-lg sm:text-xl font-medium transition-all duration-700 ease-out ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          style={{
            color: "#0d9488",
            transitionDelay: "300ms",
          }}
        >
          Healthcare Acquisition Management
        </p>

        {/* Tagline */}
        <p
          className={`mt-2 text-sm sm:text-base transition-all duration-700 ease-out ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          style={{
            color: "#71717a",
            transitionDelay: "450ms",
          }}
        >
          Track every deal from pipeline to post-close.
        </p>

        {/* Get Started button */}
        <button
          onClick={handleGetStarted}
          className={`neu-button-primary mt-10 px-8 py-3 text-base rounded-xl transition-all duration-700 ease-out ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
          style={{
            transitionDelay: "600ms",
            fontSize: "1rem",
            letterSpacing: "0.01em",
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
