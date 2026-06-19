"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokensRelations = exports.passwordResetsRelations = exports.emailVerificationsRelations = exports.usersRelations = exports.refreshTokens = exports.passwordResets = exports.emailVerifications = exports.users = exports.userStatusEnum = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
exports.userStatusEnum = (0, pg_core_1.pgEnum)("user_status", [
    "unverified",
    "active",
    "suspended",
]);
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    email: (0, pg_core_1.text)("email").notNull(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    name: (0, pg_core_1.text)("name"),
    phoneNumber: (0, pg_core_1.text)("phone_number"),
    username: (0, pg_core_1.text)("username"),
    avatarUrl: (0, pg_core_1.text)("avatar_url"),
    role: (0, pg_core_1.text)("role").default("user").notNull(),
    status: (0, exports.userStatusEnum)("status").default("unverified").notNull(),
    loginAttempts: (0, pg_core_1.integer)("login_attempts").default(0).notNull(),
    lockUntil: (0, pg_core_1.timestamp)("lock_until"),
    otpFailedAttempts: (0, pg_core_1.integer)("otp_failed_attempts").default(0).notNull(),
    otpAttemptsWindowStart: (0, pg_core_1.timestamp)("otp_attempts_window_start"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
    lastLogin: (0, pg_core_1.timestamp)("last_login"),
    lastOtpSentAt: (0, pg_core_1.timestamp)("last_otp_sent_at"),
    isPhoneVerified: (0, pg_core_1.boolean)("is_phone_verified").default(false).notNull(),
    phoneLast4: (0, pg_core_1.text)("phone_last_4"),
}, (table) => {
    return [
        (0, pg_core_1.unique)("users_phone_number_unique").on(table.phoneNumber),
        (0, pg_core_1.unique)("users_email_unique").on(table.email),
        (0, pg_core_1.unique)("users_username_unique").on(table.username),
        (0, pg_core_1.index)("users_phone_number_idx").on(table.phoneNumber),
        (0, pg_core_1.index)("users_status_idx").on(table.status),
        (0, pg_core_1.index)("users_created_at_idx").on(table.createdAt),
    ];
});
exports.emailVerifications = (0, pg_core_1.pgTable)("email_verifications", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id),
    otpHash: (0, pg_core_1.text)("otp_hash").notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    attempts: (0, pg_core_1.integer)("attempts").default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    isUsed: (0, pg_core_1.boolean)("is_used").default(false).notNull(),
}, (table) => {
    return [
        (0, pg_core_1.index)("ev_user_id_idx").on(table.userId),
        (0, pg_core_1.index)("ev_expires_at_idx").on(table.expiresAt),
    ];
});
exports.passwordResets = (0, pg_core_1.pgTable)("password_resets", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id),
    token: (0, pg_core_1.text)("token").notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    usedAt: (0, pg_core_1.timestamp)("used_at"),
    ipAddress: (0, pg_core_1.text)("ip_address"),
}, (table) => {
    return [
        (0, pg_core_1.index)("pr_user_id_idx").on(table.userId),
        (0, pg_core_1.index)("pr_expires_at_idx").on(table.expiresAt),
    ];
});
exports.refreshTokens = (0, pg_core_1.pgTable)("refresh_tokens", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id),
    token: (0, pg_core_1.text)("token").notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    revokedAt: (0, pg_core_1.timestamp)("revoked_at"),
    deviceInfo: (0, pg_core_1.text)("device_info"),
    deviceId: (0, pg_core_1.text)("device_id"),
    fingerprint: (0, pg_core_1.text)("fingerprint"),
}, (table) => {
    return [(0, pg_core_1.index)("rt_user_id_idx").on(table.userId)];
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    emailVerifications: many(exports.emailVerifications),
    passwordResets: many(exports.passwordResets),
    refreshTokens: many(exports.refreshTokens),
}));
exports.emailVerificationsRelations = (0, drizzle_orm_1.relations)(exports.emailVerifications, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.emailVerifications.userId],
        references: [exports.users.id],
    }),
}));
exports.passwordResetsRelations = (0, drizzle_orm_1.relations)(exports.passwordResets, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.passwordResets.userId],
        references: [exports.users.id],
    }),
}));
exports.refreshTokensRelations = (0, drizzle_orm_1.relations)(exports.refreshTokens, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.refreshTokens.userId],
        references: [exports.users.id],
    }),
}));
