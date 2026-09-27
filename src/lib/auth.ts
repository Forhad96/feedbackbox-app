import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";

const COOKIE_NAME = "fb_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
};

/* ------------------------------------------------------------------ */
/* Password helpers                                                     */
/* ------------------------------------------------------------------ */

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ------------------------------------------------------------------ */
/* Session helpers                                                      */
/* ------------------------------------------------------------------ */

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // Secure by default in production, but can be disabled for local HTTP
    // previews via COOKIE_SECURE=false in .env.
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      username: String(payload.username ?? ""),
      fullName: String(payload.fullName ?? ""),
      avatarUrl: payload.avatarUrl ? String(payload.avatarUrl) : null,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Profile helpers (used by auth + protected routes)                    */
/* ------------------------------------------------------------------ */

/** Fetch the full profile row for the currently signed-in owner. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const session = await getSessionUser();
  if (!session) return null;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.id))
    .limit(1);
  return profile ?? null;
}

/**
 * Generates a unique, URL-safe username.
 * Tries the suggested base first, then appends a short random suffix.
 */
export async function generateUniqueUsername(
  base: string
): Promise<string> {
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
  const root = slug || "user";

  const existing = await db
    .select({ username: profiles.username })
    .from(profiles);
  const taken = new Set(existing.map((p) => p.username));

  if (!taken.has(root)) return root;

  for (let i = 0; i < 10; i++) {
    const candidate = `${root}${Math.floor(1000 + Math.random() * 9000)}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}${Date.now().toString(36)}`;
}
