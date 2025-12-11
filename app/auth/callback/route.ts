import { NextResponse } from 'next/server'
import { authServerService } from '@/lib/services/auth-server.service'
import { config } from '@/lib/config/environment'
import { handleAsyncError, logError } from '@/lib/utils/error-handler'


export async function GET(request: Request) {
  return handleAsyncError(async () => {
    const { searchParams } = new URL(request.url)
    console.log("🔗 OAuth callback request URL:", request.url)

    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    // Use trusted SITE_URL from environment instead of x-forwarded-host to prevent Open Redirect
    const trustedBaseUrl = config.app.siteUrl;
    console.log("🏠 OAuth callback using trusted base URL:", trustedBaseUrl)

    if (!code) {
      console.warn("⚠️ No authorization code found in callback");
      return NextResponse.redirect(`${trustedBaseUrl}/error?message=missing_code`)
    }

    console.log("🔍 Processing OAuth callback with code:", code.substring(0, 10) + "...")

    try {
      const session = await authServerService.handleOAuthCallback(code);
      console.log("✅ OAuth session established for user:", session.user.aud);

      const redirectUrl = `${trustedBaseUrl}${next}`;

      console.log("🔄 Redirecting to:", redirectUrl);
      return NextResponse.redirect(redirectUrl);

    } catch (error) {
      logError(error as Error, "OAuth callback processing", { code: code.substring(0, 10) + "..." });
      return NextResponse.redirect(`${trustedBaseUrl}/error?message=auth_failed`);
    }
  }, "OAuth callback handler");
}