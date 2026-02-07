"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="neu-card text-center">
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4"
              style={{
                background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                boxShadow: "0 4px 14px rgba(20, 184, 166, 0.3)",
              }}
            >
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Request Submitted
            </h1>
            <p className="text-sm text-gray-500 mt-2 max-w-xs">
              Your access request has been sent to the administrator. You&apos;ll receive access once approved.
            </p>
          </div>
          <Link
            href="/login"
            className="neu-button-primary inline-block w-full text-center"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="neu-card">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4"
            style={{
              background: "linear-gradient(135deg, #14b8a6, #0d9488)",
              boxShadow: "0 4px 14px rgba(20, 184, 166, 0.3)",
            }}
          >
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Request Access
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Join Acquisition Checklist
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="neu-input"
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="neu-input"
              placeholder="john@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neu-input pr-10"
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="neu-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Request Access"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
