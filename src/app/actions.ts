"use server";

import { cookies } from "next/headers";
import { COOKIE_NAME, isLang } from "@/lib/i18n";

const YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Server action called by the nav language switcher. Sets the `lang` cookie
 * (path-wide so it applies to every page) and lets the caller `router.refresh()`
 * to re-render server components in the new language.
 */
export async function setLanguage(lang: string): Promise<void> {
  if (!isLang(lang)) return;
  const store = await cookies();
  store.set(COOKIE_NAME, lang, {
    path: "/",
    maxAge: YEAR_SECONDS,
    sameSite: "lax",
  });
}