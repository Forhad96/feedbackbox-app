import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

// Verify tables
const tables = (await pool.query(
  `select table_name from information_schema.tables
   where table_schema = 'public' and table_name in ('profiles','messages') order by table_name`
)).rows.map((r) => r.table_name);
console.log('Tables:', tables.join(', '));

// Verify demo account + password hash round-trips
const row = (await pool.query(
  `select id, username, email, full_name, provider, password_hash from profiles where email = $1`,
  ['demo@feedbackbox.test']
)).rows[0];
console.log('Demo account:', JSON.stringify({
  username: row.username, email: row.email, full_name: row.full_name, provider: row.provider,
}));

const ok = await bcrypt.compare('demo123456', row.password_hash);
console.log('Password check (demo123456):', ok ? 'PASS' : 'FAIL');

// Prove a message can be sent to the demo account (the app's core feature)
const m = await pool.query(
  `insert into messages (receiver_id, content) values ($1, $2)
   returning id, content, is_read, created_at`,
  [row.id, 'Hello demo! This is a test message.']
);
console.log('Message inserted:', JSON.stringify(m.rows[0]));

// And read it back
const got = await pool.query(
  `select content from messages where receiver_id = $1 order by created_at desc limit 1`,
  [row.id]
);
console.log('Message read back:', got.rows[0].content);

await pool.end();