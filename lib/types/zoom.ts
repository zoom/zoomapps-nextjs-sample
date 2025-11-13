/**
 * Zoom-related type definitions
 */

export interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export interface ZoomUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  timezone: string;
  verified: number;
  created_at: string;
  last_login_time: string;
  status: string;
}

export interface ZoomDeeplinkRequest {
  action?: string;
}

export interface ZoomDeeplinkResponse {
  deeplink: string;
}

export interface ZoomAppContext {
  uid: string;
  act?: string;
  typ?: string;
  [key: string]: any;
}

export interface ParsedZoomAction {
  state?: string;
  verified?: string;
  url?: string;
  [key: string]: any;
}

export interface ZoomSDKConfig {
  capabilities: string[];
}

export interface ZoomAuthorizeOptions {
  codeChallenge: string;
  state: string;
}

export interface ZoomOpenUrlOptions {
  url: string;
}

export type ZoomSDKEvent = "onAuthorized" | "onMyUserContextChange";

export interface ZoomAuthorizedEvent {
  state: string;
  code?: string;
}