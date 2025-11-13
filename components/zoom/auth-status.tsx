/**
 * Authentication status display component
 */

import type { AuthStatus } from "@/lib/types/auth";

interface AuthStatusProps {
  authStatus: AuthStatus;
  error?: string | null;
}

export function AuthStatus({ authStatus, error }: AuthStatusProps) {
  if (authStatus === "success") {
    return (
      <div className="mt-4">
        <p className="text-green-600 text-sm">✅ Redirecting to dashboard...</p>
      </div>
    );
  }

  if (authStatus === "error") {
    return (
      <div className="mt-4">
        <p className="text-red-600 text-sm">
          ❌ Authentication failed. Please try again.
        </p>
        {error && (
          <p className="text-red-500 text-xs mt-1">
            Error: {error}
          </p>
        )}
      </div>
    );
  }

  return null;
}