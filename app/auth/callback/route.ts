import { NextResponse } from 'next/server'
import { authServerService } from '@/lib/services/auth-server.service'
import { config } from '@/lib/config/environment'
import { handleAsyncError, logError } from '@/lib/utils/error-handler'


export async function GET(request: Request) {
  return handleAsyncError(async () => {
    const { searchParams, origin } = new URL(request.url)
    console.log("🔗 OAuth callback request URL:", request.url)
    
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const forwardedHost = "https://" + request.headers.get('x-forwarded-host')

    if (!code) {
      console.warn("⚠️ No authorization code found in callback");
      return NextResponse.redirect(`${forwardedHost}/error?message=missing_code`)
    }

    console.log("🔍 Processing OAuth callback with code:", code.substring(0, 10) + "...")
    console.log("🔗 Forward host:", forwardedHost)

    try {
      const session = await authServerService.handleOAuthCallback(code);
      console.log("✅ OAuth session established for user:", session.user.aud);

      const redirectUrl = config.app.isDevelopment ? 
        `${forwardedHost}${next}` : 
        `${origin}${next}`;

      console.log("🔄 Redirecting to:", redirectUrl);
      return NextResponse.redirect(redirectUrl);

    } catch (error) {
      logError(error as Error, "OAuth callback processing", { code: code.substring(0, 10) + "..." });
      return NextResponse.redirect(`${forwardedHost}/error?message=auth_failed`);
    }
  }, "OAuth callback handler");
}