import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { apiFetch } from "./auth";

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_CLIENT_ID = "737179908728-qrqr8r9g7jkof4800mct2tnfcsc1kchh.apps.googleusercontent.com";

export const DRIVE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function buildDriveRedirectUri() {
  return AuthSession.makeRedirectUri({ preferLocalhost: true });
}

export async function exchangeDriveCode(params: {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}) {
  return apiFetch("/drive/auth/exchange", {
    method: "POST",
    body: JSON.stringify({
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
    }),
  });
}

export const driveApi = {
  status: () => apiFetch("/drive/status"),
  disconnect: () => apiFetch("/drive/disconnect", { method: "POST" }),
  backup: () => apiFetch("/drive/backup", { method: "POST" }),
  list: () => apiFetch("/drive/backups"),
  restore: (fileId: string) => apiFetch(`/drive/restore/${fileId}`, { method: "POST" }),
};
