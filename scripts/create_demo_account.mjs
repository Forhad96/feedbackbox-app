import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config(); // loads DATABASE_URL into process.env (never printed)

const DEMO = {
  fullName: 'Demo Tester',
  email: 'demo@feedbackbox.test',
  password: 'demo123456',
  username: 'demo',
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

// ---- 1) Ensure the app's Drizzle tables exist (src/db/schema.ts) ----
await pool.query(`
  create table if not exists profiles (
    id            uuid primary key default gen_random_uuid(),
    username      text not null,
    email         text not null,
    full_name     text not null default '',
    password_hash text,
    avatar_url    text,
    provider      text not null default 'email',
    created_at    timestamptz not null default now()
  );
  create unique index if not exists profiles_username_idx on profiles (username);
  create unique index if not exists profiles_email_idx on profiles (email);
`).catch((e) => { console.error('create profiles failed:', e.message); process.exit(1); });

await pool.query(`
  create table if not exists messages (
    id          uuid primary key default gen_random_uuid(),
    receiver_id uuid not null references profiles (id) on delete cascade,
    content     text not null,
    is_read     boolean not null default false,
    created_at  timestamptz not null default now()
  );
  create index if not exists messages_receiver_idx on messages (receiver_id);
`).catch((e) => { console.error('create messages failed:', e.message); process.exit(1); });

console.log('Tables ensured (profiles, messages).');

// ---- 2) Create demo account (mirror app's signup logic) ----
const base =
  DEMO.username ||
  DEMO.fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) ||
  DEMO.email.split('@')[0];

async function generateUniqueUsername(want) {
  let username = want;
  let i = 1;
  for (;;) {
    const r = await pool.query(
      'SELECT id FROM profiles WHERE username = $1 LIMIT 1',
      [username]
    );
    if (r.rowCount === 0) return username;
    username = `${want}${i}`;
    i++;
  }
}

const username = await generateUniqueUsername(base);

const e = await pool.query('SELECT id FROM profiles WHERE email = $1', [
  DEMO.email,
]);
if (e.rowCount > 0) {
  console.log('Email already registered.');
  const row = (
    await pool.query(
      'SELECT username, email, full_name, provider FROM profiles WHERE email = $1',
      [DEMO.email]
    )
  ).rows[0];
  console.log('Existing:', JSON.stringify(row));
} else {
  const passwordHash = await bcrypt.hash(DEMO.password, 10);
  const ins = await pool.query(
    `INSERT INTO profiles (username, email, full_name, password_hash, provider, created_at)
     VALUES ($1,$2,$3,$4,'email',now())
     RETURNING id, username, email, full_name, provider`,
    [username, DEMO.email, DEMO.fullName, passwordHash]
  );
  console.log('Created demo account:', JSON.stringify(ins.rows[0], null, 2));
}
await pool.end();