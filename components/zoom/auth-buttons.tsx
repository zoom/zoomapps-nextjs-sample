/**
 * Authentication buttons for Zoom app
 * Third-party OAuth via Supabase
 */

import { Button } from "@/components/ui/button";
import type { AuthStatus } from "@/lib/types/auth";

interface AuthButtonsProps {
  isConfigured: boolean;
  authStatus: AuthStatus;
  onSupabaseAuth: () => Promise<void>;
}

export function AuthButtons({
  isConfigured,
  authStatus,
  onSupabaseAuth,
}: AuthButtonsProps) {
  const isLoading = authStatus === "loading";
  const isDisabled = !isConfigured || isLoading;

  return (
    <div className="flex flex-col gap-3 mt-4">
      <Button
        onClick={onSupabaseAuth}
        disabled={isDisabled}
        variant="default"
      >
        {isLoading ? "Authorizing..." : "Authorize with Third-Party OAuth"}
      </Button>
    </div>
  );
}