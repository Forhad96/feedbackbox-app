import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { GOOGLE_OAUTH } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!GOOGLE_OAUTH.enabled) {
    return NextResponse.redirect(
      new URL(
        "/login?error=" +
          encodeURIComponent(
            "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it."
          ),
        process.env.APP_BASE_URL ?? "http://localhost:3000"
      )
    );
  }

  const state = randomBytes(16).toString("hex");
  const url = new URL(GOOGLE_OAUTH.authUrl);
  url.searchParams.set("client_id", GOOGLE_OAUTH.clientId);
  url.searchParams.set("redirect_uri", GOOGLE_OAUTH.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_OAUTH.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("fb_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
