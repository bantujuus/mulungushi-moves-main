# Mulungushi Moves

**Digital Fleet & Gate Management System for Mulungushi University**

> *Pursuing the frontiers of knowledge*

Mulungushi Moves replaces the campus gate logbook with a real-time digital platform. Staff request vehicles, Transport Officers approve and assign them, and Security verifies every movement at the gate — all timestamped, auditable, and searchable from a single system.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Seeding the Database](#seeding-the-database)
- [User Roles](#user-roles)
- [Key Workflows](#key-workflows)
- [API Structure](#api-structure)
- [Design System](#design-system)
- [Scripts](#scripts)
- [Known Constraints](#known-constraints)
- [Author](#author)

---

## Overview

Mulungushi Moves is an internship capstone project developed during an industrial attachment at Mulungushi University's ICT Department. The system digitalises the university's vehicle dispatch and gate management process, replacing paper logbooks with a role-based web application backed by a PostgreSQL database.

The system supports four distinct user roles, each with a dedicated dashboard and access controls enforced both on the client and server.

---

## Features

### Authentication & Authorization
- User registration with admin approval workflow
- Password hashing with bcryptjs (cost factor 12)
- Session-based authentication stored in the database
- Role-Based Access Control (RBAC) — staff, transport, security, admin
- Full audit log of all account actions (register, login, logout, approve, reject, role change)

### Staff Portal
- Submit vehicle dispatch requests with trip details
- Track request status in real time (polling every 5 seconds)
- View full request history with search and status filters
- Click through to a detailed request view showing vehicle, driver, and gate log history

### Transport Office
- Review, approve, and reject dispatch requests
- Assign available vehicles and drivers on approval
- Manage the fleet (add, edit, delete vehicles)
- Manage drivers (add, edit, delete)
- Pending request badge with live count in the sidebar

### Security Gate
- Log vehicle exits and entries
- "Vehicles Currently Out" panel showing all dispatched trips awaiting return
- Link gate logs to approved requests for full trip traceability
- Capture odometer readings on return
- Live gate log history with direction, date, and search filters

### Admin Dashboard
- System-wide statistics (requests, vehicles, drivers, gate logs)
- Recharts analytics: weekly request volume, fleet utilisation, peak dispatch hours
- User management — approve/reject registrations, assign roles
- Audit log with action and detail search filters
- Operational reports with date range filtering
- Export to Excel (multi-sheet: requests, gate logs, fleet) and PDF

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React 19, SSR) |
| Routing | TanStack Router (file-based) |
| Data Fetching | TanStack Query v5 |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM + drizzle-zod |
| Auth | bcryptjs + session tokens |
| Styling | Tailwind CSS v4 + custom design system (inline styles) |
| UI Components | shadcn/ui + Radix UI primitives |
| Charts | Recharts |
| Icons | Lucide React |
| Export | ExcelJS + PDFKit |
| Runtime / Package Manager | Bun |
| Build Tool | Vite 7 + Nitro |

---

## Project Structure

```
mulungushi-moves-main/
├── public/
│   ├── mu-crest.png          # University crest (used in landing + sidebar)
│   └── mu-gate.jpg           # Gate photo (hero background)
├── src/
│   ├── components/
│   │   └── app-shell.tsx     # Sidebar, header, StatusBadge, DirectionBadge, SectionHeader
│   ├── db/
│   │   ├── index.ts          # Drizzle client with connection pooling
│   │   ├── schema.ts         # All table definitions, enums, indexes, zod schemas
│   │   ├── seed.ts           # Vehicles and drivers seed data
│   │   └── seed-admin.ts     # Admin account seed
│   ├── lib/
│   │   ├── auth.tsx          # AuthContext — session state, login/logout
│   │   └── api/
│   │       ├── auth.ts       # Auth server functions (register, login, logout, user management)
│   │       ├── vehicles.ts   # Read server functions (getVehicles, getRequests, etc.)
│   │       ├── mutations.ts  # Write server functions (createRequest, approveRequest, logGate, etc.)
│   │       ├── analytics.ts  # Analytics aggregation server functions
│   │       ├── reports.ts    # Date-filtered report data
│   │       └── export.ts     # Excel and PDF export server functions
│   ├── routes/
│   │   ├── index.tsx         # Landing page (hero, sign in/register modal)
│   │   ├── staff.tsx         # Staff — request list and submission
│   │   ├── transport.tsx     # Transport — requests, fleet, drivers
│   │   ├── security.tsx      # Security — gate log and exit/return logging
│   │   ├── admin.tsx         # Admin — dashboard and charts
│   │   ├── admin.users.tsx   # Admin — user management
│   │   ├── admin.reports.tsx # Admin — reports and exports
│   │   ├── admin.vehicles.tsx
│   │   ├── admin.drivers.tsx
│   │   ├── security.logs.tsx
│   │   ├── requests.$requestId.tsx  # Request detail page
│   │   └── __root.tsx        # Root layout — QueryClient + AuthProvider
│   ├── router.tsx            # TanStack Router configuration
│   └── styles.css            # Tailwind + CSS custom properties
├── drizzle.config.ts         # Drizzle Kit configuration
├── vite.config.ts            # Vite + TanStack Start configuration
└── .env                      # Environment variables (not committed)
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.3 or later
- A [Supabase](https://supabase.com) project (free tier is sufficient)
- Node.js v20+ (used internally by Bun for some tooling)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mulungushi-moves.git
cd mulungushi-moves

# Install dependencies
bun install
```

### Development

```bash
bun dev
```

The app will be available at `http://localhost:8080`.

> **Windows note:** If you see `EPERM: operation not permitted` errors from Vite, add the project folder to Windows Defender exclusions, or set a custom cache directory in `vite.config.ts`:
> ```ts
> vite: { cacheDir: "C:/vite-cache/mulungushi-moves" }
> ```

---

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@[host]:6543/postgres
```

Use the **connection pooler URL** (port `6543`, not `5432`) from your Supabase project's Connect page. If your password contains special characters, URL-encode them (e.g. `#` → `%23`).

---

## Database Setup

Since direct PostgreSQL connections (port 5432) may be blocked on some networks, schema changes are applied manually via the **Supabase SQL Editor**.

The full schema SQL can be found in the comments of `src/db/schema.ts`. Run the schema SQL in your Supabase SQL Editor to create all tables, enums, and indexes.

### Schema Overview

| Table | Description |
|---|---|
| `users` | Registered users with role, approval status, and password hash |
| `sessions` | Active login sessions with expiry |
| `vehicles` | University fleet vehicles |
| `drivers` | Employed drivers (separate from system users) |
| `dispatch_requests` | Vehicle dispatch requests from staff |
| `dispatch_request_vehicles` | Join table linking requests to assigned vehicles |
| `gate_logs` | Security gate entry/exit records |
| `audit_logs` | Immutable log of all account-level actions |

All primary keys use UUIDs (`gen_random_uuid()`). Indexes are defined on all frequently filtered columns.

---

## Seeding the Database

### Create the admin account

```bash
bunx tsx src/db/seed-admin.ts
```

Default credentials:
**1) ADMIN**
- **Email:** `admin@mulungushi.ac.zm`
- **Password:** `Admin@1234`

**2) TRANSPORT OFFICER**
- **Email:** `transport@mulungushi.ac.zm`
- **Password:** `Transport@m1234`

**3) STAFF**
-  **Email:** `staff@mulungushi.ac.zm`
-   **Password:** `Staff@1234`

**4) SECURITY OFFICER**
-   **Email:** `security@mulungushi.ac.zm`
-    **Password:** `Security@1234`

> Change the password immediately after first login.

### Seed vehicles and drivers

```bash
bunx tsx src/db/seed.ts
```

This seeds 4 vehicles (Toyota Hiace, Land Cruiser, Nissan Hardbody, Toyota Coaster) and 3 drivers.

---

## User Roles

| Role | Access |
|---|---|
| **Staff** | Submit dispatch requests, track own request history |
| **Transport Officer** | Approve/reject requests, assign vehicles and drivers, manage fleet |
| **Security** | Log gate exits and returns, view gate log history |
| **Admin** | Full access — user management, analytics, reports, all of the above |

New users register on the landing page and remain in **pending** status until an administrator approves them and assigns a role.

---

## Key Workflows

### Dispatch Lifecycle

```
Staff submits request (pending)
        ↓
Transport Officer reviews
        ↓
   Approved → vehicle + driver assigned
        ↓
Security logs EXIT at gate (dispatched)
        ↓
Vehicle returns → Security logs ENTRY
        ↓
   Request marked COMPLETED
   Vehicle and driver marked available
```

### Account Lifecycle

```
User registers (pending)
        ↓
Admin reviews in User Management
        ↓
   Approved → role assigned → user can log in
   Rejected → user sees rejection message on login
```

---

## API Structure

Server functions are defined in `src/lib/api/` and called directly from React components using TanStack Start's `createServerFn`. All database access happens server-side; no raw SQL is exposed to the client.

### Read functions (`vehicles.ts`)
- `getVehicles` — all vehicles
- `getDrivers` — all drivers
- `getRequests` — all dispatch requests
- `getMyRequests({ userId })` — requests scoped to the logged-in user
- `getGateLogs` — all gate logs
- `getRequestById({ id })` — single request with vehicle, driver, and gate logs

### Write functions (`mutations.ts`)
- `createRequest` — submit a new dispatch request
- `approveRequest` — approve with vehicle + driver assignment
- `rejectRequest` — reject with a reason note
- `logGate` — record a vehicle exit or entry
- `addVehicle`, `updateVehicle`, `deleteVehicle`
- `addDriver`, `updateDriver`, `deleteDriver`

### Auth functions (`auth.ts`)
- `registerUser`, `loginUser`, `logoutUser`, `validateSession`
- `getAllUsers`, `approveUser`, `rejectUser`, `updateUserRole`
- `getAuditLogs`

---

## Design System

The UI follows a custom design specification based on the Mulungushi University brand identity.

**Primary Palette**

| Token | Hex | Usage |
|---|---|---|
| Deep Navy | `#0b1830` | Sidebar, buttons, headings |
| Amber Gold | `#d4a843` | Active nav, accents, highlights |
| Warm Off-White | `#f5f6f8` | Page background |
| White | `#ffffff` | Card surfaces |

**Status Badge Colors**

| Status | Background | Text |
|---|---|---|
| Pending | `#fffbeb` | `#d97706` |
| Approved | `#ecfdf5` | `#047857` |
| Rejected | `#fef2f2` | `#dc2626` |
| Dispatched | `rgba(11,24,48,0.08)` | `#0b1830` |
| Completed | `#f3f4f6` | `#6b7280` |

**Direction Badges**

- **EXIT** — navy background (`#0b1830`), gold text (`#d4a843`) with ↑ arrow
- **ENTRY** — green background (`#d1fae5`), dark green text with ↓ arrow

**Typography**
- Body: Inter
- Headings / display: Plus Jakarta Sans

---

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start development server |
| `bun build` | Production build |
| `bunx tsx src/db/seed-admin.ts` | Seed admin account |
| `bunx tsx src/db/seed.ts` | Seed vehicles and drivers |
| `bunx drizzle-kit push --config=drizzle.config.ts` | Push schema to database (requires direct connection) |

---

## Known Constraints

- **Port 5432 blocked on campus networks** — schema changes are applied via the Supabase SQL Editor rather than `drizzle-kit push`. The app runtime uses the connection pooler (port 6543).
- **No email notifications** — status change notifications are in-app only (real-time polling at 5-second intervals).
- **No password reset flow** — users must contact an administrator to reset a password.
- **Single Supabase project** — for a production deployment, the university would need its own Supabase organisation and database instance.
- **Windows EPERM issue** — Vite's dep optimizer can conflict with Windows Defender on the `node_modules/.vite` folder. Adding a custom `cacheDir` outside the project resolves this.

---

## Author

**Given Nkonde**
Student No. 202307227
School of Engineering and Technology — ICT Department
Mulungushi University, Zambia

Industrial Attachment — ICT Directorate, Mulungushi University
Academic Year 2025/2026

---

*Digital Fleet & Gate Management System — Mulungushi Moves*
*© 2026 Mulungushi University. All Rights Reserved.*
