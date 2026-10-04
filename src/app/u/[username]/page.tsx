import { eq } from "drizzle-orm";
import { Search } from "lucide-react";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import MessageForm from "@/components/message-form";
import { getCurrentProfile } from "@/lib/auth";
import { SITE } from "@/lib/config";
import { getServerDictionary } from "@/lib/i18n/server";
import { Container } from "@/design-system";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const dict = await getServerDictionary();
  return {
    title: dict.messageForm.title.replace("{name}", `@${username}`),
    description: `Leave an anonymous message for ${username} on ${SITE.name}.`,
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const clean = username.trim().toLowerCase();
  const dict = await getServerDictionary();
  const profileT = dict.profile;
  const viewer = await getCurrentProfile();

  const [profile] = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles)
    .where(eq(profiles.username, clean))
    .limit(1);

  if (!profile) {
    return (
      <main className="text-center">
        <Container className="py-24">
          <div className="mx-auto max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-neutral-400">
                <Search className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                {profileT.notFoundTitle}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {profileT.notFoundBody.replace("{username}", `@${clean}`)}
              </p>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-950 text-lg font-semibold text-white">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            (profile.fullName || profile.username)
              .charAt(0)
              .toUpperCase()
          )}
        </div>
        <div>
          <p className="text-lg font-semibold text-neutral-900">
            {profile.fullName || profile.username}
          </p>
          <p className="text-sm text-neutral-500">@{profile.username}</p>
        </div>
      </div>

      <MessageForm username={profile.username} dict={dict.messageForm} />

      {(viewer?.id === profile.id || !viewer) && (
        <p className="mt-8 text-center text-xs text-neutral-400">
          {viewer?.id === profile.id ? (
            <a
              href="/dashboard"
              className="font-medium text-neutral-700 underline-offset-2 hover:underline"
            >
              {profileT.ownInboxLink}
            </a>
          ) : (
            <>
              {profileT.wantOwnBox}{" "}
              <a
                href="/signup"
                className="font-medium text-neutral-700 underline-offset-2 hover:underline"
              >
                {profileT.createFree.replace("{name}", SITE.name)}
              </a>
              .
            </>
          )}
        </p>
      )}
        </div>
      </Container>
    </main>
  );
}
