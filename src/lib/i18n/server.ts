import { cookies } from "next/headers";
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
 *   2. The app default: Bangla (so every new visitor sees Bangla first).
 */
export async function getServerLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  if (isLang(cookie)) return cookie;

  return DEFAULT_LANG;
}

export async function getServerDictionary(): Promise<Dict> {
  const lang = await getServerLang();
  return getDictionary(lang);
}