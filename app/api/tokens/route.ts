/**
 * API route for retrieving tokens from Redis (server-side)
 * Called by client-side hooks to securely retrieve cached tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/lib/services/redis.service';
import { handleAsyncError, logError } from '@/lib/utils/error-handler';

export async function GET(request: NextRequest) {
  return handleAsyncError(async () => {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    if (!state) {
      return NextResponse.json(
        { error: 'Missing state parameter' },
        { status: 400 }
      );
    }

    console.log("🔐 API: Retrieving tokens for state:", state);

    try {
      const tokenData = await redisService.getSupabaseTokens(state);

      console.log("✅ API: Tokens retrieved successfully");

      return NextResponse.json({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
      });
    } catch (error) {
      logError(error as Error, "Token retrieval failed", { state });

      return NextResponse.json(
        { error: 'Failed to retrieve tokens' },
        { status: 404 }
      );
    }
  }, "Token retrieval API");
}
