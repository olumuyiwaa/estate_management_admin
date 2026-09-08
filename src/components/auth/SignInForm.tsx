"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/useAuth";
import { toast } from "react-toastify";

export default function SignInForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!userName.trim() || !password) {
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      await login({ userName: userName.trim(), password });

      // Verify token was actually stored before navigating
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(
          "Login succeeded but no token was stored. Check API response shape."
        );
        console.error(
          "[auth] After login, accessToken missing from localStorage"
        );
        return;
      }

      toast.success("Welcome back!");
      router.replace("/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        (Array.isArray(err?.response?.data?.errors)
          ? err.response.data.errors[0]
          : null) ||
        err?.message ||
        "Login failed. Please check your credentials.";
      toast.error(message);
      console.error("[auth] Login error:", err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-md mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Corvanta
            </h1>
            <p className="text-sm text-gray-500">Estate Admin Portal</p>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter your credentials to access the admin dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="userName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Username
          </label>
          <input
            id="userName"
            type="text"
            autoComplete="username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="Email or username"
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 pr-12"
              placeholder="Enter your password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-medium py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
