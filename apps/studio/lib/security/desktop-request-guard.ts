import { NextResponse } from "next/server";

const mutationMethods = new Set(["DELETE", "PATCH", "POST", "PUT"]);

export function rejectInvalidDesktopMutation(request: Request) {
  if (!mutationMethods.has(request.method)) {
    return null;
  }

  const expectedOrigin = process.env.LOCAL_STUDIO_DESKTOP_ORIGIN;
  const expectedToken = process.env.LOCAL_STUDIO_DESKTOP_AUTH_TOKEN;

  if (!expectedOrigin && !expectedToken) {
    return null;
  }

  if (!expectedOrigin || !expectedToken) {
    return forbiddenResponse();
  }

  const expectedHost = new URL(expectedOrigin).host;
  const host = request.headers.get("host");

  if (host !== expectedHost) {
    return forbiddenResponse();
  }

  const origin = request.headers.get("origin");

  if (origin && origin !== expectedOrigin) {
    return forbiddenResponse();
  }

  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return forbiddenResponse();
  }

  const cookieName = process.env.LOCAL_STUDIO_DESKTOP_AUTH_COOKIE ?? "clotoon_desktop_token";
  const requestToken = readCookieValue(request.headers.get("cookie"), cookieName);

  if (requestToken !== expectedToken) {
    return forbiddenResponse();
  }

  return null;
}

function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden desktop request" }, { status: 403 });
}

function readCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const separatorIndex = cookie.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const cookieName = cookie.slice(0, separatorIndex).trim();

    if (cookieName === name) {
      return cookie.slice(separatorIndex + 1).trim();
    }
  }

  return null;
}
