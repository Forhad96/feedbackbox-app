import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { createSession, generateUniqueUsername } from "@/lib/auth";
import { GOOGLE_OAUTH } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith("fb_oauth_state="))
    ?.split("=")[1];

  if (!GOOGLE_OAUTH.enabled) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Google is not configured."), base)
    );
  }
  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Invalid Google state."), base)
    );
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_OAUTH.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_OAUTH.clientId,
        client_secret: GOOGLE_OAUTH.clientSecret,
        redirect_uri: GOOGLE_OAUTH.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      throw new Error("token exchange failed");
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error("no access token");
    }

    // Fetch user profile
    const userRes = await fetch(GOOGLE_OAUTH.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      throw new Error("userinfo failed");
    }
    const user = (await userRes.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };
    if (!user.email) {
      throw new Error("no email from Google");
    }

    const email = user.email.toLowerCase();
    const fullName = user.name ?? email.split("@")[0];
    const avatarUrl = user.picture ?? null;
    const baseUsername =
      fullName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) ||
      email.split("@")[0];

    // Find or create profile (RLS-equivalent: accounts are keyed by email)
    let [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (!profile) {
      const username = await generateUniqueUsername(baseUsername);
      [profile] = await db
        .insert(profiles)
        .values({
          username,
          email,
          fullName,
          passwordHash: null,
          avatarUrl,
          provider: "google",
        })
        .returning();
    } else if (profile.avatarUrl !== avatarUrl || profile.provider === "email") {
      await db
        .update(profiles)
        .set({ avatarUrl, provider: "google" })
        .where(eq(profiles.id, profile.id));
    }

    await createSession({
      id: profile.id,
      email: profile.email,
      username: profile.username,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    });

    const res = NextResponse.redirect(new URL("/dashboard", base));
    res.cookies.delete("fb_oauth_state");
    return res;
  } catch (err) {
    console.error("google callback error", err);
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Google sign-in failed."), base)
    );
  }
}
