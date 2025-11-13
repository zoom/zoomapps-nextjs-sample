import { type NextRequest, NextResponse } from "next/server";
import { decryptZoomAppContext } from "@/app/lib/zoom-helper.js";
import { updateSession } from "@/utils/supabase/middleware";
import { redisService } from "@/lib/services/redis.service";
import { config } from "@/lib/config/environment";
import { handleAsyncError, logError } from "@/lib/utils/error-handler";

export async function GET(request: NextRequest) {
  
  console.log("__________________________Zoom App (embedded client) - Home Route Handler for Third-party OAuth________________________", "\n");
  
  const response = await updateSession(request);
  const { searchParams, origin } = new URL(request.url);

  const zoomHeader = request.headers.get("x-zoom-app-context");

  logRequest(request.url, zoomHeader, searchParams);
  const parsedAction = handleZoomContext(zoomHeader);
  const { uid ,state, act } = parsedAction;

  
  console.log(
    "\n",
    `Zoom App (embedded client) - Using third-party OAuth state for Redis lookup (userId: ${uid}, state: ${state}) from Zoom context headers.\n`
  );
  
  
  // Only write to Redis if *both* uid and state are present
  if (uid && state) {
    try {
      await redisService.storeUserLatestState(uid, state);
      
      console.log("☑️  Zoom App (embedded client) - Saved third-party OAuth state to Redis");
      
    } catch (e) {
      logError(e as Error, "Redis write failed", { uid, state });
      return NextResponse.json({ error: "Redis write failed" }, { status: 500 });
    }
  } else {
    
    console.log("ℹ Zoom App (embedded client) - No OAuth state in context (or missing uid) — skipping Redis write");
    
  }

  // Handle API mode from client request (no redirect)
  const result = await handleActParam(act, state);
  if (result) return result;

  const redirectUrl = buildRedirectUrl(request, searchParams, origin);

  return NextResponse.redirect(redirectUrl);

}

function logRequest(url: string, header: string | null, params: URLSearchParams) {
  
  console.log("🔗 Zoom App (embedded client) - Home route request URL:", url, "\n");
  
  console.log("🔍 Zoom App (embedded client) - Third-party OAuth parameters received:");
  
  for (const [key, value] of Array.from(params.entries())) {
    console.log(`• ${key}: ${value}`);
  }
  
  console.log("\n","🚨 Zoom App (embedded client) - The Action Parameter includes OAuth state and deeplink action for third-party authentication!", '\n');
  
  console.log("🔑 Zoom App (embedded client) - Zoom context header with user session:", header, "\n");
  
}

function buildRedirectUrl(request: NextRequest, searchParams: URLSearchParams, origin: string) {
  const next = searchParams.get("next") ?? "/";

  
  console.log("Zoom App (embedded client) - Redirect target after OAuth:", next);
  

  const host = "https://" + request.headers.get("x-forwarded-host");
  return config.app.isDevelopment ? `${host}${next}` : `${origin}${next}`;
}

/**
 * Helper function to handle the "act" parameter logic
 */
async function handleActParam(
  act: { verified?: string } | undefined,
  state: string | undefined
): Promise<Response | null> {
  if (act?.verified === "getToken") {
    
    console.log("\n","⭐️ Zoom App (embedded client) - Third-party OAuth deeplink action:", act.verified, );
    
    console.log(" 🧠 Zoom App (embedded client) - Deeplink API docs: https://developers.zoom.us/docs/api/marketplace/#tag/apps/POST/zoomapp/deeplink", "\n");
    


    try {
      const tokenData = await redisService.getSupabaseTokens(state ?? "");
      
      console.log("🔐 Zoom App (embedded client) - Third-party OAuth tokens retrieved from Redis:", tokenData, "\n");
      

      const redirectUrl = new URL("https://donte.ngrok.io");
      redirectUrl.searchParams.set("state", state ?? "");

      
      console.log("🔄 Zoom App (embedded client) - Redirecting with third-party OAuth tokens:", redirectUrl.toString(), "\n");
      

      return NextResponse.redirect(redirectUrl.toString());
    } catch (e) {
      
      console.error("❌ Zoom App (embedded client) - Failed to retrieve third-party OAuth tokens from Redis:", e);
      
      return NextResponse.redirect("https://donte.ngrok.io?error=token_not_found");
    }
  }

  return null;
}


function handleZoomContext(header: string | null): {
  uid?: string;
  act?: any;
  verified?: string;
  state?: string;
} {
  if (!header) {
    
    console.log("ℹ️ Zoom App (embedded client) - No context header found. Likely first load in Zoom Client.");
    
    return {};
  }

  try {
    const context = decryptZoomAppContext(header, config.zoom.clientSecret);
    
    console.log("🔐 Zoom App (embedded client) - Decrypted context with user session:", context, '\n');
    

    // UID is already a plain string, do not parse
    const uid = context.uid;
    if (!uid) {
      
      console.log("⚠️ Zoom App (embedded client) - Context missing UID — invalid or malformed.");
      
      return {};
    }

    
    console.log("⭐️ Zoom App (embedded client) - User ID extracted from context:", uid);
    

    // Act is optional — deep linking or context-based actions
    let act: any = undefined;
    let state: any  = undefined;
    if (context.act) {
      try {
        act = JSON.parse(context.act);
        
        console.log("🎬 Zoom App (embedded client) - Third-party OAuth action context parsed:", act);
        

        state = act.state 
        if (act.state) {
          
          console.log("☄️  Zoom App (embedded client) - OAuth state from action context:", act.state);
          
        } else {
          
          console.log("⚠️ Zoom App (embedded client) - Action context missing OAuth state — invalid or malformed.");
          
        }
      } catch (e) {
        
        console.warn("❌ Zoom App (embedded client) - Failed to parse third-party OAuth action from context:", e);
        
      }
    } else {
      
      console.log(" ⚠️  Zoom App (embedded client) - No action value in context — likely a standard app open (no third-party OAuth).");
      
    }

    return {uid,act,state};
  } catch (error) {
    
    console.error("❌ Zoom App (embedded client) - Failed to process context for third-party OAuth:", error);
    
    return {};
  }
}

