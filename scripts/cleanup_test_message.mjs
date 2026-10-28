import { Pool } from 'pg';
import { config } from 'dotenv';
config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const r = await pool.query(
  `delete from messages
   where receiver_id = (select id from profiles where email = $1)
   and content = 'Hello demo! This is a test message.'`,
  ['demo@feedbackbox.test']
);
console.log('Cleaned up test message(s):', r.rowCount);
await pool.end();