import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, messages } from "@/db/schema";
import { MESSAGE_MAX_LENGTH, MESSAGE_MIN_LENGTH } from "@/lib/config";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/**
 * PUBLIC endpoint — no authentication required.
 * Anyone can leave an anonymous message for a valid receiver (username).
 *
 * This mirrors the Supabase RLS policy:
 *   "Allow anyone (anon) to INSERT where receiver_id matches a valid profile."
 */
export async function POST(request: Request) {
  try {
    const dict = await getServerDictionary();
    const api = dict.api;
    const body = await request.json();
    const username = String(body.username ?? "").trim().toLowerCase();
    const content = String(body.content ?? "").trim();

    if (!username) {
      return NextResponse.json(
        { error: api.recipientRequired },
        { status: 400 }
      );
    }
    if (
      content.length < MESSAGE_MIN_LENGTH ||
      content.length > MESSAGE_MAX_LENGTH
    ) {
      return NextResponse.json(
        {
          error: api.messageLength
            .replace("{min}", String(MESSAGE_MIN_LENGTH))
            .replace("{max}", String(MESSAGE_MAX_LENGTH)),
        },
        { status: 400 }
      );
    }

    const [receiver] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.username, username))
      .limit(1);

    if (!receiver) {
      return NextResponse.json(
        { error: api.linkInvalid },
        { status: 404 }
      );
    }

    await db.insert(messages).values({
      receiverId: receiver.id,
      content,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("message submit error", err);
    const dict = await getServerDictionary();
    return NextResponse.json(
      { error: dict.api.sendFailed },
      { status: 500 }
    );
  }
}
