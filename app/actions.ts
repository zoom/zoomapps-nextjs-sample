"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authServerService } from "@/lib/services/auth-server.service";
import { handleAsyncError, logError } from "@/lib/utils/error-handler";

export const signInWithZoomApp = async () => {
  return handleAsyncError(async () => {
    const headerList = await headers();
    const origin = headerList.get("origin");

    if (!origin) {
      throw new Error("Origin header is required");
    }

    console.log("🚀 Initiating Zoom app authentication flow");
    const result = await authServerService.initiateZoomAppAuth(origin);
    console.log("✅ Generated OAuth URL with state parameter");
    
    return result;
  }, "signInWithZoomApp");
};

export const signInWithZoom = async () => {
  return handleAsyncError(async () => {
    const headerList = await headers();
    const origin = headerList.get("origin");

    if (!origin) {
      throw new Error("Origin header is required");
    }

    console.log("🚀 Initiating standard Zoom OAuth flow for origin:", origin);
    
    const url = await authServerService.initiateZoomAuth(origin);
    console.log("✅ Generated Zoom OAuth URL");
    return redirect(url);
  }, "signInWithZoom");
};


export async function signOutAction() {
  return handleAsyncError(async () => {
    console.log("🚪 Signing out user");
    await authServerService.signOut();
    console.log("✅ User signed out successfully");
    redirect("/");
  }, "signOutAction");
};