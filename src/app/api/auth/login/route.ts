import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const dict = await getServerDictionary();
    const api = dict.api;
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: api.credentialsInvalid },
        { status: 400 }
      );
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (!profile || !profile.passwordHash) {
      return NextResponse.json(
        { error: api.credentialsInvalid },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, profile.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: api.credentialsInvalid },
        { status: 401 }
      );
    }

    await createSession({
      id: profile.id,
      email: profile.email,
      username: profile.username,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    });
    return NextResponse.json({ ok: true, username: profile.username });
  } catch (err) {
    console.error("login error", err);
    const dict = await getServerDictionary();
    return NextResponse.json(
      { error: dict.api.loginFailed },
      { status: 500 }
    );
  }
}
