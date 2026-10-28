# FeedbackBox 📥

> Anonymous feedback, made simple. Share a link, receive candid messages — no
> sign-up required for senders.

FeedbackBox is an open-source, anonymous feedback web app built with **Next.js
(App Router)**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL** (via
Drizzle ORM). It ships with full Supabase-compatible schema & RLS policies so
you can deploy it on Supabase in one click.

- 🌐 **Public page** — `/u/[username]` lets *anyone* send you an anonymous message.
- 🔐 **Owner auth** — Email/password + Google sign-in.
- 📊 **Protected dashboard** — `/dashboard` shows only *your* messages.
- 🛡️ **Privacy-first** — senders never authenticate; messages are owner-only.

---

## 📁 Folder structure

```
feedback-box/
├── supabase/
│   └── schema.sql              # Tables + RLS policies + signup trigger (Supabase)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── signup/route.ts         # POST create owner account
│   │   │   │   ├── login/route.ts          # POST email/password login
│   │   │   │   ├── logout/route.ts         # POST destroy session
│   │   │   │   ├── google/route.ts         # GET → Google OAuth consent
│   │   │   │   └── google/callback/route.ts# GET → Google OAuth callback
│   │   │   ├── messages/route.ts           # POST public anonymous message
│   │   │   ├── messages/read/route.ts      # POST owner-only mark-as-read
│   │   │   └── health/route.ts             # GET health check
│   │   ├── u/[username]/page.tsx           # Public anonymous submission page
│   │   ├── dashboard/page.tsx              # Protected owner dashboard
│   │   ├── login/page.tsx                  # Login screen
│   │   ├── signup/page.tsx                 # Sign-up screen
│   │   ├── layout.tsx                      # Root layout (nav + footer)
│   │   ├── page.tsx                        # Landing page
│   │   └── globals.css                     # Tailwind + component styles
│   ├── components/
│   │   ├── site-nav.tsx                    # Top navigation (session-aware)
│   │   ├── site-footer.tsx                 # Footer w/ social links
│   │   ├── auth-form.tsx                   # Login/Signup form (client)
│   │   ├── message-form.tsx                # Anonymous send form (client)
│   │   └── dashboard-client.tsx            # Dashboard interactions (client)
│   ├── db/
│   │   ├── index.ts                        # Drizzle client (pg Pool)
│   │   └── schema.ts                       # profiles + messages tables
│   └── lib/
│       ├── auth.ts                         # Sessions, password hashing, RLS-helpers
│       └── config.ts                       # Site info, socials, OAuth config
├── drizzle.config.json
├── next.config.ts
├── .env.example
└── README.md
```

---

## ⚙️ Tech stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router)                           |
| Language       | TypeScript                                        |
| Styling        | Tailwind CSS v4                                   |
| Database       | PostgreSQL (Drizzle ORM in this repo)             |
| Auth           | Session JWT (email/password) + Google OAuth        |
| Hosting target | Supabase (SQL in `supabase/schema.sql`)           |

> **Note on this repo:** The codebase is wired to run **locally against
> PostgreSQL via Drizzle ORM** (zero external services required). The data-layer
> access control faithfully reproduces Supabase RLS:
> - `messages` INSERT is open to anyone **only if** the `receiver_id` maps to a
>   real profile (see `src/app/api/messages/route.ts`).
> - `messages` / dashboard reads are gated on the authenticated owner
>   (`src/lib/auth.ts → getCurrentProfile`, `src/app/dashboard/page.tsx`).
>
> To run on **real Supabase**, apply `supabase/schema.sql` and point the client
> at your project — the schema, RLS, and trigger match the spec below.

---

## 🗄️ Database schema

```sql
-- profiles
id          uuid  primary key   -- references auth.users(id) on Supabase
username    text  unique not null
full_name   text
created_at  timestamp

-- messages
id          uuid  primary key default uuid_generate_v4()
receiver_id uuid  references profiles(id)
content     text  not null
is_read     boolean default false
created_at  timestamp default now()
```

Apply it with Supabase: open **SQL Editor → `supabase/schema.sql` → Run**.
For this local repo, tables are created with `npx drizzle-kit push` (see below).

---

## 🔐 Row Level Security (Supabase RLS)

```sql
alter table public.profiles  enable row level security;
alter table public.messages  enable row level security;

-- Public profile lookups (for /u/[username])
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

-- Anyone (anon) can insert a message for a VALID receiver
create policy "Anyone can send an anonymous message"
  on public.messages for insert
  with check ( exists (
    select 1 from public.profiles p where p.id = messages.receiver_id ) );

-- Only the owner can read their messages
create policy "Receiver can read their own messages"
  on public.messages for select
  using (auth.uid() = receiver_id);
```

The full file (including the auto-profile trigger on sign-up) lives in
[`supabase/schema.sql`](./supabase/schema.sql).

---

## 🚀 Step-by-step: run locally (Drizzle + Postgres)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill in:
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
   AUTH_SECRET=your-random-secret
   COOKIE_SECURE=false            # true in real HTTPS production
   # Optional Google OAuth:
   # GOOGLE_CLIENT_ID=...
   # GOOGLE_CLIENT_SECRET=...
   ```

3. **Push the schema**
   ```bash
   npx drizzle-kit push
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```

5. **Try it**
   - Sign up at `/signup` → you get a unique `/u/yourname` link.
   - Open `/u/yourname` in a private window → send an anonymous message.
   - Return to `/dashboard` → your message appears (owner-only).

---

## 🌐 Step-by-step: deploy on Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (tables + RLS + trigger).
3. **Authentication → Providers**: enable Email and Google. For Google, set
   `GOOGLE_REDIRECT_URI` to
   `<your-site>/api/auth/google/callback` (or use Supabase Auth's own provider
   and adapt `src/lib/auth.ts`).
4. In **Project Settings → API**, copy the URL + anon key. Wire your
   `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_ANON_KEY` (or keep the Drizzle client
   and connect Supabase's Postgres directly via the connection string).
5. Deploy the Next.js app (Vercel, Fly, etc.). Set `AUTH_SECRET`,
   `COOKIE_SECURE=true`, and Google OAuth vars.

---

## 🔑 Key endpoints

| Method | Path                          | Auth        | Purpose                          |
| ------ | ----------------------------- | ----------- | -------------------------------- |
| POST   | `/api/auth/signup`            | public      | Create owner + auto username     |
| POST   | `/api/auth/login`             | public      | Email/password login             |
| POST   | `/api/auth/logout`            | owner       | Destroy session                  |
| GET    | `/api/auth/google`            | public      | Start Google OAuth               |
| GET    | `/api/auth/google/callback`   | public      | Finish Google OAuth              |
| POST   | `/api/messages`               | public      | Anonymous message insert         |
| POST   | `/api/messages/read`          | owner-only  | Mark messages read               |
| GET    | `/api/health`                 | public      | Health check                     |

---

## 👤 Author & links

- **GitHub (open source):** https://github.com/forhadhossin/feedback-box
- **Developer:** Forhad Hossin
  - Facebook: https://facebook.com/forhadhossin _(placeholder)_
  - LinkedIn: https://linkedin.com/in/forhadhossin _(placeholder)_

## 📜 License

MIT — free to use, modify, and self-host.
