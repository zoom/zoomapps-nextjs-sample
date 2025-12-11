/**
 * Custom hook for managing Zoom SDK initialization and configuration
 * Third-party OAuth via Supabase
 */

import { useState, useEffect } from "react";
import zoomSdk from "@zoom/appssdk";

interface UseZoomSDKOptions {
  capabilities?: string[];
}

export function useZoomSDK(options: UseZoomSDKOptions = {}) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    capabilities = [
      "getUserContext",
      "onMyUserContextChange",
      "openUrl",
    ],
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
    openUrl,
  };
}