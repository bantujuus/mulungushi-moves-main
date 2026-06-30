import { pgTable, text, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["staff", "transport", "security", "admin"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected", "dispatched", "returned"]);
export const vehicleStatusEnum = pgEnum("vehicle_status", ["available", "in-use", "maintenance"]);
export const directionEnum = pgEnum("direction", ["exit", "entry"]);
export const accountStatusEnum = pgEnum("account_status", ["pending", "approved", "rejected"]);
export const auditActionEnum = pgEnum("audit_action", [
  "register", "login", "logout", "approve_account", "reject_account",
  "assign_role", "deactivate_account", "reactivate_account"
]);

// ── Users ─────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("staff"),
  status: accountStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
  lastLoginAt: timestamp("last_login_at"),
});

// ── Sessions ──────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Audit Logs ────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
  targetUserId: text("target_user_id"),
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
});

// ── Vehicles ──────────────────────────────────────────────
export const vehicles = pgTable("vehicles", {
  id: text("id").primaryKey(),
  plate: text("plate").notNull().unique(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  capacity: integer("capacity").notNull(),
  status: vehicleStatusEnum("status").notNull().default("available"),
});

// ── Drivers ───────────────────────────────────────────────
export const drivers = pgTable("drivers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  license: text("license").notNull().unique(),
  phone: text("phone").notNull(),
  available: boolean("available").notNull().default(true),
});

// ── Vehicle Requests ──────────────────────────────────────
export const vehicleRequests = pgTable("vehicle_requests", {
  id: text("id").primaryKey(),
  requesterName: text("requester_name").notNull(),
  department: text("department").notNull(),
  purpose: text("purpose").notNull(),
  destination: text("destination").notNull(),
  passengers: integer("passengers").notNull(),
  departAt: timestamp("depart_at").notNull(),
  returnAt: timestamp("return_at").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  vehicleId: text("vehicle_id").references(() => vehicles.id),
  driverId: text("driver_id").references(() => drivers.id),
  approverNote: text("approver_note"),
  approvedAt: timestamp("approved_at"),
  userId: text("user_id").references(() => users.id),
});

// ── Gate Logs ─────────────────────────────────────────────
export const gateLogs = pgTable("gate_logs", {
  id: text("id").primaryKey(),
  vehiclePlate: text("vehicle_plate").notNull(),
  driverName: text("driver_name").notNull(),
  direction: directionEnum("direction").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  officer: text("officer").notNull(),
  requestId: text("request_id").references(() => vehicleRequests.id),
  odometer: integer("odometer"),
  note: text("note"),
});