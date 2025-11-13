/**
 * Custom hook for managing Zoom SDK initialization and configuration
 */

import { useState, useEffect, useRef } from "react";
import zoomSdk from "@zoom/appssdk";
import type { ZoomAuthorizedEvent } from "@/lib/types/zoom";

interface UseZoomSDKOptions {
  capabilities?: string[];
  onAuthorized?: (event: ZoomAuthorizedEvent) => void;
}

export function useZoomSDK(options: UseZoomSDKOptions = {}) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onAuthorizedRef = useRef<(event: ZoomAuthorizedEvent) => void | undefined>(undefined);

  const {
    capabilities = [
      "authorize",
      "onAuthorized", 
      "promptAuthorize",
      "getUserContext",
      "onMyUserContextChange",
      "openUrl",
    ],
    onAuthorized,
  } = options;

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await zoomSdk.config({ capabilities: capabilities as any });
        setIsConfigured(true);
        setError(null);
        console.log("✅ Zoom SDK configured successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("❌ Zoom SDK configuration failed:", err);
      }
    };

    initializeSDK();
  }, [capabilities]);

  useEffect(() => {
    if (!onAuthorized) return;

    const handler = (event: ZoomAuthorizedEvent) => {
      console.log("🎯 onAuthorized event triggered:", event);
      onAuthorized(event);
    };

    onAuthorizedRef.current = handler;
    zoomSdk.addEventListener("onAuthorized", handler);

    return () => {
      if (onAuthorizedRef.current) {
        console.log("🧹 Cleaning up Zoom SDK event listener");
        zoomSdk.removeEventListener("onAuthorized", onAuthorizedRef.current);
      }
    };
  }, [onAuthorized]);

  const authorize = async (codeChallenge: string, state: string) => {
    if (!isConfigured) {
      throw new Error("Zoom SDK not configured");
    }

    try {
      await zoomSdk.authorize({ codeChallenge, state });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authorization failed";
      throw new Error(errorMessage);
    }
  };

  const openUrl = async (url: string) => {
    if (!isConfigured) {
      throw new Error("Zoom SDK not configured");
    }

    try {
      await zoomSdk.openUrl({ url });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to open URL";
      throw new Error(errorMessage);
    }
  };

  return {
    isConfigured,
    error,
    authorize,
    openUrl,
  };
}