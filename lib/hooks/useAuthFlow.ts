/**
 * Custom hook for managing authentication flow state
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authService } from "@/lib/services/auth.service";
import type { AuthStatus } from "@/lib/types/auth";

export function useAuthFlow() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const state = searchParams?.get("state");

  useEffect(() => {
    if (!state) return;

    
    console.log("✅ Zoom App (embedded client) - Third-party OAuth state found, initiating session hydration:", state);
    
    handleSessionHydration(state);
  }, [state]);

  const handleSessionHydration = async (cacheState: string) => {
    try {
      setAuthStatus("loading");
      setError(null);

      console.log("🔐 Zoom App (embedded client) - Retrieving third-party OAuth tokens via API:", cacheState);

      // Call server-side API to retrieve tokens from Redis
      const response = await fetch(`/api/tokens?state=${encodeURIComponent(cacheState)}`);

      if (!response.ok) {
        throw new Error(`Failed to retrieve tokens: ${response.statusText}`);
      }

      const tokenData = await response.json();

      if (!tokenData.accessToken || !tokenData.refreshToken) {
        throw new Error("Incomplete token data received from API");
      }

      console.log("🔑 Zoom App (embedded client) - Setting Supabase session with cached third-party OAuth tokens");

      const session = await authService.setClientSession(
        tokenData.accessToken,
        tokenData.refreshToken
      );

      if (session) {
        console.log("✅ Zoom App (embedded client) - Third-party OAuth authentication successful, redirecting to dashboard");

        setAuthStatus("success");
        window.location.href = "/dashboard";
      } else {
        throw new Error("Failed to establish session");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";

      console.error("❌ Zoom App (embedded client) - Third-party OAuth session hydration failed:", errorMessage);

      setError(errorMessage);
      setAuthStatus("error");
    }
  };

  const resetAuth = () => {
    setAuthStatus("idle");
    setError(null);
  };

  return {
    authStatus,
    error,
    state,
    resetAuth,
  };
}