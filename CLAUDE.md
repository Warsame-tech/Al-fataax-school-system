# Al Fataax — Education Management System

This file is the primary source of truth for understanding and safely extending this codebase. It reflects the actual code as of this writing (traced from source, not assumed from filenames). Keep it updated when the architecture changes.

## Project Overview

Al Fataax is a madrasa (Islamic education) management system for a network of masjids (mosques). It tracks:

- Masjids ("Buildings" internally) and the students, GUDOOMIYE KUXIGEEN (coordinators), and teachers-were-here-but-removed associated with them
- Students, their multi-stage educational enrollment, and their results
- A curriculum hierarchy: **Fans** (subject areas) → **Religious Books** ("Subjects" internally) → assigned to **Educational Stages** ("Classes" internally)
- Per-subject exam marks, rolled up into per-stage totals/averages/grades — **never combined across stages**
- Role-specific reporting for four user roles: Admin, GUDOOMIYE, GUDOOMIYE KUXIGEEN (coordinator), Student
- A student-approval workflow (pending → accepted) reviewed by GUDOOMIYE
- Admin password recovery via emailed OTP

It is a single-tenant internal tool (one deployment, one madrasa), not a multi-tenant SaaS product.

## Technology Stack

**Backend** (`server/`)
- Node.js + Express 5
- MySQL/MariaDB via Sequelize 6 ORM (`mysql2` driver)
- Authentication: JWT (`jsonwebtoken`) in an httpOnly cookie, session cookie (no `maxAge` — cleared when the browser closes)
- Password hashing: `bcryptjs`
- Validation: `express-validator`
- Rate limiting: `express-rate-limit`
- Security headers: `helmet`
- Email: `nodemailer` (Gmail SMTP)
- Dev: `nodemon`

**Frontend** (`client/`)
- React 19 + Vite (React Compiler plugin via `@vitejs/plugin-react`)
- React Router 7
- Tailwind CSS 4 (`@tailwindcss/vite`, CSS-first `@theme` config — no `tailwind.config.js`)
- `axios` for HTTP
- `react-hot-toast` for notifications
- `html2canvas` + `jspdf` for client-side PDF export of reports
- Lint: `oxlint`

**Repo shape**: npm workspaces monorepo (root `package.json` lists `client` and `server` as workspaces; a single root `node_modules`/`package-lock.json` is hoisted). `npm run dev` at the root runs both dev servers concurrently (via `concurrently`).

## Folder Structure

```text
Al Fataax/
├── package.json              # npm workspaces root (client + server), `npm run dev` runs both
├── CLAUDE.md                 # this file
├── backups/                  # gitignored — pre-migration SQL data snapshots
├── server/
│   ├── server.js             # entrypoint: connects DB, sequelize.sync(), app.listen()
│   ├── .env / .env.example   # server config (gitignored except .env.example)
│   ├── scripts/               # one-off migration scripts, numbered 001-009, run manually
│   │                           #   node server/scripts/00X-name.js
│   └── src/
│       ├── app.js            # Express app: middleware, route mounting, 404, error handler
│       ├── config/
│       │   ├── db.js         # Sequelize instance
│       │   └── env.js        # reads/validates process.env, exports typed config
│       ├── models/           # Sequelize model definitions + models/index.js (associations)
│       ├── controllers/      # one file per resource, business logic lives here
│       ├── routes/           # one file per resource, wires auth + role gates + validators
│       ├── middleware/       # authenticate, authorizeRoles, scoping helpers, rate limiters
│       ├── validators/       # express-validator chains, one file per resource
│       ├── utils/            # jwt, cookieOptions, mailer, gradeCalculator, scoping, asyncHandler
│       └── seed/seedAdmin.js # one-time: creates the first admin user with a random password
└── client/
    ├── vite.config.js        # dev server proxies /api → http://localhost:5000
    └── src/
        ├── App.jsx           # all routes + role-based route guards live here
        ├── main.jsx          # React root, wraps App in AuthProvider/ThemeProvider
        ├── api/               # one thin axios wrapper per backend resource
        ├── pages/             # route-level components (see "Frontend Routes" below)
        │   ├── registrations/ # admin/coordinator CRUD pages (masjids, students, users, ...)
        │   ├── results/       # results registration (admin) + View Results (all roles)
        │   ├── reports/       # admin-facing report pages (also reused by coordinator/gudoomiye)
        │   └── gudoomiye/     # GUDOOMIYE-only report/approval pages
        ├── components/
        │   ├── common/        # generic UI primitives (FormField, SelectField, DataTable, Modal, ...)
        │   ├── layout/        # DashboardLayout, Sidebar (role-aware nav), Topbar
        │   ├── auth/           # ProtectedRoute (role-gated route wrapper)
        │   ├── results/        # ResultsMarksheet.jsx — shared marksheet renderers (see below)
        │   └── reports/        # ReportDocument/ReportToolbar — shared report banner + print/PDF
        ├── context/            # AuthContext, ThemeContext
        ├── hooks/              # useAuth, useSessionTimeout, useDataSync, useDebounce, useTheme
        ├── utils/              # dataSync (cross-tab auto-refresh bus), gradeUtils, exportPdf, sessionSync
        └── config/session.js   # IDLE_TIMEOUT_MS / HEARTBEAT_INTERVAL_MS — must match server JWT_EXPIRES_IN
```

## Database Schema & Relationships

All models are in `server/src/models/*.js`, wired together in `server/src/models/index.js`. Table names differ from model names in a few places (noted below) — this is intentional: internal code/model names (`Class`, `Subject`) were kept stable through a UI relabeling to "Educational Stage" / "Religious Book" rather than renaming everything.

| Model | Table | Key columns | Notes |
|---|---|---|---|
| `Building` | `Masjids` | `id`, `name`, `resultsVisible` (bool, default true) | A masjid. `resultsVisible` is the per-masjid results ON/OFF toggle. |
| `Fan` | `fans` | `id`, `name_ar` (unique) | Subject area, e.g. "Fiqh". |
| `Class` | `educational_stages` | `id`, `name_ar` | An educational stage. |
| `Subject` | `religious_books` | `id`, `name_ar`, `fanId` | A religious book, belongs to one `Fan`. |
| `Student` | `Students` | `id` (STRING(30), PK — **not auto-increment**), `name`, `gender` (ENUM Male/Female), `buildingId`, `registrationStatus` (ENUM pending/accepted, default pending) | `id` is admin-typed alphanumeric (letters/digits/hyphens, 3-30 chars) — see "Student ID" below. |
| `Coordinator` | `Coordinators` (default) | `id`, `name`, `buildingId` | A GUDOOMIYE KUXIGEEN directory entry, tied to one masjid. |
| `User` | `Users` | `id`, `username` (unique), `email` (nullable, unique), `name`, `passwordHash`, `userType` (ENUM admin/student/coordinator/gudoomiye), `studentId` (nullable FK), `coordinatorId` (nullable FK) | Login account. `defaultScope` excludes `passwordHash`; use `.scope('withPassword')` to include it. |
| `Result` | `Results` | `id`, `studentId`, `subjectId`, `marks` (DECIMAL 5,2, 0-100) | Unique on `(studentId, subjectId)` — one mark per book per student. **No `stageId` column** (see below). |
| `StudentStage` | `student_stage_registrations` | `id`, `studentId` (`student_id`), `classId` (`stage_id`) | Join table for the Student↔Class many-to-many. Unique on `(student_id, stage_id)`. |
| `PasswordResetOtp` | `password_reset_otps` | `id`, `userId`, `otpHash`, `expiresAt`, `attempts`, `verified` (bool), `passwordResetAt` (nullable) | One row per issued OTP. Never stores the plaintext code. |
| (junction, no model) | `stage_religious_books` | `stage_id`, `book_id` | Class↔Subject many-to-many. **A book belongs to exactly one stage in practice** — this is the app-enforced rule that lets results be attributed to a stage without a `stageId` column on `Result` (see `resultController.getStageBookIds`). |

**Key relationships** (from `models/index.js`):
- `Building 1—N Student`, `Building 1—N Coordinator` (`onDelete: RESTRICT`)
- `Class N—N Student` through `StudentStage` (alias `Stages` both directions) — **a student can be enrolled in multiple stages simultaneously**, replacing an earlier single-`classId` design
- `Fan 1—N Subject`, `Class N—N Subject` through `stage_religious_books`
- `Student 1—1 User`, `Coordinator 1—1 User` (`onDelete: RESTRICT` — can't delete a Student/Coordinator while a User still links to it)
- `Student 1—N Result` (`onDelete: CASCADE`), `Subject 1—N Result` (`onDelete: RESTRICT`)
- `User 1—N PasswordResetOtp` (`onDelete: CASCADE`)

**Schema evolution**: `sequelize.sync()` runs on every server boot (see `server.js`) and creates new tables/columns, but **does not** reliably alter existing columns, add FKs for `through` associations, or backfill data. Real schema changes (column type changes, FK addition, data backfills) go through one-off scripts in `server/scripts/`, numbered sequentially, each run manually once (`node server/scripts/00X-name.js`) and safe to re-run (they check current state first). **Follow this same pattern for any future schema change** — do not hand-edit the live DB, and do not assume `sync()` alone will apply a change to an existing table.

Existing migration history (in order): `resultsVisible` → GUDOOMIYE role added → `Student.id` converted from auto-increment integer to string PK (cascading to `Result`/`User`) → multi-stage enrollment backfilled from the old single `classId` (which was then dropped) → FK constraints added for the `through` table → `ON UPDATE CASCADE` added so a Student ID can be renamed → Teacher role/table fully removed → `registrationStatus` added (existing students backfilled to `accepted`) → Forgot Password (`Users.email` + `password_reset_otps`).

## Authentication & Session Management

- Login (`POST /api/auth/login`) verifies `username`/`password` (bcrypt), signs a JWT (`server/src/utils/jwt.js`), and sets it as an httpOnly cookie (`server/src/utils/cookieOptions.js`).
- **The cookie has no `maxAge`/`expires`** — it's a true browser session cookie, discarded when the browser closes. This is deliberate: closing and reopening the browser must always require signing in again.
- **Idle timeout** is enforced independently by the JWT's own `exp` claim (`JWT_EXPIRES_IN`, currently `60s`). `server/src/middleware/authenticate.js` verifies the token on every request and does **not** silently extend it. The **only** thing that extends a session is `POST /api/auth/heartbeat`, which the frontend calls (throttled) in response to genuine mouse/keyboard/click/scroll/touch activity (`client/src/hooks/useSessionTimeout.js`) — background/auto-refresh API calls never count as activity. `client/src/config/session.js`'s `IDLE_TIMEOUT_MS` must stay equal to the server's `JWT_EXPIRES_IN`, or the client and server idle clocks drift apart.
- Activity/logout are broadcast across tabs (`client/src/utils/sessionSync.js`) via a `BroadcastChannel`-based bus, so one tab going idle or logging out affects every open tab immediately.
- `GET /api/auth/me` returns the current user (used on app boot to restore session state); `login`'s response returns the same shape (both include a coordinator's `buildingId` resolved server-side).

## Roles & Permissions

Four `userType` values exist: `admin`, `gudoomiye`, `coordinator` (labeled "GUDOOMIYE KUXIGEEN" everywhere in the UI — the DB/JWT value stays `coordinator`), `student`. **There is no `teacher` role** — it was fully removed (model, controller, routes, UI, DB column/table all deleted; see migration `007-remove-teachers.js`).

Role gating happens at **both** layers — the frontend (`ProtectedRoute`, `Sidebar`) hides what a role shouldn't see, and the backend (`authorizeRoles(...roles)` middleware on every route) is the actual enforcement. Never trust the frontend gate alone when adding a new endpoint.

| Role | Scope | Can do |
|---|---|---|
| **admin** | System-wide, unrestricted | Everything: full CRUD on masjids, fans, books, stages, students, coordinators, users; results registration; all reports; results-visibility toggle per masjid. |
| **gudoomiye** ("GUDOOMIYE") | System-wide, **read + one narrow write** | Views students/results/stats across every masjid (masjid-by-masjid, gender-filtered, all-madrasa). The **only** mutation it can perform anywhere is accepting a pending student (`PATCH /api/gudoomiye/reports/students/:id/accept`) — never edits name/gender/masjid/stage, never deletes. No admin-level editing. Also gets read access to the admin Dashboard summary and several admin list/report endpoints (widened deliberately — see `authorizeRoles` calls across routes). |
| **coordinator** ("GUDOOMIYE KUXIGEEN") | **Locked to their own assigned masjid**, resolved server-side via `ownBuildingId(req.user)` (`server/src/utils/scoping.js`) | Registers/edits/deletes students **only within their own masjid** (enforced in `studentController` regardless of what a request body/query sends); views results for their own masjid (`resultController.getAll`/`getByClass`/`search` all hard-lock `buildingId`); has two masjid-locked reports (All Students, All Students Results — no masjid picker in the UI, and the backend ignores any `buildingId` sent). Cannot view or select another masjid's data through the UI **or** a direct API call — this is verified server-side, not just hidden client-side. |
| **student** | Their own record only | Views only their own results (`scopeStudentToSelf` middleware overwrites any `:studentId` param with the caller's own linked ID), gated additionally by their masjid's `resultsVisible` toggle. Picks which of their stages to view if enrolled in more than one. No write access anywhere. |

**Masjid scoping mechanism** (`server/src/utils/scoping.js`): `BUILDING_SCOPED_ROLES = new Set(['coordinator'])`; `ownBuildingId(user)` returns the coordinator's `buildingId` (resolved at login/heartbeat time from their linked `Coordinator` row and embedded in the JWT) or `null` for every other role. This single function is the one place that decision is made — reused by `scopeToOwnBuilding` middleware, `studentController`, `resultController`, `reportController`, and `buildingController`. **When adding a new masjid-sensitive endpoint, reuse `ownBuildingId`, never re-derive the rule.**

A `User` links to exactly one of `studentId` / `coordinatorId` (or neither, for admin/gudoomiye) — enforced by `userController.validateLinkage`. A student's `username` is always server-derived from their linked `Student.id`, never trusted from the request body.

## Key Business Rules

- **Student ID is a real, meaningful identifier, not a surrogate key.** It's admin-typed, alphanumeric with hyphens (3-30 chars, pattern `/^[A-Za-z0-9_-]+$/`), and doubles as the student's login `username`. Renaming it goes through a dedicated transactional endpoint (`PUT /api/students/:id/rename`) that cascades to `Results.studentId`, `Users.studentId`/`username`, and `student_stage_registrations` (via DB-level `ON UPDATE CASCADE`, added in migration `006`) — never edit `Student.id` as a plain field update.
- **A student can be enrolled in multiple educational stages at once**, tracked in `student_stage_registrations`. **Results must never be combined across stages.** Every results view groups by stage and computes total/average/grade per stage independently (`resultController.buildStudentStageSheet`, `getByClass`, `getAll`). A religious book belongs to exactly one stage (`stage_religious_books`), and that book→stage mapping is the *only* source of truth for "which stage does this mark belong to" — `Result` deliberately has no `stageId` column, to avoid a second copy of that fact drifting out of sync.
- **Results visibility toggle** (`Building.resultsVisible`): when off, a **student's own self-view** (`GET /api/results/student/:studentId` as a student) is blocked with a 403 explaining why. Admin/coordinator/gudoomiye access to the same data is unaffected by the toggle — it only gates the student's own view.
- **Grouped results UI**: any results table that could show the same student more than once (multi-stage) uses `GroupedStudentResultsMarksheet` (`client/src/components/results/ResultsMarksheet.jsx`) — **one row per student**, with a "+ View Results" toggle that expands to one `StageResultBlock` per stage. `MultiStudentMarksheet` (one row per student-per-stage) is still used only where a student can't appear twice by construction (a single masjid+stage already selected). Never reintroduce a flat one-row-per-(student,stage) table for a view that can span multiple stages.
- **Marks below 50 render in red** everywhere a mark is displayed or entered — via `marksTextClass()` / `isFailingMarks()` in `client/src/utils/gradeUtils.js`. Applies to Total/Average is *not* included (only individual subject marks).
- **Student approval workflow**: new students default to `registrationStatus: 'pending'` (Sequelize model default). GUDOOMIYE's "New Registered Students" report is a hard filter on `pending`; accepting (the one mutation GUDOOMIYE can do) flips the flag to `accepted` — the row is **never deleted**. All pre-existing students were backfilled to `accepted` when this column was introduced, so history didn't flood the queue.
- **Grading bands** (`server/src/utils/gradeCalculator.js`, display-only mirror in `client/src/utils/gradeUtils.js`): ≥90 A+, ≥80 A, ≥70 B, ≥60 C, ≥50 D, else F. Total/average/grade are always computed server-side; the client never recalculates them, only mirrors the color mapping.
- **Data sync / auto-refresh**: every mutating API call (`POST`/`PUT`/`PATCH`/`DELETE`) is centrally intercepted in `client/src/api/axiosClient.js`, which maps the URL to a resource key (`client/src/utils/dataSync.js`'s `RESOURCE_PATTERNS`) and broadcasts a `CustomEvent` + cross-tab `BroadcastChannel` message. Any mounted component subscribed via `useDataSync([...resources], refetchFn)` refetches automatically — there is no manual "refresh" anywhere in the app. **When adding a new mutating route, add its URL prefix to `RESOURCE_PATTERNS` if other views should auto-refresh when it's called.**

## Forgot Password / OTP System

Admin-only password recovery, entirely in `server/src/controllers/passwordResetController.js` + `client/src/pages/ForgotPasswordPage.jsx`. Routes are mounted under `/api/auth/*` and are **deliberately unauthenticated** (rate-limited instead — see below).

Flow: enter email → `POST /api/auth/forgot-password` → 6-digit OTP emailed → `POST /api/auth/verify-reset-otp` → short-lived signed reset token → `POST /api/auth/reset-password` → redirect to `/login`.

- **Email lookup is case-insensitive and admin-scoped**: `findAdminByEmail()` does a `LOWER()` comparison filtered to `userType: 'admin'` — never hardcoded, always read from `Users.email`. A matching email on a non-admin account is still rejected.
- **`GET /api/auth/admin-email`** (public) returns the admin's registered email so the frontend can pre-fill and disable that field — an explicit convenience tradeoff requested by the admin; it does mean the recovery email is visible to anyone who opens the page before proving they know it.
- OTP: `crypto.randomInt` (not `Math.random`), bcrypt-hashed at rest, **10-minute expiry**, **5 wrong-attempt limit** (then must request a new one), **60-second resend cooldown per account** (`RESEND_COOLDOWN_MS`) on top of the general IP rate limiter.
- Verifying correctly issues a short-lived (10 min) signed JWT with `purpose: 'password-reset'` — the *only* credential `reset-password` accepts, so that step can't be reached by skipping OTP entry. The associated `PasswordResetOtp` row is marked `verified`, then `passwordResetAt` once actually spent — so a reset token/OTP can never be replayed.
- New password: min 8 chars, bcrypt-hashed (`PASSWORD_SALT_ROUNDS = 12`, same as normal user creation).
- **Dev-mode fallback**: if SMTP isn't configured (`SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` unset), `mailer.js` logs the OTP to the server console instead of throwing, and `forgotPassword` includes it in the response as `devOtp` (only when `NODE_ENV !== 'production'`) so the flow stays testable without real email.
- **Error sanitization**: raw SMTP/nodemailer errors are logged server-side only; the client always gets a generic "failed to send" message (never host/auth details).
- Rate limiting: `passwordResetLimiter` (10 requests / 15 min per IP) on all four routes, layered with the per-account OTP-attempt and resend-cooldown limits above.

## API Endpoints

All routes are mounted under `/api` in `server/src/app.js`. `authenticate` = valid session cookie required; role lists are exactly what `authorizeRoles(...)` allows (see route files for the ground truth if this drifts).

| Resource | Base | Notable routes |
|---|---|---|
| Auth | `/api/auth` | `POST /login`, `POST /logout`, `GET /me`, `POST /heartbeat`, `GET /admin-email`, `POST /forgot-password`, `POST /verify-reset-otp`, `POST /reset-password` (last 5 unauthenticated) |
| Buildings (masjids) | `/api/buildings` | `GET /` admin+gudoomiye only (coordinator never sees the full list); `GET /:id` also allows coordinator but **only their own** (403 otherwise); writes admin-only |
| Fans | `/api/fans` | Admin-only, full CRUD |
| Classes (stages) | `/api/classes` | Reads: admin/student/coordinator/gudoomiye; writes admin-only |
| Subjects (books) | `/api/subjects` | Reads: admin/student/coordinator; writes admin-only |
| Students | `/api/students` | Reads: admin/coordinator/gudoomiye; writes: admin/coordinator (coordinator forced to own masjid); `/:id/stages` sub-resource (add/remove stage registrations) admin/coordinator only; `/:id/rename` admin/coordinator |
| Coordinators (GUDOOMIYE KUXIGEEN directory) | `/api/coordinators` | Admin-only, full CRUD |
| Users (login accounts) | `/api/users` | Admin-only, full CRUD, writes rate-limited (`accountWriteLimiter`) |
| Results | `/api/results` | `GET /by-class` admin/coordinator (masjid-scoped); `GET /all` admin/coordinator (masjid-scoped for coordinator); `GET /search` admin/coordinator (masjid-scoped); `GET /student/:studentId` admin/student (self-scoped for student, gated by `resultsVisible`); writes admin-only |
| Dashboard | `/api/dashboard` | `GET /summary` admin/gudoomiye |
| Reports | `/api/reports` | `GET /students` admin/gudoomiye (aggregate); `GET /all-students` admin/coordinator (flat list, masjid-scoped for coordinator); `GET /by-building` admin; `GET /my-building` coordinator-only |
| GUDOOMIYE reports | `/api/gudoomiye/reports` | All admin/gudoomiye only: `GET /masjid-students`, `GET /new-students` (pending queue), `GET /summary`, `PATCH /students/:id/accept` |

## Frontend Routes & Pages

Defined in `client/src/App.jsx`. `/login` and `/forgot-password` are public; everything else requires auth and is further gated by `allowedRoles` per route (see `App.jsx` for the exact list per route — kept in sync with the backend table above). `RootRedirect`/`ProtectedRoute` send an unauthorized or logged-out user to the right place: admin → `/dashboard`, gudoomiye → `/gudoomiye`, everyone else → `/results/view`.

- `/dashboard` — admin system-wide stat cards
- `/registrations/{buildings,fans,subjects,classes,students,coordinators,users}` — CRUD pages (masjid/fan/book/stage/user admin-only; students shared admin+coordinator, coordinator locked to own masjid with a disabled, pre-filled Masjid field)
- `/results/register` — admin-only bulk marks entry for one student's one stage at a time
- `/results/view` — shared by admin (browse by masjid+stage / all-students / search-by-ID modes), coordinator (search-by-ID only, own masjid), student (own results, stage picker if multi-stage)
- `/reports` and `/reports/*` — admin's report hub (tile grid) and individual reports; coordinator sees a masjid-locked "my masjid" panel plus the two masjid-scoped reports (no Summary Report for this role — that's gudoomiye-only)
- `/gudoomiye` and `/gudoomiye/*` — GUDOOMIYE's own hub: Masjid Students, New Registered Students (approval queue with Accept buttons), All Madrasa Students, Summary Report, Overall Statistics

## Environment Variables

`server/.env` (see `server/.env.example` for the template; never commit real values — `.env` is gitignored):

| Var | Required? | Purpose |
|---|---|---|
| `NODE_ENV`, `PORT`, `CLIENT_ORIGIN` | required (DB/JWT ones) | Boot config; `CLIENT_ORIGIN` is the CORS allow-origin |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | required | MySQL connection |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | required | Session signing + the actual idle-timeout duration (must match `client/src/config/session.js`'s `IDLE_TIMEOUT_MS`) |
| `COOKIE_NAME` | optional (defaults `af_token`) | Session cookie name |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | optional | Forgot Password email delivery (Gmail SMTP + App Password by convention here). Missing → dev-mode OTP fallback, rest of the app unaffected. |

`server/src/config/env.js` throws at boot if `DB_HOST`/`DB_NAME`/`DB_USER`/`JWT_SECRET` are missing; SMTP vars are optional and checked lazily by `mailer.js`.

## Security Mechanisms

- Every route requiring auth uses `authenticate` (JWT cookie verify) + `authorizeRoles(...)` (role allowlist) — always both, never rely on the frontend alone.
- Masjid-level data isolation for `coordinator` is enforced **at the query level** in every relevant controller via `ownBuildingId()`, not just by hiding UI controls — verified repeatedly by directly tampering `buildingId` in API calls during development.
- `helmet` for security headers; `cors` locked to `CLIENT_ORIGIN` with credentials.
- Rate limiters (`server/src/middleware/rateLimiter.js`): `loginLimiter` (10/15min), `accountWriteLimiter` (30/15min, user create/update), `heartbeatLimiter` (20/min), `passwordResetLimiter` (10/15min, all 4 forgot-password routes).
- Passwords and OTPs are always bcrypt-hashed, never stored or logged in plaintext.
- `errorHandler.js` never leaks a 500's raw error message to the client (generic "Internal server error" instead); only explicit 4xx application errors surface their own message. SMTP errors are explicitly sanitized the same way in `passwordResetController`.
- SMTP credentials live only in `server/.env` (gitignored) — never in code, never sent to the frontend.

## How to Safely Add a New Feature

1. **Schema change?** Add/modify the Sequelize model, then write a new numbered script in `server/scripts/` (`010-...`) that checks current state before altering — never assume `sequelize.sync()` will apply it to an existing table. Run it manually once against the live DB.
2. **New masjid-sensitive data?** Reuse `ownBuildingId()` (`server/src/utils/scoping.js`) to scope coordinator access — don't re-implement the check.
3. **New role-gated route?** Add `authenticate` + `authorizeRoles(...)` in the route file; mirror the same role list in the frontend route's `allowedRoles` and hide/show the relevant `Sidebar` entry — but the backend check is the one that actually matters.
4. **New report/table that can show the same student more than once** (multi-stage results)? Use or extend `GroupedStudentResultsMarksheet`, not a flat per-(student,stage) row.
5. **New mutating endpoint whose effect other open pages should reflect live?** Add its URL prefix to `RESOURCE_PATTERNS` in `client/src/utils/dataSync.js`.
6. **Never hardcode a real person's identifying data** (email, password, etc.) in application code — this project's own history includes intentionally removing a hardcoded admin email; store such things as data and look them up.
7. Build and sanity-check both sides after a change: `cd client && npm run build`, and boot the server with `node -e "require('./src/app.js')"` to catch require-time errors before a full restart.
