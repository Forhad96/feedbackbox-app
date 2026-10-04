"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { MESSAGE_MAX_LENGTH } from "@/lib/config";
import type { Dict } from "@/lib/i18n";

export default function MessageForm({
  username,
  dict,
}: {
  username: string;
  dict: Dict["messageForm"];
}) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending" || content.trim().length === 0) return;
    setError(null);
    setStatus("sending");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? dict.couldNotSend);
        setStatus("error");
        return;
      }
      setStatus("sent");
      setContent("");
    } catch {
      setError(dict.networkError);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-neutral-950 text-white">
          <Check className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">
          {dict.sentTitle}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          {dict.sentBody.replace("{name}", username)}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="btn-secondary mt-6 px-5 py-2.5"
        >
          {dict.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <label
        htmlFor="anon-message"
        className="block text-base font-semibold text-neutral-900"
      >
        {dict.title.replace("{name}", `@${username}`)}
      </label>
      <p className="mt-1 text-sm text-neutral-500">{dict.subtitle}</p>

      <textarea
        id="anon-message"
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
        rows={6}
        placeholder={dict.placeholder}
        className="input mt-4 resize-none"
        aria-invalid={status === "error"}
      />

      <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
        <span>{error && <span className="text-red-600">{error}</span>}</span>
        <span className="tabular-nums">
          {content.length}/{MESSAGE_MAX_LENGTH}
        </span>
      </div>

      <button
        type="submit"
        aria-busy={status === "sending"}
        className="btn-primary mt-3 w-full py-3"
      >
        {status === "sending" ? (
          <>
            <span className="spinner" aria-hidden="true" /> {dict.sending}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> {dict.sendAnonymously}
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-neutral-400">
        {dict.hostedBy}
      </p>
    </form>
  );
}
