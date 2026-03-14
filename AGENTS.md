# AGENTS.md — MedCompliance AI
> This file is read by Codex CLI (GPT-5.3) before every code generation task.
> Follow every rule here without exception. Do not deviate from conventions defined below.

---

## Project Identity

| Field | Value |
|---|---|
| **Name** | MedCompliance AI |
| **Domain** | Healthcare Cybersecurity & Compliance |
| **Purpose** | HIPAA/HITECH/SOX/FDA compliance training platform for healthcare organizations |
| **Stack** | Next.js 16 (App Router) · Supabase · Tailwind CSS v4 · TypeScript 5 |
| **Deployment** | Vercel (mandatory) |
| **Repo** | github.com/bacancy/medcompliance-ai (public, Bacancy org) |

---

## Mandatory Tech Rules

1. **Next.js App Router only** — never use Pages Router. All routes live under `src/app/`.
2. **Supabase is the only database** — no other DB, no local SQLite, no Prisma ORM.
3. **TypeScript strict mode** — no `any`, no `@ts-ignore` without a comment explaining why.
4. **Tailwind CSS v4** for all styling — no inline style objects except for CSS custom properties or animation delays.
5. **Server Components by default** — add `"use client"` only when you need browser APIs, event handlers, or React hooks.
6. **No secrets in source code** — all credentials via environment variables. Never hardcode URLs or keys.
7. **Input validation on every API route** — use Zod for request body validation.
8. **Row Level Security (RLS) on every table** — never bypass RLS with service role key on client-facing routes.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # same as ANON_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=              # server-only, never expose to client
OPENAI_API_KEY=                         # for AI features, server-only
```

Never access `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` from client components or `NEXT_PUBLIC_` prefixed variables.

---

## Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no layout chrome)
│   │   ├── auth/sign-in/
│   │   ├── auth/sign-up/
│   │   └── auth/callback/
│   ├── (app)/                    # Protected app shell with sidebar/nav
│   │   ├── dashboard/
│   │   ├── training/
│   │   ├── certifications/
│   │   ├── notifications/
│   │   └── admin/
│   ├── api/                      # Route Handlers
│   │   ├── health/
│   │   ├── auth/
│   │   ├── training/
│   │   ├── assessments/
│   │   ├── certifications/
│   │   ├── progress/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   ├── audit/
│   │   ├── admin/
│   │   └── ai/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # Primitives: Button, Badge, Card, Modal, etc.
│   ├── dashboard/                # Dashboard-specific widgets
│   ├── training/                 # Training player, module card, quiz engine
│   ├── certifications/           # Certificate card, download button
│   ├── notifications/            # Notification bell, notification list
│   ├── analytics/                # Charts (Recharts), compliance meters
│   ├── admin/                    # User table, module editor
│   └── layout/                   # Sidebar, Topbar, MobileNav
├── features/                     # Business logic hooks + server actions per domain
│   ├── auth/
│   ├── training/
│   ├── assessments/
│   ├── certifications/
│   ├── notifications/
│   ├── analytics/
│   ├── audit/
│   └── ai/
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client (already exists)
│   │   ├── server.ts             # Server client (already exists)
│   │   └── env.ts                # Env validation (already exists)
│   ├── auth/
│   │   └── user.ts               # getUserContext() — get current user + profile
│   ├── validators/               # Zod schemas for all API inputs
│   ├── utils/
│   │   ├── cn.ts                 # classnames utility (clsx + twMerge)
│   │   ├── date.ts               # date formatting helpers
│   │   └── certificate.ts        # cert number generation
│   └── constants/
│       ├── regulations.ts        # HIPAA, HITECH, SOX, FDA enum values
│       └── roles.ts              # org_admin, compliance_manager, learner
└── middleware.ts                 # Supabase session proxy (uses proxy.ts)
```

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Files (components) | kebab-case | `module-card.tsx` |
| Files (utilities) | kebab-case | `get-user-context.ts` |
| React Components | PascalCase | `ModuleCard` |
| Functions/variables | camelCase | `getUserContext` |
| Database columns | snake_case | `organization_id` |
| API routes | kebab-case folders | `/api/training-modules/` |
| Zod schemas | PascalCase + Schema suffix | `CreateModuleSchema` |
| Server Actions | verb + noun | `assignModule`, `submitQuiz` |

---

## API Route Conventions

Every API route handler must:

1. **Authenticate first** — call `createClient()` and verify `supabase.auth.getUser()`. Return 401 if unauthenticated.
2. **Validate input** — parse body with a Zod schema. Return 400 with validation errors.
3. **Return consistent JSON shape**:
   ```ts
   // Success
   { data: T, error: null }
   // Error
   { data: null, error: { message: string, code?: string } }
   ```
4. **Log to audit_logs** for any write operation (POST/PUT/PATCH/DELETE).
5. **Use service role client only** for admin operations that bypass RLS — in `/api/admin/` routes only.

### Route Handler Template

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const BodySchema = z.object({ /* ... */ });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: { message: "Validation failed", code: "INVALID_INPUT" } }, { status: 400 });
  }

  // business logic here

  return NextResponse.json({ data: result, error: null });
}
```

---

## Database Rules

- **Never** drop or alter existing tables without a migration file in `db/migrations/`.
- All new tables **must** have RLS enabled and at least one policy.
- Use `public.current_org_id()` helper for org-scoped policies (already defined in schema).
- UUIDs as primary keys everywhere (except `audit_logs` which uses bigint identity).
- All timestamps as `timestamptz` (with timezone).
- Migrations go in `db/migrations/YYYYMMDD_description.sql`.

### Existing Tables (do not recreate)
- `organizations` — multi-tenant root
- `profiles` — extends `auth.users`, has `role` (org_admin | compliance_manager | learner)
- `training_modules` — HIPAA/HITECH/SOX/FDA modules
- `module_assignments` — user ↔ module with status + score
- `certifications` — issued on completion
- `notifications` — in-app alerts
- `audit_logs` — immutable activity log

### Tables Still to Create (via migrations)
- `questions` — quiz questions per module
- `question_options` — multiple choice options
- `assessment_attempts` — per-user quiz attempt with answers + score
- `training_paths` — ordered set of modules for a role
- `documents` — compliance document library
- `ai_chat_sessions` — AI compliance chatbot history

---

## Auth & Role Rules

Three roles exist: `org_admin`, `compliance_manager`, `learner`.

| Capability | learner | compliance_manager | org_admin |
|---|---|---|---|
| View own assignments | ✅ | ✅ | ✅ |
| Take quizzes | ✅ | ✅ | ✅ |
| View own certs | ✅ | ✅ | ✅ |
| View org compliance report | ❌ | ✅ | ✅ |
| Assign modules to users | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Create/edit modules | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ✅ | ✅ |
| Access /admin routes | ❌ | ❌ | ✅ |

Guard pages with a server-side role check. Redirect unauthorized users to `/dashboard` with an error param.

---

## Component Rules

1. **No default exports from `src/components/ui/`** — use named exports.
2. **Server Components fetch their own data** — do not pass raw Supabase queries as props.
3. **Loading states** — every data-fetching Server Component must have a sibling `loading.tsx`.
4. **Error states** — every route segment must have an `error.tsx` (client component with `"use client"`).
5. **Responsive first** — mobile layout must work. Use Tailwind responsive prefixes (`md:`, `lg:`).
6. **Accessible** — use semantic HTML. All interactive elements need keyboard focus styles.
7. **No hardcoded demo text in components** — all display content comes from props or database.

---

## What Is Already Built

| File | Status | Notes |
|---|---|---|
| `db/schema.sql` | ✅ Complete | 7 tables + RLS + indexes |
| `db/seed.sql` | ✅ Complete | Demo org + 5 modules |
| `src/lib/supabase/client.ts` | ✅ Complete | Browser client |
| `src/lib/supabase/server.ts` | ✅ Complete | Server client with cookie handling |
| `src/lib/supabase/env.ts` | ✅ Complete | Env validation |
| `proxy.ts` | ✅ Complete | Supabase middleware helper |
| `src/app/page.tsx` | ✅ Complete | Landing page |
| `src/app/layout.tsx` | ✅ Complete | Root layout |
| `src/app/globals.css` | ✅ Complete | Base styles + design tokens |
| `src/app/api/health/route.ts` | ✅ Complete | DB health check |
| `src/components/dashboard/module-list.tsx` | ✅ Complete | Basic module list |

---

## Full Build Roadmap (Ordered)

### Phase 0 — Wiring (prerequisite for everything)
- [ ] `src/middleware.ts` — import and use `proxy` + `proxyConfig` from `proxy.ts`
- [ ] `src/lib/auth/user.ts` — `getUserContext()` that returns `{ user, profile }` or null
- [ ] `src/lib/utils/cn.ts` — `cn()` classnames utility
- [ ] `src/lib/constants/roles.ts` — role enums + type
- [ ] `src/lib/constants/regulations.ts` — regulation enums + type
- [ ] Install missing packages: `zod`, `recharts`, `clsx`, `tailwind-merge`

### Phase 1 — Authentication
- [ ] `src/app/(auth)/auth/sign-in/page.tsx` — email/password login form
- [ ] `src/app/(auth)/auth/sign-up/page.tsx` — registration (name, email, password, org)
- [ ] `src/app/(auth)/auth/callback/route.ts` — Supabase OAuth callback handler
- [ ] `src/app/api/auth/sign-out/route.ts` — POST sign out
- [ ] `src/features/auth/actions.ts` — `signIn`, `signUp`, `signOut` server actions
- [ ] Auto-create profile row on sign-up via Supabase trigger (add to `db/migrations/`)

### Phase 2 — App Shell
- [ ] `src/app/(app)/layout.tsx` — protected layout with sidebar + topbar
- [ ] `src/components/layout/sidebar.tsx` — nav links based on role
- [ ] `src/components/layout/topbar.tsx` — user avatar, org name, notification bell
- [ ] `src/components/layout/mobile-nav.tsx` — hamburger menu for mobile

### Phase 3 — Dashboard
- [ ] `src/app/(app)/dashboard/page.tsx` — role-aware main dashboard
- [ ] `src/components/dashboard/stats-cards.tsx` — completion %, cert count, overdue count
- [ ] `src/components/dashboard/compliance-meter.tsx` — org compliance % gauge
- [ ] `src/components/dashboard/recent-activity.tsx` — last 5 audit events
- [ ] `src/app/api/analytics/dashboard/route.ts` — GET aggregated dashboard stats

### Phase 4 — Training Modules
- [ ] `src/app/(app)/training/page.tsx` — module catalogue with filter by regulation/role
- [ ] `src/app/(app)/training/[id]/page.tsx` — module detail + start button
- [ ] `src/app/(app)/training/[id]/learn/page.tsx` — module content player
- [ ] `src/components/training/module-card.tsx` — card with regulation badge + status
- [ ] `src/components/training/module-player.tsx` — content viewer (text/video)
- [ ] `src/app/api/training/route.ts` — GET list with filters
- [ ] `src/app/api/training/[id]/route.ts` — GET single module
- [ ] `src/app/api/training/[id]/start/route.ts` — POST create assignment (status: in_progress)
- [ ] `src/app/api/training/[id]/complete/route.ts` — POST mark complete + trigger cert if score ≥ 80

### Phase 5 — Assessment & Quiz Engine
- [ ] `db/migrations/20260314_questions.sql` — `questions` + `question_options` + `assessment_attempts` tables
- [ ] `src/app/(app)/training/[id]/quiz/page.tsx` — quiz page
- [ ] `src/components/training/quiz-engine.tsx` — client component: question stepper + timer
- [ ] `src/app/api/assessments/[moduleId]/route.ts` — GET questions for module
- [ ] `src/app/api/assessments/[moduleId]/submit/route.ts` — POST answers → score → update assignment
- [ ] `src/features/assessments/actions.ts` — `submitQuiz` server action

### Phase 6 — Certifications
- [ ] `src/app/(app)/certifications/page.tsx` — list all user certs
- [ ] `src/app/(app)/certifications/[id]/page.tsx` — cert detail with download
- [ ] `src/components/certifications/certificate-card.tsx` — cert display
- [ ] `src/lib/utils/certificate.ts` — `generateCertNo()` unique cert number
- [ ] `src/app/api/certifications/route.ts` — GET user certs
- [ ] `src/app/api/certifications/[id]/route.ts` — GET single cert
- [ ] `src/app/api/certifications/[id]/download/route.ts` — GET PDF cert (use canvas/pdf generation)

### Phase 7 — Notifications
- [ ] `src/app/(app)/notifications/page.tsx` — full notification inbox
- [ ] `src/components/notifications/notification-bell.tsx` — topbar bell with unread count
- [ ] `src/components/notifications/notification-item.tsx` — single notification row
- [ ] `src/app/api/notifications/route.ts` — GET unread notifications
- [ ] `src/app/api/notifications/[id]/read/route.ts` — PATCH mark as read
- [ ] `src/app/api/notifications/mark-all-read/route.ts` — PATCH mark all read

### Phase 8 — Compliance Analytics Dashboard
- [ ] `src/app/(app)/dashboard/compliance/page.tsx` — org-wide compliance (manager+admin only)
- [ ] `src/components/analytics/completion-chart.tsx` — bar chart: completion by regulation
- [ ] `src/components/analytics/pass-rate-chart.tsx` — pass rate over time (line chart)
- [ ] `src/components/analytics/user-progress-table.tsx` — per-user progress table
- [ ] `src/app/api/analytics/compliance/route.ts` — GET org compliance stats
- [ ] `src/app/api/analytics/users/route.ts` — GET per-user training stats

### Phase 9 — Admin Panel
- [ ] `src/app/(app)/admin/page.tsx` — admin home (org_admin only)
- [ ] `src/app/(app)/admin/users/page.tsx` — user list with role management
- [ ] `src/app/(app)/admin/users/[id]/page.tsx` — user detail + assign modules
- [ ] `src/app/(app)/admin/modules/page.tsx` — module list + create/edit
- [ ] `src/app/(app)/admin/modules/new/page.tsx` — create module form
- [ ] `src/app/(app)/admin/audit/page.tsx` — audit log viewer with filters
- [ ] `src/components/admin/user-table.tsx` — sortable, filterable user table
- [ ] `src/components/admin/module-form.tsx` — module create/edit form
- [ ] `src/app/api/admin/users/route.ts` — GET all users (service role)
- [ ] `src/app/api/admin/users/[id]/route.ts` — PATCH role, DELETE user
- [ ] `src/app/api/admin/modules/route.ts` — GET all + POST create module
- [ ] `src/app/api/admin/modules/[id]/route.ts` — PUT update + DELETE module
- [ ] `src/app/api/admin/assign/route.ts` — POST bulk assign module to users
- [ ] `src/app/api/audit/route.ts` — GET audit logs with pagination + filters

### Phase 10 — AI Features
- [ ] `src/app/(app)/dashboard/ai-assistant/page.tsx` — AI compliance chatbot
- [ ] `src/components/ai/chat-window.tsx` — chat UI with message bubbles
- [ ] `src/app/api/ai/chat/route.ts` — POST → stream response from OpenAI/Claude
- [ ] `src/app/api/ai/recommendations/route.ts` — GET personalized module suggestions
- [ ] `src/features/ai/actions.ts` — AI server actions

### Phase 11 — Gamification
- [ ] `src/components/dashboard/leaderboard.tsx` — org leaderboard by completion
- [ ] `src/components/dashboard/achievement-badges.tsx` — earned badges display
- [ ] Badge award logic on cert issuance (server action)

---

## All API Endpoints (Complete Reference)

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/sign-out` | required | Sign out current user |

### Training
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/training` | required | List modules (filter: regulation, role, status) |
| GET | `/api/training/[id]` | required | Get single module with user's assignment status |
| POST | `/api/training/[id]/start` | required | Create/update assignment → in_progress |
| POST | `/api/training/[id]/complete` | required | Mark complete, store score, issue cert if ≥ 80 |

### Assessments
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/assessments/[moduleId]` | required | Get questions + options for module |
| POST | `/api/assessments/[moduleId]/submit` | required | Submit answers, get score back |

### Certifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/certifications` | required | List current user's certs |
| GET | `/api/certifications/[id]` | required | Get single cert |
| GET | `/api/certifications/[id]/download` | required | Download cert as PDF |

### Progress
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/progress` | required | Current user's all assignments + statuses |
| GET | `/api/progress/[userId]` | manager+ | Get specific user's progress |

### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | required | Get unread notifications |
| PATCH | `/api/notifications/[id]/read` | required | Mark single as read |
| PATCH | `/api/notifications/mark-all-read` | required | Mark all as read |

### Analytics
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/dashboard` | required | User-level dashboard stats |
| GET | `/api/analytics/compliance` | manager+ | Org-wide compliance stats |
| GET | `/api/analytics/users` | manager+ | Per-user training stats table |

### Audit
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/audit` | manager+ | Paginated audit log (filter: user, action, date) |

### Admin (org_admin only)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | org_admin | List all org users |
| PATCH | `/api/admin/users/[id]` | org_admin | Update role |
| DELETE | `/api/admin/users/[id]` | org_admin | Remove user from org |
| GET | `/api/admin/modules` | org_admin | List all modules |
| POST | `/api/admin/modules` | org_admin | Create module |
| PUT | `/api/admin/modules/[id]` | org_admin | Update module |
| DELETE | `/api/admin/modules/[id]` | org_admin | Delete module |
| POST | `/api/admin/assign` | org_admin | Bulk assign module to user list |

### AI
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/chat` | required | Send message, stream compliance AI response |
| GET | `/api/ai/recommendations` | required | Get personalized module recommendations |

### System
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | none | DB connectivity check |

---

## Page Routes (Complete Reference)

| Path | Layout | Role | Description |
|---|---|---|---|
| `/` | root | public | Landing page |
| `/auth/sign-in` | auth | public | Sign in form |
| `/auth/sign-up` | auth | public | Registration form |
| `/auth/callback` | none | public | Supabase OAuth redirect handler |
| `/dashboard` | app | all | Role-aware main dashboard |
| `/dashboard/compliance` | app | manager+ | Org compliance analytics |
| `/dashboard/ai-assistant` | app | all | AI compliance chatbot |
| `/training` | app | all | Module catalogue |
| `/training/[id]` | app | all | Module detail |
| `/training/[id]/learn` | app | all | Module content player |
| `/training/[id]/quiz` | app | all | Quiz engine |
| `/certifications` | app | all | My certificates |
| `/certifications/[id]` | app | all | Certificate detail + download |
| `/notifications` | app | all | Notification inbox |
| `/admin` | app | org_admin | Admin home |
| `/admin/users` | app | org_admin | User management |
| `/admin/users/[id]` | app | org_admin | User detail + module assignment |
| `/admin/modules` | app | org_admin | Module management |
| `/admin/modules/new` | app | org_admin | Create module |
| `/admin/audit` | app | manager+ | Audit log viewer |

---

## Security Checklist (verify before every commit)

- [ ] No `process.env.SUPABASE_SERVICE_ROLE_KEY` in client components
- [ ] No `"use client"` on files that do DB queries
- [ ] Every API route checks `supabase.auth.getUser()` before doing anything
- [ ] Role-gated routes check profile.role in server component before rendering
- [ ] No raw SQL — always use Supabase query builder
- [ ] All form inputs validated with Zod before DB writes
- [ ] `audit_logs` insert happens on every POST/PUT/DELETE that touches user data

---

## Do Not

- Do NOT use `getServerSideProps` or `getStaticProps` — this is App Router only
- Do NOT use `next/router` — use `next/navigation`
- Do NOT fetch data in client components if a Server Component can do it
- Do NOT create new Supabase clients inline — always import from `@/lib/supabase/server` or `@/lib/supabase/client`
- Do NOT bypass RLS on client-facing routes
- Do NOT use `alert()` or `console.log()` in production code
- Do NOT commit `.env.local` — it is in `.gitignore`
- Do NOT create new tables without a corresponding migration file in `db/migrations/`
- Do NOT use `any` type in TypeScript
- Do NOT use CSS modules or styled-components — Tailwind only
