"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthResponse, AuthUser, fetchCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest, RegisterPayload, LoginPayload } from "@/src/lib/api/auth";
import { clearAuthStorage, getAccessToken, setAccessToken, setRefreshToken, clearAccessToken, clearRefreshToken } from "@/src/lib/auth/token-storage";
import { BYPASS_AUTH } from "@/src/lib/config";
import { toast } from "sonner";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

const mockUser: AuthUser = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "dev@example.com",
  first_name: "Dev",
  last_name: "User",
  role: "admin",
  is_active: true,
  last_login_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractAuthPayload(response: AuthResponse) {
  setAccessToken(response.accessToken);
  if (response.refreshToken) {
    setRefreshToken(response.refreshToken);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthSuccess = useCallback((response: AuthResponse) => {
    extractAuthPayload(response);
    setUser(response.user);
    setStatus("authenticated");
    setIsLoading(false);
    return response;
  }, []);

  const handleAuthFailure = useCallback((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to complete authentication.";
    toast.error(message);
    throw error;
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setStatus("loading");
      setIsLoading(true);
      try {
        const response = await loginRequest(payload);
        toast.success("Signed in successfully.");
        return handleAuthSuccess(response);
      } catch (error) {
        setStatus("unauthenticated");
        setIsLoading(false);
        return handleAuthFailure(error);
      }
    },
    [handleAuthFailure, handleAuthSuccess]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setStatus("loading");
      setIsLoading(true);
      try {
        const response = await registerRequest(payload);
        toast.success("Account created successfully.");
        return handleAuthSuccess(response);
      } catch (error) {
        setStatus("unauthenticated");
        setIsLoading(false);
        return handleAuthFailure(error);
      }
    },
    [handleAuthFailure, handleAuthSuccess]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      // Ignore backend logout errors, but surface toast for unexpected issues
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      clearAuthStorage();
      setUser(null);
      setStatus("unauthenticated");
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      clearAuthStorage();
      setUser(null);
      setStatus("unauthenticated");
      setIsLoading(false);
      return;
    }

    setStatus("loading");
    setIsLoading(true);
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
      setStatus("authenticated");
    } catch {
      clearAccessToken();
      clearRefreshToken();
      setUser(null);
      setStatus("unauthenticated");
      toast.error("Your session has expired. Please sign in again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (BYPASS_AUTH && process.env.NODE_ENV === "development") {
        setUser(mockUser);
        setStatus("authenticated");
        setIsLoading(false);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setStatus("unauthenticated");
        setIsLoading(false);
        return;
      }
      try {
        const profile = await fetchCurrentUser();
        if (!mounted) return;
        setUser(profile);
        setStatus("authenticated");
      } catch {
        clearAuthStorage();
        if (mounted) {
          setStatus("unauthenticated");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isLoading,
      isAuthenticated: status === "authenticated",
      login,
      register,
      logout,
      refreshUser,
    }),
    [isLoading, login, logout, refreshUser, register, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
