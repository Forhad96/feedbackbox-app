import { NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { getCurrentProfile } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

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

    if (ids.length === 0) {
      return NextResponse.json({ error: api.updateFailed }, { status: 400 });
    }

    await db
      .delete(messages)
      .where(
        and(eq(messages.receiverId, profile.id), inArray(messages.id, ids))
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete messages error", err);
    return NextResponse.json({ error: api.deleteFailed }, { status: 500 });
  }
}
