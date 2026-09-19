import en from "./en.json";
import bn from "./bn.json";

/**
 * Bilingual i18n — Bangla (primary) + English.
 *
 * The English dictionary is the canonical shape. `Dict` is derived from it,
 * and the module-scope guard below makes the build fail if `bn.json` ever
 * misses or renames a key. No third-party library is used.
 */

export const COOKIE_NAME = "lang";
export const DEFAULT_LANG = "bn";
export const LANGS = ["bn", "en"] as const;

export type Lang = (typeof LANGS)[number];

export type Dict = typeof en;

// Compile-time guard: bn.json must match en.json's shape exactly.
const _bnMatchesEn: Dict = bn;

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

export function getDictionary(lang: Lang): Dict {
  return lang === "en" ? en : bn;
}