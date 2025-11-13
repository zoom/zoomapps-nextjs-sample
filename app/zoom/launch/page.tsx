"use client";

import { useEffect, useState } from "react";
import { getDeeplink } from "@/app/lib/zoom-api";
import { redisService } from "@/lib/services/redis.service";
import { handleAsyncError } from "@/lib/utils/error-handler";

export default function ZoomLaunchRedirectHandler() {
  const [status, setStatus] = useState("🔄 Signing you in...");
  const [deeplink, setDeeplink] = useState<string | undefined>(undefined);

  useEffect(() => {
    const run = async () => {
      
      console.log("__________________________ Zoom App (embedded client) - OAuth Launch Handler _______________________", "\n");
      

      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      console.log("🔗 Zoom App (embedded client) - Third-party OAuth tokens received from Supabase:", hashParams.toString(), "\n");
      

      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      const provider_token = hashParams.get("provider_token");
      const provider_refresh_token = hashParams.get("provider_refresh_token");

      const queryParams = new URLSearchParams(window.location.search);
      const state = queryParams.get("state")
      
      console.log(" 🪵  Zoom App (embedded client) - OAuth state parameter from URL:", state, "\n");
      

      console.log("_____________ Zoom App (embedded client) - Third-party OAuth Implementation with Supabase ______________", "\n");
      
      console.log("🧠 Zoom App (embedded client) - Third-party OAuth Documentation: https://developers.zoom.us/docs/zoom-apps/authentication/#third-party-oauth-optional", "\n");
      
      console.log("🔑 Zoom App (embedded client) - Third-party OAuth tokens extracted from Supabase callback:", {
        access_token,
        refresh_token,
        provider_token,
        provider_refresh_token,
      });
      

      if (!access_token || !refresh_token) {
        setStatus("❌ Missing access or refresh token");
        return;
      }

      if (!provider_token) {
        setStatus("❌ Missing provider token");
        return;
      }

      // Construct data to pass to getDeeplink
      const data = {
        action: JSON.stringify({ // MAX: 256
          // url: '/dashboard',
          //refresh_token,
          //access_token  // Exceed character 256 limit
          state: state, // TODO: Make dynamic
          verified: 'getToken',
        }),
      };

      
      console.log('🔄 Zoom App (embedded client) - Generating deeplink to redirect back to Zoom client with OAuth tokens . . .', '\n')
      
      const link = await getDeeplink(provider_token, data);
      
      console.log("🔗 Zoom App (embedded client) - Third-party OAuth deeplink generated:", link, '\n');
      

      if (!link) {
        setStatus("❌ Failed to retrieve Zoom deeplink");
        return;
      }
      setDeeplink(link);

      
      if (hashParams && hashParams.toString().length > 0) {
        
        console.log("🔄 <----- Zoom App (embedded client) - Sending third-party OAuth tokens to Home URL:-----> 🔄 ");
        

        const supaHashParams = new URLSearchParams(window.location.hash);

        
        console.log("🔗 Zoom App (embedded client) - Third-party OAuth tokens being sent to Home URL: 🔗", supaHashParams.toString(), "\n");
        
        
        const res = await fetch(`/api/zoom/home?state=${state}&${supaHashParams}`, {
          method: "GET"
        });

        if (!res.ok) {
          
          console.error("❌ Zoom App (embedded client) - Error sending third-party OAuth tokens to Home URL:", await res.text());
          
          setStatus("❌ Error during sign-in process");
          return;
        }
        //Sent query params to Home URL -- Home Route Will handle token extraction and redirect to the Zoom App

        // ✅ Open in a new tab
        const newTab = window.open(link, "_blank");
        if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
          
          console.warn("⚠️ Zoom App (embedded client) - Third-party OAuth deeplink popup blocked. Showing manual button fallback.");
          
          setStatus("⚠️ Please click the button below to open the Zoom App.");
        } else {
          setStatus("✅ Zoom App opened in new tab.");
        }

        return;
      }
    };

    run();
  }, []);

  return (
    <div className="p-4 text-center text-sm">
      <p>{status}</p>

      {deeplink && (
        <div className="mt-4">
          <button
            onClick={() => window.open(deeplink, "_blank")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Open Zoom App
          </button>
        </div>
      )}
    </div>
  );
}
