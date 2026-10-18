"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setLanguage } from "@/app/actions";
import type { Lang } from "@/lib/i18n";

const LABELS: Record<Lang, string> = {
  bn: "বাংলা",
  en: "English",
};

export default function LanguageSwitcher({
  current,
  ariaLabel,
}: {
  current: Lang;
  ariaLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Lang) {
    if (next === current || isPending) return;
    startTransition(async () => {
      await setLanguage(next);
      router.refresh();
    });
  }

  return (
    <div
      className="inline-flex items-center gap-2"
      role="group"
      aria-label={ariaLabel}
    >
      <Languages className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1">
        {(["bn", "en"] as Lang[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => switchTo(lang)}
            disabled={isPending}
            aria-pressed={current === lang}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
              current === lang
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {isPending && current !== lang ? (
              <span className="spinner inline-block h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              LABELS[lang]
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
