/**
 * Custom hook for managing authentication flow state
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authService } from "@/lib/services/auth.service";
import { redisService } from "@/lib/services/redis.service";
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

      
      console.log("🔐 Zoom App (embedded client) - Retrieving third-party OAuth tokens from Redis:", cacheState);
      
      const tokenData = await redisService.getSupabaseTokens(cacheState);

      if (!tokenData.accessToken || !tokenData.refreshToken) {
        throw new Error("Incomplete token data received from cache");
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

  const initiateZoomAppAuth = async () => {
    try {
      setAuthStatus("loading");
      setError(null);

      // This will be called from the component that uses this hook
      // The actual OAuth initiation should be done via server action
      
      console.log("✅ Zoom App (embedded client) - Third-party OAuth authentication initiation requested");
      
      setAuthStatus("success");
      return Promise.resolve({ url: "" }); // Return structure for compatibility
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initiate auth";
      
      console.error("❌ Zoom App (embedded client) - Third-party OAuth authentication failed:", errorMessage);
      
      setError(errorMessage);
      setAuthStatus("error");
      throw err;
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
    handleSessionHydration,
    initiateZoomAppAuth,
    resetAuth,
  };
}