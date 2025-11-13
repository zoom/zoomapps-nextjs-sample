/**
 * Refactored Zoom App Container
 * Clean, focused component with separated concerns
 */

"use client";

import { usePathname } from "next/navigation";
import { useZoomSDK } from "@/lib/hooks/useZoomSDK";
import { useAuthFlow } from "@/lib/hooks/useAuthFlow";
import { signInWithZoomApp } from "@/app/actions";
import { AuthButtons } from "./auth-buttons";
import { AuthStatus } from "./auth-status";

const HARDCODED_CODE_CHALLENGE = "ZjBjMDdjYWEwODJkYjQ0NDZjNDEwODc0MzljYjA2ZGRlYTk3YzM0YmI3YzljZDVjNTcxOTI0NzMyODhhMmZhYg==";
const HARDCODED_STATE = "TIA5UgoMte";

export default function ZoomAppContainer() {
  const location = usePathname();
  
  const {
    authStatus,
    error: authError,
    state,
    handleSessionHydration,
    initiateZoomAppAuth,
  } = useAuthFlow();

  const {
    isConfigured,
    error: sdkError,
    authorize,
    openUrl,
  } = useZoomSDK({
    onAuthorized: (event) => {
      
      console.log("🎯 Zoom App (embedded client) - User authorization for third-party OAuth completed:", event);
      
      handleSessionHydration(event.state);
    },
  });

  const handleZoomClientAuth = async () => {
    try {
      await authorize(HARDCODED_CODE_CHALLENGE, HARDCODED_STATE);
    } catch (err) {
      
      console.error("❌ Zoom App (embedded client) - Third-party OAuth authorization failed:", err);
      
    }
  };

  const handleSupabaseAuth = async () => {
    try {
      const { url } = await signInWithZoomApp();
      await openUrl(url);
      
      console.log("✅ Zoom App (embedded client) - Third-party OAuth URL opened via Zoom SDK for Supabase authentication");
      
    } catch (err) {
      
      console.error("❌ Zoom App (embedded client) - Third-party Supabase authentication via Zoom SDK failed:", err);
      
    }
  };

  
  console.log("🏠 Zoom App (embedded client) - Container loaded on route:", location);
  

  if (state) {
    
    console.log("🔑 Zoom App (embedded client) - OAuth state parameter detected for session restoration:", state);
    
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold mb-2">Zoom App Home Page</h1>
        <p className="text-sm text-gray-600">
          Current route: {location}
        </p>
      </header>

      {sdkError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">
            ❌ Zoom SDK Error: {sdkError}
          </p>
        </div>
      )}

      <AuthButtons
        isConfigured={isConfigured}
        authStatus={authStatus}
        onZoomClientAuth={handleZoomClientAuth}
        onSupabaseAuth={handleSupabaseAuth}
      />

      <AuthStatus 
        authStatus={authStatus} 
        error={authError || sdkError} 
      />
    </div>
  );
}