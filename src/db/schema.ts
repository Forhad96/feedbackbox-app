import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Profiles
 * ----------
 * Mirrors the Supabase `profiles` table from the spec.
 * In a real Supabase project `id` would reference `auth.users(id)`.
 * Here we use our own generated UUID as the owner identity and store the
 * credentials / auth provider used to sign up.
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull().default(""),
    passwordHash: text("password_hash"),
    avatarUrl: text("avatar_url"),
    provider: text("provider").notNull().default("email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("profiles_username_idx").on(table.username),
    emailIdx: uniqueIndex("profiles_email_idx").on(table.email),
  })
);

/**
 * Messages
 * ----------
 * Anonymous messages sent to a profile owner.
 * `receiver_id` references `profiles.id`.
 */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    receiverIdx: index("messages_receiver_idx").on(table.receiverId),
  })
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
