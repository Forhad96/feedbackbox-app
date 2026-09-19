import { cookies, headers } from "next/headers";
import {
  COOKIE_NAME,
  DEFAULT_LANG,
  isLang,
  getDictionary,
  type Lang,
  type Dict,
} from "./index";

/**
 * Resolves the active language for a server context (server components and
 * API route handlers).
 *
 * Precedence:
 *   1. A `lang` cookie set by the user's manual toggle (override wins).
 *   2. The browser's `Accept-Language` header — Bengali browsers get Bangla,
 *      everything else falls back to the app default.
 *   3. The app default: Bangla.
 */
export async function getServerLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  if (isLang(cookie)) return cookie;

  const headerList = await headers();
  const acceptLanguage = headerList.get("accept-language") ?? "";
  const prefersBengali = /(^|,)\s*bn([-,;]|$)/i.test(acceptLanguage);
  if (prefersBengali) return "bn";

  // An explicit English preference means the visitor should see English;
  // Bangla is the fallback default when there's no language signal at all.
  const prefersEnglish = /(^|,)\s*en([-,;]|$)/i.test(acceptLanguage);
  return prefersEnglish ? "en" : DEFAULT_LANG;
}

export async function getServerDictionary(): Promise<Dict> {
  const lang = await getServerLang();
  return getDictionary(lang);
}