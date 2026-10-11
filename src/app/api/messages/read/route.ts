import { NextResponse } from "next/server";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { getCurrentProfile } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/**
 * OWNER-ONLY endpoint (RLS-equivalent enforcement at the data layer).
 * Only the authenticated owner may update their own messages.
 */
export async function POST(request: Request) {
  const dict = await getServerDictionary();
  const api = dict.api;
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: api.unauthorized }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const read = typeof body.read === "boolean" ? body.read : true;

    if (ids.length > 0) {
      await db
        .update(messages)
        .set({ isRead: read })
        .where(
          and(eq(messages.receiverId, profile.id), inArray(messages.id, ids))
        );
    } else {
      await db
        .update(messages)
        .set({ isRead: read })
        .where(eq(messages.receiverId, profile.id));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mark read error", err);
    return NextResponse.json(
      { error: api.updateFailed },
      { status: 500 }
    );
  }
}
