import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import {
  createSession,
  generateUniqueUsername,
  hashPassword,
} from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const dict = await getServerDictionary();
    const api = dict.api;
    const body = await request.json();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const requestedUsername = String(body.username ?? "").trim();

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { error: api.nameRequired },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: api.invalidEmail },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: api.passwordTooShort },
        { status: 400 }
      );
    }

    const base =
      requestedUsername ||
      fullName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) ||
      email.split("@")[0];
    const username = await generateUniqueUsername(base);

    const [existingEmail] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    if (existingEmail) {
      return NextResponse.json(
        { error: api.emailExists },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(profiles)
      .values({
        username,
        email,
        fullName,
        passwordHash,
        provider: "email",
      })
      .returning({
        id: profiles.id,
        username: profiles.username,
        email: profiles.email,
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
      });

    await createSession(created);
    return NextResponse.json({ ok: true, username: created.username });
  } catch (err) {
    console.error("signup error", err);
    const dict = await getServerDictionary();
    return NextResponse.json(
      { error: dict.api.signupFailed },
      { status: 500 }
    );
  }
}
