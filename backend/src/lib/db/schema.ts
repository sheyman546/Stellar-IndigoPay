import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const userStatusEnum = pgEnum("user_status", [
  "unverified",
  "active",
  "suspended",
]);

export const giftStatusEnum = pgEnum("gift_status", [
  "pending",
  "confirmed",
  "completed",
  "failed",
]);

export const txTypeEnum = pgEnum("tx_type", [
  "deposit",
  "withdrawal",
  "gift_receive",
]);

// ============================================================================
// TABLES
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    phoneNumber: text("phone_number"),
    username: text("username"),
    avatarUrl: text("avatar_url"),
    role: text("role").default("user").notNull(),
    status: userStatusEnum("status").default("unverified").notNull(),
    loginAttempts: integer("login_attempts").default(0).notNull(),
    lockUntil: timestamp("lock_until"),
    otpFailedAttempts: integer("otp_failed_attempts").default(0).notNull(),
    otpAttemptsWindowStart: timestamp("otp_attempts_window_start"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastLogin: timestamp("last_login"),
    lastOtpSentAt: timestamp("last_otp_sent_at"),
    isPhoneVerified: boolean("is_phone_verified").default(false).notNull(),
    phoneLast4: text("phone_last_4"),
  },
  (table) => [
    unique("users_phone_number_unique").on(table.phoneNumber),
    unique("users_email_unique").on(table.email),
    unique("users_username_unique").on(table.username),
    index("users_phone_number_idx").on(table.phoneNumber),
    index("users_status_idx").on(table.status),
    index("users_created_at_idx").on(table.createdAt),
  ]
);

export const emailVerifications = pgTable(
  "email_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    otpHash: text("otp_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
  },
  (table) => [
    index("ev_user_id_idx").on(table.userId),
    index("ev_expires_at_idx").on(table.expiresAt),
  ]
);

export const passwordResets = pgTable(
  "password_resets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usedAt: timestamp("used_at"),
    ipAddress: text("ip_address"),
  },
  (table) => [
    index("pr_user_id_idx").on(table.userId),
    index("pr_expires_at_idx").on(table.expiresAt),
  ]
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    deviceInfo: text("device_info"),
    deviceId: text("device_id"),
    fingerprint: text("fingerprint"),
  },
  (table) => [index("rt_user_id_idx").on(table.userId)]
);

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id)
      .unique(),
    balance: integer("balance").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("wallets_user_id_idx").on(table.userId)]
);

export const gifts = pgTable(
  "gifts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id),
    amount: integer("amount").notNull(),
    status: giftStatusEnum("status").default("pending").notNull(),
    unlockDatetime: timestamp("unlock_datetime").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("gifts_status_idx").on(table.status),
    index("gifts_unlock_datetime_idx").on(table.unlockDatetime),
  ]
);

export const transaction = pgTable(
  "transaction",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    amount: integer("amount").notNull(),
    type: txTypeEnum("type").notNull(),
    status: text("status").notNull(),
    referenceId: uuid("reference_id").notNull(), // Resolves back to specific gift id matching trigger
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("tx_user_id_idx").on(table.userId),
    index("tx_reference_id_idx").on(table.referenceId),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_is_read_idx").on(table.isRead),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  emailVerifications: many(emailVerifications),
  passwordResets: many(passwordResets),
  refreshTokens: many(refreshTokens),
  wallet: one(wallets),
  sentGifts: many(gifts, { relationName: "sentGifts" }),
  receivedGifts: many(gifts, { relationName: "receivedGifts" }),
  transactions: many(transaction),
  notifications: many(notifications),
}));

export const emailVerificationsRelations = relations(
  emailVerifications,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerifications.userId],
      references: [users.id],
    }),
  })
);

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const giftsRelations = relations(gifts, ({ one }) => ({
  sender: one(users, {
    fields: [gifts.senderId],
    references: [users.id],
    relationName: "sentGifts",
  }),
  recipient: one(users, {
    fields: [gifts.recipientId],
    references: [users.id],
    relationName: "receivedGifts",
  }),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  user: one(users, {
    fields: [transaction.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));