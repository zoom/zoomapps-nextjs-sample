import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { upsertSupabaseUser } from "@/app/lib/token-store";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const zoomHeader = request.headers.get("x-zoom-app-context");

  if (zoomHeader) {
    
    console.log("__________________________Zoom App (embedded client) - Middleware Processing Third-party OAuth________________________\n");
    
    console.log("📬  Zoom App (embedded client) - Processing context header:\n", zoomHeader, "\n");
    
  }

  // Extract query parameters
  let access_token = url.searchParams.get("access_token");
  let refresh_token = url.searchParams.get("refresh_token");
  const state = url.searchParams.get("state") || "unknown";

  if (!access_token || !refresh_token) {
    const rawSearch = url.search;
    const decodedSearch = decodeURIComponent(rawSearch.replace(/^\?/, ""));
    const fragmentParams = new URLSearchParams(decodedSearch);

    access_token = access_token || fragmentParams.get("access_token") || fragmentParams.get("#access_token") || fragmentParams.get("%23access_token");
    refresh_token = refresh_token || fragmentParams.get("refresh_token");
  }

  if (access_token && refresh_token) {
    
    console.log('\n', "🪪  Zoom App (embedded client) - MW Third-party OAuth access token:", access_token);
    
    console.log("🔁  Zoom App (embedded client) - MW Third-party OAuth refresh token:", refresh_token);
    
    console.log("🔑  Zoom App (embedded client) - MW Third-party OAuth state:", state, "\n");
    

    try {
      // Store tokens in Redis with a TTL of 1 hour from now
      const expiresAt = Date.now() + 3600 * 1000;
      await upsertSupabaseUser(state, access_token, refresh_token, expiresAt);

      
      console.log("✅ Zoom App (embedded client) - MW Third-party OAuth tokens stored in Redis - state: ", state, "\n");
      
    } catch (error) {
      
      console.error("❌ Zoom App (embedded client) - MW Failed to store third-party OAuth tokens in Redis:", error);
      
    }
    // Set tokens in Supabase session
    // Clean up tokens from URL and redirect
    url.searchParams.delete("access_token");
    url.searchParams.delete("refresh_token");
    url.pathname = "/dashboard";

    return NextResponse.redirect(url);
  }
  // Continue normal Supabase session logic
  const response = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
