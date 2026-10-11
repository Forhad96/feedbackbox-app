"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  LogOut,
  Inbox,
  Link2,
  Search,
  Trash2,
  CheckCheck,
  MailOpen,
  Mail,
} from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { Container } from "@/design-system";

export type DashboardMessage = {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

function timeAgo(iso: string, dict: Dict["common"]["timeAgo"]): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return dict.justNow;
  if (mins < 60) return dict.minutesAgo.replace("{n}", String(mins));
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return dict.hoursAgo.replace("{n}", String(hrs));
  const days = Math.floor(hrs / 24);
  if (days < 30)
    return days === 1
      ? dict.daysAgo.replace("{n}", String(days))
      : dict.daysAgoPlural.replace("{n}", String(days));
  return new Date(iso).toLocaleDateString();
}

const PAGE_SIZE = 15;

type Filter = "all" | "unread" | "read";
type Sort = "newest" | "oldest";

export default function DashboardClient({
  username,
  fullName,
  initialMessages,
  dict,
  timeAgoDict,
}: {
  username: string;
  fullName: string;
  initialMessages: DashboardMessage[];
  dict: Dict["dashboard"];
  timeAgoDict: Dict["common"]["timeAgo"];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [copied, setCopied] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [bulkPending, setBulkPending] = useState<
    null | "read" | "unread" | "delete"
  >(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [singlePending, setSinglePending] = useState<
    | { id: string; action: "read" | "unread" | "delete" }
    | null
  >(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectAllRef = useRef<HTMLInputElement>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${username}`
      : `/u/${username}`;

  const unread = messages.filter((m) => !m.isRead).length;
  const readCount = messages.length - unread;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = messages;
    if (filter === "unread") list = list.filter((m) => !m.isRead);
    if (filter === "read") list = list.filter((m) => m.isRead);
    if (q) list = list.filter((m) => m.content.toLowerCase().includes(q));
    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });
    return sorted;
  }, [messages, filter, query, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selected.size > 0 && selected.size < filtered.length;
    }
  }, [selected, filtered]);

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  async function markAllRead() {
    const res = await fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    }
  }

  async function handleLogout() {
    if (logoutPending) return;
    setLogoutPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmDelete(false);
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((m) => m.id)));
    }
    setConfirmDelete(false);
  }

  async function bulkMarkRead(read: boolean) {
    if (selected.size === 0) return;
    setBulkPending(read ? "read" : "unread");
    setActionError(null);
    const res = await fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], read }),
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) =>
          selected.has(m.id) ? { ...m, isRead: read } : m
        )
      );
      setSelected(new Set());
      setConfirmDelete(false);
    } else {
      setActionError(dict.updating);
    }
    setBulkPending(null);
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBulkPending("delete");
    setActionError(null);
    const res = await fetch("/api/messages/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => !selected.has(m.id)));
      setSelected(new Set());
      setConfirmDelete(false);
    } else {
      setActionError(dict.deleting);
    }
    setBulkPending(null);
  }

  async function toggleReadSingle(m: DashboardMessage) {
    setSinglePending({ id: m.id, action: m.isRead ? "unread" : "read" });
    setActionError(null);
    setDeleteTargetId(null);
    const next = !m.isRead;
    const res = await fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [m.id], read: next }),
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, isRead: next } : x))
      );
    } else {
      setActionError(dict.updating);
    }
    setSinglePending(null);
  }

  async function deleteSingle(id: string) {
    if (deleteTargetId !== id) {
      setDeleteTargetId(id);
      return;
    }
    setSinglePending({ id, action: "delete" });
    setActionError(null);
    const res = await fetch("/api/messages/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeleteTargetId(null);
    } else {
      setActionError(dict.deleting);
    }
    setSinglePending(null);
  }

  const messageLabel =
    messages.length === 1
      ? dict.messageCount.replace("{count}", String(messages.length))
      : dict.messageCountPlural.replace("{count}", String(messages.length));
  const unreadLabel = dict.unreadCount.replace("{count}", String(unread));

  const selectedLabel = dict.selectedCount.replace(
    "{count}",
    String(selected.size)
  );

  return (
    <main>
      <Container className="py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-neutral-950 text-base font-semibold text-white">
            {(fullName || username).charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
              {fullName
                ? dict.greeting.replace("{name}", fullName)
                : dict.yourDashboard}
            </h1>
            <p className="text-sm text-neutral-500">
              @{username} · {messageLabel} · {unreadLabel}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          aria-busy={logoutPending}
          className="btn-secondary px-4 py-2"
        >
          {logoutPending ? (
            <>
              <span className="spinner" aria-hidden="true" /> {dict.loggingOut}
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" /> {dict.logOut}
            </>
          )}
        </button>
      </div>

      <section className="card mt-6 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <Link2 className="h-4 w-4 text-neutral-400" />
          {dict.yourShareLink}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={shareUrl}
            aria-label="Your shareable link"
            className="input flex-1 bg-neutral-50"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            onClick={copyLink}
            className="btn-primary px-5 py-2.5"
            aria-live="polite"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> {dict.copied}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> {dict.copyLink}
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-400">{dict.shareLinkHint}</p>
      </section>

      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="eyebrow">{dict.inbox}</h2>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-sm font-medium text-neutral-700 hover:underline"
              >
                {dict.markAllRead}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder={dict.searchPlaceholder}
              className="input pl-9"
              aria-label={dict.searchPlaceholder}
            />
          </div>
          <div
            className="flex items-center gap-1 rounded-full bg-neutral-100 p-1"
            role="group"
            aria-label={dict.sortBy}
          >
            <button
              type="button"
              onClick={() => {
                setSort("newest");
                setVisibleCount(PAGE_SIZE);
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                sort === "newest"
                  ? "bg-white text-neutral-950 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              aria-pressed={sort === "newest"}
            >
              {dict.sortNewest}
            </button>
            <button
              type="button"
              onClick={() => {
                setSort("oldest");
                setVisibleCount(PAGE_SIZE);
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                sort === "oldest"
                  ? "bg-white text-neutral-950 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              aria-pressed={sort === "oldest"}
            >
              {dict.sortOldest}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: "all", label: dict.filterAll, count: messages.length },
              { key: "unread", label: dict.filterUnread, count: unread },
              { key: "read", label: dict.filterRead, count: readCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
              aria-pressed={filter === tab.key}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  filter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="card flex flex-wrap items-center gap-2 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={
                  filtered.length > 0 && selected.size === filtered.length
                }
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-neutral-300"
                aria-label={dict.selectAll}
              />
              {selectedLabel}
            </label>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                onClick={() => bulkMarkRead(true)}
                disabled={bulkPending !== null}
                className="btn-secondary px-3 py-1.5 text-sm"
              >
                {bulkPending === "read" ? (
                  <>
                    <span className="spinner" aria-hidden="true" />{" "}
                    {dict.updating}
                  </>
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4" /> {dict.markSelectedRead}
                  </>
                )}
              </button>
              <button
                onClick={() => bulkMarkRead(false)}
                disabled={bulkPending !== null}
                className="btn-secondary px-3 py-1.5 text-sm"
              >
                {bulkPending === "unread" ? (
                  <>
                    <span className="spinner" aria-hidden="true" />{" "}
                    {dict.updating}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" /> {dict.markSelectedUnread}
                  </>
                )}
              </button>
              {confirmDelete ? (
                <>
                  <button
                    onClick={bulkDelete}
                    disabled={bulkPending !== null}
                    className="btn-danger px-3 py-1.5 text-sm"
                  >
                    {bulkPending === "delete" ? (
                      <>
                        <span className="spinner" aria-hidden="true" />{" "}
                        {dict.deleting}
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" /> {dict.confirmDelete}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="btn-ghost px-3 py-1.5 text-sm"
                  >
                    {dict.cancel}
                  </button>
                </>
              ) : (
                <button
                  onClick={bulkDelete}
                  disabled={bulkPending !== null}
                  className="btn-danger px-3 py-1.5 text-sm"
                >
                  <Trash2 className="h-4 w-4" /> {dict.deleteSelected}
                </button>
              )}
              <button
                onClick={() => {
                  setSelected(new Set());
                  setConfirmDelete(false);
                }}
                className="btn-ghost px-3 py-1.5 text-sm"
              >
                {dict.clearSelection}
              </button>
            </div>
          </div>
        )}

        {actionError && (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {actionError}
          </p>
        )}

        {messages.length === 0 ? (
          <div className="mt-4 flex min-h-[40vh] flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-neutral-300 bg-white p-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-neutral-400">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="mt-4 font-medium text-neutral-800">
              {dict.noMessagesTitle}
            </p>
            <p className="mt-1 max-w-xs text-sm text-neutral-500">
              {dict.noMessagesBody}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4 flex min-h-[30vh] flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-neutral-300 bg-white p-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-neutral-400">
              <Search className="h-6 w-6" />
            </div>
            <p className="mt-4 font-medium text-neutral-800">
              {dict.noResultsTitle}
            </p>
            <p className="mt-1 max-w-xs text-sm text-neutral-500">
              {dict.noResultsBody}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>
                {dict.showingCount
                  .replace("{shown}", String(visible.length))
                  .replace("{total}", String(filtered.length))}
              </span>
              {filtered.length > 0 && selected.size === 0 && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-neutral-300"
                    aria-label={dict.selectAll}
                  />
                  {dict.selectAll}
                </label>
              )}
            </div>
            <ul className="space-y-2">
              {visible.map((m) => {
                const isSelected = selected.has(m.id);
                return (
                  <li
                    key={m.id}
                    className={`card p-3 transition-colors ${
                      isSelected
                        ? "ring-2 ring-[var(--color-accent)]"
                        : m.isRead
                        ? ""
                        : "bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(m.id)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300"
                        aria-label={dict.selectAll}
                      />
                      {!m.isRead && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]"
                          aria-label={dict.unreadLabel}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
                          {m.content}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-neutral-400">
                            {timeAgo(m.createdAt, timeAgoDict)}
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleReadSingle(m)}
                              disabled={
                                (singlePending?.id === m.id &&
                                  singlePending.action !== "delete") ||
                                bulkPending !== null
                              }
                              className="text-xs font-medium text-neutral-600 hover:underline disabled:opacity-50"
                            >
                              {singlePending?.id === m.id &&
                              singlePending.action !== "delete" ? (
                                <span className="spinner" aria-hidden="true" />
                              ) : m.isRead ? (
                                <>
                                  <Mail className="mr-1 inline h-3.5 w-3.5" />
                                  {dict.markUnread}
                                </>
                              ) : (
                                <>
                                  <MailOpen className="mr-1 inline h-3.5 w-3.5" />
                                  {dict.markRead}
                                </>
                              )}
                            </button>
                            {deleteTargetId === m.id ? (
                              <>
                                <button
                                  onClick={() => deleteSingle(m.id)}
                                  disabled={
                                    singlePending?.id === m.id ||
                                    bulkPending !== null
                                  }
                                  className="text-xs font-medium text-[var(--color-danger)] hover:underline disabled:opacity-50"
                                >
                                  {singlePending?.id === m.id &&
                                  singlePending.action === "delete" ? (
                                    <span
                                      className="spinner"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <>
                                      <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                                      {dict.confirmDelete}
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => setDeleteTargetId(null)}
                                  disabled={bulkPending !== null}
                                  className="text-xs text-neutral-500 hover:underline disabled:opacity-50"
                                >
                                  {dict.cancel}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setDeleteTargetId(m.id);
                                  setConfirmDelete(false);
                                }}
                                disabled={
                                  (singlePending?.id === m.id &&
                                    singlePending.action !== "delete") ||
                                  bulkPending !== null
                                }
                                aria-label={dict.deleteMessage}
                                title={dict.deleteMessage}
                                className="text-xs font-medium text-neutral-500 hover:text-[var(--color-danger)] hover:underline disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  {dict.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </Container>
    </main>
  );
}
