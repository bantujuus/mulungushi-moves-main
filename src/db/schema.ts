import {
  pgTable, text, integer, timestamp, boolean,
  pgEnum, uuid, index, primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ── Enums ─────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["staff", "transport", "security", "admin"]);
export const vehicleStatusEnum = pgEnum("vehicle_status", ["available", "in_use", "maintenance"]);
export const dispatchStatusEnum = pgEnum("dispatch_status", ["pending", "approved", "rejected", "completed"]);
export const directionEnum = pgEnum("direction", ["entry", "exit"]);
export const accountStatusEnum = pgEnum("account_status", ["pending", "approved", "rejected"]);
export const auditActionEnum = pgEnum("audit_action", [
  "register", "login", "logout",
  "approve_account", "reject_account",
  "assign_role", "deactivate_account", "reactivate_account",
]);

// ── 1. Users ──────────────────────────────────────────────
export const users = pgTable("users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName:     text("full_name").notNull(),
  role:         roleEnum("role").notNull().default("staff"),
  approved:     boolean("approved").notNull().default(false),
  status:       accountStatusEnum("status").notNull().default("pending"),
  approvedAt:   timestamp("approved_at"),
  approvedBy:   text("approved_by"),
  lastLoginAt:  timestamp("last_login_at"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("users_email_idx").on(t.email),
  index("users_role_idx").on(t.role),
  index("users_status_idx").on(t.status),
]);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ── 2. Vehicles ───────────────────────────────────────────
export const vehicles = pgTable("vehicles", {
  id:           uuid("id").primaryKey().defaultRandom(),
  registration: text("registration").notNull().unique(),
  make:         text("make").notNull(),
  model:        text("model").notNull(),
  capacity:     integer("capacity").notNull(),
  status:       vehicleStatusEnum("status").notNull().default("available"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("vehicles_status_idx").on(t.status),
  index("vehicles_registration_idx").on(t.registration),
]);

export const insertVehicleSchema = createInsertSchema(vehicles);
export const selectVehicleSchema = createSelectSchema(vehicles);
export type InsertVehicle = typeof vehicles.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;

// ── 3. Drivers ────────────────────────────────────────────
export const drivers = pgTable("drivers", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull(),
  license:   text("license").notNull().unique(),
  phone:     text("phone").notNull(),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("drivers_available_idx").on(t.available),
  index("drivers_license_idx").on(t.license),
]);

export const insertDriverSchema = createInsertSchema(drivers);
export const selectDriverSchema = createSelectSchema(drivers);
export type InsertDriver = typeof drivers.$inferInsert;
export type Driver = typeof drivers.$inferSelect;

// ── 4. Dispatch Requests ──────────────────────────────────
export const dispatchRequests = pgTable("dispatch_requests", {
  id:             uuid("id").primaryKey().defaultRandom(),
  requesterId:    uuid("requester_id").notNull().references(() => users.id),
  destination:    text("destination").notNull(),
  purpose:        text("purpose").notNull(),
  passengerCount: integer("passenger_count").notNull(),
  departureAt:    timestamp("departure_at").notNull(),
  returnAt:       timestamp("return_at"),
  status:         dispatchStatusEnum("status").notNull().default("pending"),
  reviewedBy:     uuid("reviewed_by").references(() => users.id),
  reviewedAt:     timestamp("reviewed_at"),
  notes:          text("notes"),
  vehicleId:      uuid("vehicle_id").references(() => vehicles.id),
  driverId:       uuid("driver_id").references(() => drivers.id),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("dispatch_requests_requester_idx").on(t.requesterId),
  index("dispatch_requests_status_idx").on(t.status),
  index("dispatch_requests_created_at_idx").on(t.createdAt),
  index("dispatch_requests_departure_at_idx").on(t.departureAt),
]);

export const insertDispatchRequestSchema = createInsertSchema(dispatchRequests);
export const selectDispatchRequestSchema = createSelectSchema(dispatchRequests);
export type InsertDispatchRequest = typeof dispatchRequests.$inferInsert;
export type DispatchRequest = typeof dispatchRequests.$inferSelect;

// ── 5. Dispatch Request Vehicles (join table) ─────────────
export const dispatchRequestVehicles = pgTable("dispatch_request_vehicles", {
  requestId:  uuid("request_id").notNull().references(() => dispatchRequests.id),
  vehicleId:  uuid("vehicle_id").notNull().references(() => vehicles.id),
  assignedBy: uuid("assigned_by").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.requestId, t.vehicleId] }),
  index("drv_request_idx").on(t.requestId),
  index("drv_vehicle_idx").on(t.vehicleId),
]);

export const insertDispatchRequestVehicleSchema = createInsertSchema(dispatchRequestVehicles);
export type InsertDispatchRequestVehicle = typeof dispatchRequestVehicles.$inferInsert;
export type DispatchRequestVehicle = typeof dispatchRequestVehicles.$inferSelect;

// ── 6. Gate Logs ──────────────────────────────────────────
export const gateLogs = pgTable("gate_logs", {
  id:        uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id),
  requestId: uuid("request_id").references(() => dispatchRequests.id),
  officerId: uuid("officer_id").notNull().references(() => users.id),
  direction: directionEnum("direction").notNull(),
  odometer:  integer("odometer"),
  notes:     text("notes"),
  loggedAt:  timestamp("logged_at").notNull().defaultNow(),
}, (t) => [
  index("gate_logs_vehicle_idx").on(t.vehicleId),
  index("gate_logs_request_idx").on(t.requestId),
  index("gate_logs_logged_at_idx").on(t.loggedAt),
  index("gate_logs_officer_idx").on(t.officerId),
]);

export const insertGateLogSchema = createInsertSchema(gateLogs);
export type InsertGateLog = typeof gateLogs.$inferInsert;
export type GateLog = typeof gateLogs.$inferSelect;

// ── Sessions ──────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("sessions_user_idx").on(t.userId),
  index("sessions_expires_idx").on(t.expiresAt),
]);

export const insertSessionSchema = createInsertSchema(sessions);
export type InsertSession = typeof sessions.$inferInsert;
export type Session = typeof sessions.$inferSelect;

// ── Audit Logs ────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").references(() => users.id),
  action:       auditActionEnum("action").notNull(),
  targetUserId: uuid("target_user_id"),
  detail:       text("detail"),
  ipAddress:    text("ip_address"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("audit_logs_user_idx").on(t.userId),
  index("audit_logs_action_idx").on(t.action),
  index("audit_logs_created_at_idx").on(t.createdAt),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;