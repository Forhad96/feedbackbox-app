import Link from "next/link";
import {
  ShieldCheck,
  Link2,
  Inbox,
  Code2,
  ArrowRight,
  UserPlus,
  Send,
  UserX,
  Lock,
  Trash2,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { SITE } from "@/lib/config";
import { getServerLang } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { Container } from "@/design-system";

export const dynamic = "force-dynamic";

const stepIcons = [UserPlus, Link2, Inbox];
const featureIcons = [ShieldCheck, Link2, Inbox, Code2];
const privacyIcons = [UserX, Lock, Trash2, Code2];

export default async function HomePage() {
  const user = await getSessionUser();
  const lang = await getServerLang();
  const dict = getDictionary(lang);
  const home = dict.home;

  const steps = home.steps.map((s, i) => ({
    icon: stepIcons[i],
    title: s.title,
    body: s.body,
  }));

  const features = home.features.map((f, i) => ({
    icon: featureIcons[i],
    title: f.title,
    body: f.body,
  }));

  const privacyPoints = home.privacy.points.map((p, i) => ({
    icon: privacyIcons[i],
    title: p.title,
    body: p.body,
  }));

  return (
    <main>
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="eyebrow">{home.eyebrow}</span>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
            {home.heroTitle1}
            <br />
            {home.heroTitle2}
          </h1>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-neutral-600">
            {home.heroBody}
          </p>
          <p className="mt-3 max-w-prose text-base leading-relaxed text-neutral-500">
            {home.heroBody2}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link href="/dashboard" className="btn-primary px-5 py-3">
                {home.goToDashboard} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/signup" className="btn-primary px-5 py-3">
                  {home.createYourBox} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn-secondary px-5 py-3">
                  {home.logIn}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Product mock — a static, realistic preview (pointer-events off) */}
        <div className="relative">
          <div className="card overflow-hidden p-0 shadow-sm">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3 text-sm text-neutral-500">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              feedbackbox.app/u/forhad
            </div>
            <div className="p-6" aria-hidden="true">
              <p className="text-base font-semibold text-neutral-900">
                {home.mockSendTo}{" "}
                <span className="text-neutral-950">@forhad</span>
              </p>
              <div className="mt-3 min-h-[7rem] rounded-[var(--radius-control)] border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500">
                {home.mockSample}
              </div>
              <div className="btn-primary mt-4 w-full py-3">
                <Send className="h-4 w-4" /> {home.sendAnonymously}
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0" />
        </div>
        </Container>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-neutral-200 bg-white py-16">
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
            {home.howTitle}
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neutral-950 text-white">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="mt-3 text-sm font-semibold tabular-nums text-neutral-300">
                    0{i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-16">
        <Container>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
          {home.featuresTitle}
        </h2>
        <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-900">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>
        </Container>
      </section>

      {/* Privacy & security */}
      <section
        id="privacy"
        className="border-y border-neutral-200 bg-neutral-50 py-16"
      >
        <Container>
          <span className="eyebrow">{home.privacy.eyebrow}</span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            {home.privacy.title}
          </h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-neutral-600">
            {home.privacy.subtitle}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {privacyPoints.map((p) => (
              <div key={p.title} className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-neutral-950 text-white">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-neutral-900">{p.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="pb-20">
        <Container>
          <div className="rounded-[var(--radius-card)] bg-neutral-950 px-8 py-14 text-center text-white">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {home.ctaTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-300">
            {home.ctaBody}
          </p>
          <Link
            href={user ? "/dashboard" : "/signup"}
            className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-white px-6 py-3 font-medium text-neutral-950 transition-colors hover:bg-neutral-100"
          >
            {user ? home.ctaOpen : home.ctaStart}{" "}
            <ArrowRight className="h-4 w-4" />
          </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
