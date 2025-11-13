/**
 * Zoom API Service
 * Handles all Zoom API interactions with proper error handling and types
 */

import axios, { type AxiosRequestConfig } from "axios";
import crypto from "crypto";
import { config } from "@/lib/config/environment";
import type { 
  ZoomTokenResponse, 
  ZoomUser, 
  ZoomDeeplinkRequest, 
  ZoomDeeplinkResponse 
} from "@/lib/types/zoom";

class ZoomService {
  private readonly baseURL: string;
  private readonly apiBaseURL: string;

  constructor() {
    this.baseURL = config.zoom.host;
    this.apiBaseURL = config.zoom.apiHost;
  }

  /**
   * Generate a base64 URL-encoded string
   */
  private base64URL(str: string): string {
    return Buffer.from(str)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Generate a random string
   */
  private generateRandomString(format: BufferEncoding, depth = 32): string {
    return crypto.randomBytes(depth).toString(format);
  }

  /**
   * Generic token request handler
   */
  private async tokenRequest(
    params: URLSearchParams,
    clientId?: string,
    clientSecret?: string
  ): Promise<ZoomTokenResponse> {
    const username = clientId || config.zoom.clientId;
    const password = clientSecret || config.zoom.clientSecret;

    const response = await axios({
      data: params.toString(),
      baseURL: this.baseURL,
      url: "/oauth/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: { username, password },
    } as AxiosRequestConfig);

    return response.data;
  }

  /**
   * Generic API request handler
   */
  private async apiRequest<T = any>(
    method: string,
    endpoint: string,
    token: string,
    data: object | null = null
  ): Promise<T> {
    const response = await axios({
      data,
      method,
      baseURL: this.apiBaseURL,
      url: `/v2${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  }

  /**
   * Generate OAuth installation URL with PKCE
   */
  async getInstallURL(): Promise<{ url: URL; state: string; verifier: string }> {
    const state = this.generateRandomString("base64");
    const verifier = this.generateRandomString("ascii");

    const digest = crypto.createHash("sha256").update(verifier).digest("base64");
    const challenge = this.base64URL(digest);

    const url = new URL("/oauth/authorize", this.baseURL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", config.zoom.clientId);
    url.searchParams.set("redirect_uri", config.zoom.redirectUrl);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("state", state);

    return { url, state, verifier };
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string, verifier: string): Promise<ZoomTokenResponse> {
    const params = new URLSearchParams({
      code,
      code_verifier: verifier,
      redirect_uri: config.zoom.redirectUrl,
      grant_type: "authorization_code",
    });

    return this.tokenRequest(params);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<ZoomTokenResponse> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    return this.tokenRequest(params);
  }

  /**
   * Get Zoom user information
   */
  async getUser(userId: string, accessToken: string): Promise<ZoomUser> {
    return this.apiRequest<ZoomUser>("GET", `/users/${userId}`, accessToken);
  }

  /**
   * Generate Zoom deeplink for app navigation
   */
  async getDeeplink(
    accessToken: string,
    data: ZoomDeeplinkRequest = {}
  ): Promise<string | undefined> {
    if (!accessToken) {
      console.warn("Missing access token for deeplink generation");
      return undefined;
    }

    try {
      const body = { action: data.action };
      const response = await this.apiRequest<ZoomDeeplinkResponse>(
        "POST", 
        "/zoomapp/deeplink", 
        accessToken, 
        body
      );

      return response.deeplink;
    } catch (error: any) {
      console.error("Failed to generate Zoom deeplink:", error?.response?.data || error.message);
      return undefined;
    }
  }

  /**
   * Exchange authorization code for tokens (alternative method)
   */
  async exchangeCodeForToken(
    authCode: string,
    redirectUri?: string,
    pkceVerifier?: string
  ): Promise<ZoomTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: redirectUri || config.zoom.redirectUrl,
    });

    if (pkceVerifier) {
      params.set("code_verifier", pkceVerifier);
    }

    return this.tokenRequest(params);
  }
}

export const zoomService = new ZoomService();
export { ZoomService };