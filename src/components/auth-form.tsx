"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { Container } from "@/design-system";

export default function AuthForm({
  mode,
  googleEnabled,
  dict,
}: {
  mode: "login" | "signup";
  googleEnabled: boolean;
  dict: Dict["auth"];
}) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
    const payload = isSignup
      ? { fullName, username, email, password }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? dict.somethingWentWrong);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(dict.networkError);
      setLoading(false);
    }
  }

  return (
    <Container className="py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="card p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
          {isSignup ? dict.signupTitle : dict.loginTitle}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isSignup ? dict.signupSubtitle : dict.loginSubtitle}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {isSignup && (
            <Field label={dict.fullName}>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={dict.fullNamePlaceholder}
                className="input"
              />
            </Field>
          )}

          <Field label={dict.email}>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dict.emailPlaceholder}
              className="input"
            />
          </Field>

          {isSignup && (
            <Field label={dict.username} hint={dict.usernameHint}>
              <div className="flex items-center rounded-[var(--radius-control)] border border-neutral-300 bg-white focus-within:border-neutral-900">
                <span className="pl-3 text-sm text-neutral-400">/u/</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={dict.usernamePlaceholder}
                  className="w-full rounded-[var(--radius-control)] bg-transparent py-2.5 pr-3 outline-none"
                />
              </div>
            </Field>
          )}

          <Field label={dict.password}>
            <input
              required
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isSignup
                  ? dict.passwordSignupPlaceholder
                  : dict.passwordLoginPlaceholder
              }
              className="input"
            />
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            aria-busy={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" /> {dict.pleaseWait}
              </>
            ) : isSignup ? (
              dict.createAccount
            ) : (
              dict.logIn
            )}
          </button>
        </form>

        {googleEnabled && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
              <span className="h-px flex-1 bg-neutral-200" />
              {dict.or}
              <span className="h-px flex-1 bg-neutral-200" />
            </div>
            <a
              href="/api/auth/google"
              className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5"
            >
              <GoogleMark />
              {dict.continueWithGoogle}
            </a>
          </>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500">
          {isSignup ? (
            <>
              {dict.alreadyHaveAccount}{" "}
              <Link
                href="/login"
                className="font-medium text-neutral-900 underline-offset-2 hover:underline"
              >
                {dict.logInLink}
              </Link>
            </>
          ) : (
            <>
              {dict.newHere}{" "}
              <Link
                href="/signup"
                className="font-medium text-neutral-900 underline-offset-2 hover:underline"
              >
                {dict.createOne}
              </Link>
            </>
          )}
        </p>
      </div>
      </div>
    </Container>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-sm font-medium text-neutral-700">
        {label}
        {hint && <span className="font-normal text-neutral-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.1 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.8-9.7 6.8-17.4z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.3c-.5-1.5-.8-3-.8-4.8s.3-3.3.8-4.8l-7.9-6.1C1 16.3 0 20 0 24s1 7.7 2.6 10.4l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.3-5.7c-2 1.4-4.7 2.3-8.2 2.3-6.3 0-11.6-3.6-13.5-9.2l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}
