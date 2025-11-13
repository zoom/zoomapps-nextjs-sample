/**
 * Authentication buttons for Zoom app
 */

import { Button } from "@/components/ui/button";
import type { AuthStatus } from "@/lib/types/auth";

interface AuthButtonsProps {
  isConfigured: boolean;
  authStatus: AuthStatus;
  onZoomClientAuth: () => Promise<void>;
  onSupabaseAuth: () => Promise<void>;
}

export function AuthButtons({
  isConfigured,
  authStatus,
  onZoomClientAuth,
  onSupabaseAuth,
}: AuthButtonsProps) {
  const isLoading = authStatus === "loading";
  const isDisabled = !isConfigured || isLoading;

  return (
    <div className="flex flex-col gap-3 mt-4">
      <Button 
        onClick={onZoomClientAuth} 
        disabled={isDisabled}
        variant="default"
      >
        {isLoading ? "Authorizing..." : "Authorize with Zoom In-Client Flow"}
      </Button>

      <Button 
        onClick={onSupabaseAuth} 
        disabled={isDisabled}
        variant="outline"
      >
        {isLoading ? "Authorizing..." : "Authorize with Raw Supabase URL"}
      </Button>
    </div>
  );
}