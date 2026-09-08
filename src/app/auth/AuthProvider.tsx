"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { AuthContextType, LoginPayload, AuthUser } from "../api/types";
import { authApi } from "../api/auth.api";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    const loggedInUser = response.user || {
      userName: payload.userName,
      displayName: payload.userName,
    };
    setUser(loggedInUser);
    setHasToken(!!localStorage.getItem("accessToken"));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
    setHasToken(false);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");
      setHasToken(!!token);
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("user");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && hasToken,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
