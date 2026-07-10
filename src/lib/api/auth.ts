import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { users, sessions, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// ── Register ──────────────────────────────────────────────
export const registerUser = createServerFn({ method: "POST" }).handler(async ({ data }: {
  data: { name: string; email: string; password: string }
}) => {
  const existing = await db.select().from(users).where(eq(users.email, data.email.toLowerCase()));
  if (existing.length > 0) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(data.password, 12);
  const [user] = await db.insert(users).values({
    email: data.email.toLowerCase(),
    passwordHash,
    fullName: data.name,
    role: "staff",
    status: "pending",
    approved: false,
  }).returning();

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "register",
    detail: `New registration: ${user.email}`,
  });

  return { success: true, message: "Registration submitted. Await admin approval." };
});

// ── Login ─────────────────────────────────────────────────
export const loginUser = createServerFn({ method: "POST" }).handler(async ({ data }: {
  data: { email: string; password: string }
}) => {
  const [user] = await db.select().from(users).where(eq(users.email, data.email.toLowerCase()));

  if (!user) throw new Error("Invalid email or password");
  if (user.status === "pending") throw new Error("PENDING: Your account is awaiting admin approval.");
  if (user.status === "rejected") throw new Error("REJECTED: Your account has been rejected. Contact the administrator.");

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  const [session] = await db.insert(sessions).values({
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  }).returning();

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "login",
    detail: `User logged in: ${user.email}`,
  });

  return {
    sessionId: session.id,
    user: { id: user.id, name: user.fullName, email: user.email, role: user.role },
  };
});

// ── Logout ────────────────────────────────────────────────
export const logoutUser = createServerFn({ method: "POST" }).handler(async ({ data }: {
  data: { sessionId: string; userId: string }
}) => {
  await db.delete(sessions).where(eq(sessions.id, data.sessionId));
  await db.insert(auditLogs).values({
    userId: data.userId,
    action: "logout",
    detail: "User logged out",
  });
  return { success: true };
});

// ── Validate Session ──────────────────────────────────────
export const validateSession = createServerFn({ method: "GET" }).handler(async ({ data }: {
  data: { sessionId: string }
}) => {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, data.sessionId));
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, data.sessionId));
    return null;
  }
  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user || user.status !== "approved") return null;
  return { id: user.id, name: user.fullName, email: user.email, role: user.role };
});

// ── Admin: Get all users ──────────────────────────────────
export const getAllUsers = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select({
    id: users.id, name: users.fullName, email: users.email,
    role: users.role, status: users.status,
    createdAt: users.createdAt, approvedAt: users.approvedAt,
    lastLoginAt: users.lastLoginAt,
  }).from(users).orderBy(users.createdAt);
});

// ── Admin: Approve user ───────────────────────────────────
export const approveUser = createServerFn({ method: "POST" }).handler(async ({ data }: {
  data: { userId: string; adminId: string; role: string }
}) => {
  const [user] = await db.update(users).set({
    status: "approved",
    approved: true,
    role: data.role as any,
    approvedAt: new Date(),
    approvedBy: data.adminId,
  }).where(eq(users.id, data.userId)).returning();

  await db.insert(auditLogs).values({
    userId: data.adminId,
    action: "approve_account",
    targetUserId: data.userId,
    detail: `Approved: ${user.email}, role: ${data.role}`,
  });

  return { ...user, name: user.fullName };
});

// ── Admin: Reject user ────────────────────────────────────
export const rejectUser = createServerFn({ method: "POST" }).handler(async ({ data }: {
  data: { userId: string; adminId: string }
}) => {
  const [user] = await db.update(users).set({ status: "rejected", approved: false })
    .where(eq(users.id, data.userId)).returning();

  await db.insert(auditLogs).values({
    userId: data.adminId,
    action: "reject_account",
    targetUserId: data.userId,
    detail: `Rejected: ${user.email}`,
  });

  return { ...user, name: user.fullName };
});

// ── Admin: Update user role ───────────────────────────────
export const updateUserRole = createServerFn({ method: "POST" }).handler(async ({ data }: {
  data: { userId: string; adminId: string; role: string }
}) => {
  const [user] = await db.update(users).set({ role: data.role as any })
    .where(eq(users.id, data.userId)).returning();

  await db.insert(auditLogs).values({
    userId: data.adminId,
    action: "assign_role",
    targetUserId: data.userId,
    detail: `Role updated to: ${data.role} for ${user.email}`,
  });

  return { ...user, name: user.fullName };
});

// ── Admin: Get audit logs ─────────────────────────────────
export const getAuditLogs = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(auditLogs).orderBy(auditLogs.createdAt);
});