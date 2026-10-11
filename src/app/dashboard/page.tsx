import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { getCurrentProfile } from "@/lib/auth";
import DashboardClient, {
  type DashboardMessage,
} from "@/components/dashboard-client";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // RLS-equivalent: only an authenticated owner may view this page.
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const dict = await getServerDictionary();

  const rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.receiverId, profile.id))
    .orderBy(desc(messages.createdAt));

  const initialMessages: DashboardMessage[] = rows.map((m) => ({
    id: m.id,
    content: m.content,
    isRead: m.isRead,
    createdAt: (m.createdAt as Date).toISOString(),
  }));

  return (
    <DashboardClient
      username={profile.username}
      fullName={profile.fullName}
      initialMessages={initialMessages}
      dict={dict.dashboard}
      timeAgoDict={dict.common.timeAgo}
    />
  );
}
