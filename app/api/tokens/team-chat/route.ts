/**
 * API route for retrieving tokens by userId (Team Chat flow)
 * Looks up user's latest state, then retrieves tokens from Redis
 */

import { NextRequest, NextResponse } from 'next/server';
import { redisService } from '@/lib/services/redis.service';
import { handleAsyncError, logError } from '@/lib/utils/error-handler';

export async function GET(request: NextRequest) {
  return handleAsyncError(async () => {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log("🔐 API (Team Chat): Retrieving tokens for userId:", userId);

    try {
      // Step 1: Get the latest state for this user
      const state = await redisService.getUserLatestState(userId);
      console.log("✅ API (Team Chat): Found latest state for user:", state);

      // Step 2: Get tokens using that state
      const tokenData = await redisService.getSupabaseTokens(state);
      console.log("✅ API (Team Chat): Tokens retrieved successfully");

      return NextResponse.json({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
      });
    } catch (error) {
      logError(error as Error, "Team Chat token retrieval failed", { userId });

      // Provide helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('not found')) {
        return NextResponse.json(
          {
            error: 'User not authenticated yet. Please complete OAuth flow first.',
            details: errorMessage
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to retrieve tokens', details: errorMessage },
        { status: 500 }
      );
    }
  }, "Team Chat token retrieval API");
}
