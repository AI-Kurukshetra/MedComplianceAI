# PLAN.md — MedCompliance AI (Rebuild Plan v2)
> Generated from full SRS analysis on 2026-03-14.
> Auth flow (sign-in, sign-up, callback) is COMPLETE — do not touch it.
> This plan covers everything AFTER authentication.
> Cross-reference AGENTS.md for all coding conventions before writing any code.

---

## Product Vision

MedCompliance AI is a **multi-tenant healthcare compliance training platform** that:
- Assigns HIPAA/HITECH/SOX/FDA training modules to healthcare staff by role
- Delivers actual learning content + interactive quizzes inside the app
- Auto-issues verifiable digital certificates on passing (≥ 80%)
- Gives compliance managers real-time org-wide reporting dashboards
- Uses AI to answer compliance questions and recommend training paths
- Engages learners through gamification (points, badges, leaderboard)
- Logs every action for HIPAA audit readiness

Reference product: **Medscape Compliance** (https://www.medscape.com/)

---

## What Is Already Built — DO NOT RECREATE

| File / Feature | Status |
|---|---|
| `db/schema.sql` | 11 tables + RLS + trigger + indexes |
| `db/seed.sql` | demo-clinic org + 10 modules + 15 quiz questions |
| `src/lib/supabase/` | Browser + server clients, env validation |
| `src/middleware.ts` | Supabase session proxy |
| `src/lib/auth/user.ts` | getUserContext, requireUserContext, isManager |
| `proxy.ts` | Middleware helper |
| `src/app/auth/sign-in/` | Email/password sign-in with HashErrorReader, resend link |
| `src/app/auth/sign-up/` | Registration with org + profile auto-creation |
| `src/app/auth/callback/` | OAuth code exchange |
| `src/app/auth/actions.ts` | signIn, signUp, signOut, resendConfirmation server actions |
| `src/app/page.tsx` | Public landing page |
| `src/app/layout.tsx` | Root layout with NavigationProgress |
| `src/app/globals.css` | Design tokens, skeleton shimmer, all base styles |
| `src/components/ui/navigation-progress.tsx` | Top progress bar on every navigation |
| All `loading.tsx` skeleton files | Dashboard, training, certifications, notifications, admin, auth |
| `src/app/(protected)/layout.tsx` | Protected shell with sidebar, topbar, navigation |
| `src/app/(protected)/dashboard/page.tsx` | Basic dashboard (needs redesign per plan below) |
| `src/app/(protected)/training/page.tsx` | Module list + assign-to-self (needs full rebuild) |
| `src/app/(protected)/certifications/page.tsx` | Certificate list (needs cert detail + download) |
| `src/app/(protected)/notifications/page.tsx` | Notification inbox (complete) |
| `src/app/(protected)/admin/page.tsx` | Admin overview with audit log (needs expansion) |
| `src/app/(protected)/dashboard/actions.ts` | Server actions: assign, complete, create module, mark notification read |

---

## Existing Database Schema

```
organizations       id, slug, name, logo_url, created_at
profiles            id→auth.users, organization_id, full_name, email, role, avatar_url, created_at, updated_at
training_modules    id, organization_id, title, description, regulation, audience_role,
                    estimated_minutes, content_url, is_active, created_at, updated_at
questions           id, module_id, organization_id, body, explanation, points, position, created_at
question_options    id, question_id, body, is_correct, position
module_assignments  id, organization_id, user_id, module_id, status, score,
                    assigned_at, due_date, completed_at
assessment_attempts id, organization_id, user_id, module_id, answers(jsonb), score,
                    passed, started_at, completed_at
certifications      id, organization_id, user_id, module_id, certificate_no,
                    issued_at, expires_at
notifications       id, organization_id, user_id, kind, title, message, read_at, created_at
audit_logs          id(bigint), organization_id, actor_user_id, action, entity_type,
                    entity_id, metadata(jsonb), created_at
```

**Roles:** `org_admin` | `compliance_manager` | `learner`
**Regulations:** `HIPAA` | `HITECH` | `SOX` | `FDA`
**Assignment statuses:** `assigned` | `in_progress` | `completed` | `overdue`
**Notification kinds:** `due_soon` | `overdue` | `renewal` | `assignment` | `achievement`

---

## The Gap — What Currently Exists vs What Must Be Built

### What currently exists (post-auth) is WRONG for the product:
| Current page | Problem |
|---|---|
| `/dashboard` | Dumps all data on one page with no UX flow. Not role-aware. |
| `/training` | Lists modules with "Assign to Me" + "Mark Completed" — no actual learning flow |
| `/certifications` | Lists certs but no detail, no download, no visual certificate |
| `/notifications` | Functionally correct but plain |
| `/admin` | Shows numbers + audit log only — no user management, no module editor |

### What Must Be Built:
The entire product experience — actual training delivery, quiz engine, certificates, compliance analytics, admin tools, AI assistant, gamification — is missing.

---

## User Roles & What They Can Do

| Capability | learner | compliance_manager | org_admin |
|---|---|---|---|
| View own dashboard | ✅ | ✅ | ✅ |
| Browse module catalogue | ✅ | ✅ | ✅ |
| Enroll in / start a module | ✅ | ✅ | ✅ |
| Read module content | ✅ | ✅ | ✅ |
| Take quiz | ✅ | ✅ | ✅ |
| View own certificates | ✅ | ✅ | ✅ |
| Download certificate PDF | ✅ | ✅ | ✅ |
| View leaderboard | ✅ | ✅ | ✅ |
| Use AI chatbot | ✅ | ✅ | ✅ |
| View own notifications | ✅ | ✅ | ✅ |
| View compliance report (org-wide) | ❌ | ✅ | ✅ |
| Assign modules to other users | ❌ | ✅ | ✅ |
| View all users' progress | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ✅ | ✅ |
| Create / edit / delete modules | ❌ | ❌ | ✅ |
| Manage users (roles, deactivate) | ❌ | ❌ | ✅ |
| Bulk assign modules | ❌ | ❌ | ✅ |
| Manage document library | ❌ | ❌ | ✅ |

---

## Complete Page Map (What Must Exist)

### Public (no auth)
| Path | Description |
|---|---|
| `/` | Landing page — already built |
| `/auth/sign-in` | Sign in — already built |
| `/auth/sign-up` | Sign up — already built |
| `/auth/callback` | OAuth callback — already built |

### Learner (all authenticated users)
| Path | Description |
|---|---|
| `/dashboard` | **REDESIGN** — role-aware home: progress ring, assigned modules queue, next-up module CTA, recent activity, cert count |
| `/training` | **REDESIGN** — module catalogue with regulation filter, role filter, status filter, search |
| `/training/[id]` | **NEW** — Module detail: title, regulation badge, description, estimated time, prereqs, enroll/start CTA |
| `/training/[id]/learn` | **NEW** — Content player: sectioned reading content, progress tracker, "Ready for Quiz" button |
| `/training/[id]/quiz` | **NEW** — Interactive quiz: one question at a time, timer, progress bar, submit, score reveal |
| `/certifications` | **REDESIGN** — Visual certificate gallery with status badges |
| `/certifications/[id]` | **NEW** — Full certificate view with download button |
| `/leaderboard` | **NEW** — Org leaderboard: rank, name, certs earned, completion %, badges |
| `/ai-assistant` | **NEW** — AI compliance chatbot: streaming responses, starter prompts, history |
| `/notifications` | Already functional — keep |
| `/profile` | **NEW** — View/edit own profile: name, avatar, role, org, joined date |

### Compliance Manager + Org Admin
| Path | Description |
|---|---|
| `/compliance` | **NEW** — Org-wide compliance dashboard: completion by regulation (bar chart), pass rate trend (line chart), user progress table, overdue count |

### Org Admin Only
| Path | Description |
|---|---|
| `/admin` | **REDESIGN** — Admin hub with quick stats + links to all sub-pages |
| `/admin/users` | **NEW** — User table: search, filter by role, view progress, change role, deactivate |
| `/admin/users/[id]` | **NEW** — User detail: profile info, assigned modules, completion history, assign new module form |
| `/admin/modules` | **NEW** — Module management: list with edit/delete, create new button |
| `/admin/modules/new` | **NEW** — Create module form: title, description, regulation, audience_role, estimated_minutes, content (rich text or markdown) |
| `/admin/modules/[id]/edit` | **NEW** — Edit module form |
| `/admin/modules/[id]/questions` | **NEW** — Quiz question editor: add/edit/delete questions and options |
| `/admin/audit` | **NEW** — Full audit log viewer: paginated, filtered by user/action/date, exportable |

---

## Phase-by-Phase Build Order

### PHASE 1 — Redesign Dashboard (the face of the product)
> The current dashboard is a data dump. It must become a proper role-aware home screen.

**File to overwrite:** `src/app/(protected)/dashboard/page.tsx`

**Learner view shows:**
- Welcome header: "Good morning, [Name]" + role badge + org name
- Progress ring: % of assigned modules completed (circular chart)
- "Continue Learning" card: next assigned in-progress or assigned module with CTA button → `/training/[id]`
- "Your Assignments" list: top 5 pending modules with status badges and due dates
- "Recent Certifications" strip: last 3 certs earned with regulation badge
- "Notifications" strip: last 3 unread alerts
- Gamification strip: points balance, current badge, rank in org

**Compliance Manager/Org Admin adds:**
- Org Compliance Summary card: overall org completion % + breakdown by regulation (HIPAA %, HITECH %, SOX %, FDA %)
- Overdue count badge with link to `/compliance`
- Quick action: "Assign Module" button

**Actions:**
- Remove: the "Mark Completed with score input" form from dashboard (that belongs in quiz flow)
- Remove: "Assign to Me" form from dashboard (that belongs in training catalogue)
- Keep: only the overview widgets

---

### PHASE 2 — Training Catalogue Redesign
> Current page just lists modules with assign/complete buttons. Must become a proper catalogue.

**File to overwrite:** `src/app/(protected)/training/page.tsx`

**Layout:**
- Page header: "Training Catalogue" + search input + filter pills (All, HIPAA, HITECH, SOX, FDA, My Assignments)
- Module cards grid (3 cols on desktop, 1 on mobile):
  - Each card shows: regulation badge (color-coded), title, description excerpt, audience_role chip, estimated time, status (not enrolled / in progress / completed / overdue)
  - CTA button: "Enroll" (if not assigned) or "Continue" (if in_progress) or "Review" (if completed)
  - Click card → navigate to `/training/[id]`
- Separate tab/section: "My Assignments" — shows only user's assignments with status

**Color coding for regulation badges:**
- HIPAA → blue
- HITECH → purple
- SOX → amber
- FDA → green

---

### PHASE 3 — Module Detail Page (NEW)
**File:** `src/app/(protected)/training/[id]/page.tsx`

**Shows:**
- Breadcrumb: Training → [Module Title]
- Hero card: regulation badge, title, description, audience_role, estimated_minutes, is_active status
- Two-column layout:
  - Left: Module content preview (first 200 chars of description + "Start to read full content")
  - Right: Sidebar card showing user's current status on this module
    - If not enrolled: "Enroll & Start" button → POST to enroll action → redirect to `/training/[id]/learn`
    - If in_progress: "Continue Learning" → `/training/[id]/learn` + "Take Quiz" → `/training/[id]/quiz`
    - If completed: score badge + "View Certificate" → `/certifications/[certId]` + "Retake Quiz"
    - If overdue: warning banner + "Start Now" CTA
- Questions preview: "This module has X questions in the assessment"
- Org admin: edit button → `/admin/modules/[id]/edit`

**Server action needed:** `enrollModuleAction(moduleId)` — upserts `module_assignments` with status=`in_progress`, inserts audit_log

---

### PHASE 4 — Module Content Player (NEW)
**File:** `src/app/(protected)/training/[id]/learn/page.tsx`

**Shows:**
- Progress bar at top showing section X of N (use localStorage or DB for progress tracking)
- Content sections from the module's `description` field (split by `\n\n` or use structured content)
- For MVP: rich text display with headings, bullet points formatted from markdown
- Regulation info card in sidebar: links to official HIPAA/HITECH documentation
- "Mark as Ready" button at bottom → navigates to `/training/[id]/quiz`
- "Back to Module" link
- Time tracker displayed (estimated vs time spent)

**Note on content:** For the hackathon MVP, module content is the `description` field + structured text blocks. Seed the 10 modules with real, multi-paragraph HIPAA/HITECH/SOX/FDA content in `db/seed.sql`.

---

### PHASE 5 — Quiz Engine (NEW — most important feature)
**Files:**
- `src/app/(protected)/training/[id]/quiz/page.tsx` — Server component that loads questions
- `src/components/training/quiz-engine.tsx` — `"use client"` interactive quiz component

**Quiz flow:**
1. Server page fetches questions + options for module (WITHOUT is_correct field)
2. Renders `<QuizEngine>` client component passing questions as props
3. QuizEngine state machine:
   - `idle` → show intro screen: module name, question count, time limit, "Start Quiz" button
   - `active` → show one question at a time:
     - Question number indicator (Q 3 of 10)
     - Progress bar filling as questions answered
     - Question body text
     - 4 option buttons — clicking selects/deselects, highlighted in brand blue
     - "Next Question" button (disabled until an option selected)
     - Timer countdown (optional — can skip for MVP)
   - `reviewing` → after last question: "Submit Quiz" confirmation screen showing answers summary
   - `submitted` → POST to `/api/assessments/[moduleId]/submit` → show results screen:
     - Large score display (e.g. "82/100")
     - Pass (≥80%) → green banner "Congratulations! Certificate Issued" + "View Certificate" button
     - Fail (<80%) → red banner "Keep Learning" + "Retake Quiz" button + "Review Content" link
     - Per-question review: show each question with user's answer, correct answer, explanation

**Server action / API needed:**
- `GET /api/assessments/[moduleId]` — returns questions + options (no is_correct)
- `POST /api/assessments/[moduleId]/submit` — scores, updates assignment, issues cert if pass, returns result

---

### PHASE 6 — Certificate Detail + Download (NEW)
**Files:**
- `src/app/(protected)/certifications/page.tsx` — **REDESIGN** as visual gallery
- `src/app/(protected)/certifications/[id]/page.tsx` — **NEW** detail page

**Certifications gallery redesign:**
- Filter: All | Active | Expiring Soon | Expired
- Certificate cards showing:
  - Visual mini-certificate design with org name + regulation color border
  - Module title, regulation badge, certificate number
  - Issued date + Expires date + days remaining chip
  - "View" button → `/certifications/[id]`

**Certificate detail page:**
- Full visual certificate card with:
  - MedCompliance AI logo / seal
  - "This certifies that [Full Name]"
  - "has successfully completed [Module Title]"
  - "Regulation: [HIPAA/HITECH/SOX/FDA]"
  - "Certificate No: MCA-HIPAA-20260314-A3F9"
  - "Issued: [date] · Expires: [date]"
  - Organization name
- "Download Certificate" button → renders printable HTML or redirects to `/api/certifications/[id]/download`
- "Share" button (copy link)

**Certificate download API:**
- `GET /api/certifications/[id]/download` — returns a print-ready HTML page that auto-triggers browser print

**Certificate number generator:**
- `src/lib/utils/certificate.ts` — `generateCertNo(regulation)` → `MCA-HIPAA-20260314-A3F9`

---

### PHASE 7 — Compliance Reporting Dashboard (NEW — for managers)
**File:** `src/app/(protected)/compliance/page.tsx`

**Role guard:** redirect learners to `/dashboard`

**Shows (all pulling from Supabase):**
- Page header: "Compliance Overview" + org name + date range picker (last 30d / 90d / all time)
- KPI row (4 tiles):
  - Overall org completion % (completed assignments / total assignments)
  - Total active learners
  - Certifications issued this month
  - Modules with overdue assignments count
- "Compliance by Regulation" bar chart (Recharts BarChart):
  - X-axis: HIPAA, HITECH, SOX, FDA
  - Y-axis: completion %
  - Color-coded bars
- "Pass Rate Trend" line chart (Recharts LineChart):
  - X-axis: last 6 months
  - Y-axis: % of quiz attempts that passed
- "User Progress Table":
  - Columns: Name, Role, Assigned, Completed, Avg Score, Certs, Status
  - Sortable columns
  - Click row → `/admin/users/[id]`
- "Overdue Users" alert list: users with 1+ overdue assignments

**Install required:** `recharts` — `npm install recharts`

---

### PHASE 8 — Admin: User Management (NEW)
**Files:**
- `src/app/(protected)/admin/users/page.tsx`
- `src/app/(protected)/admin/users/[id]/page.tsx`

**Users list page:**
- Search bar (filter by name/email)
- Filter tabs: All | Learners | Compliance Managers | Admins
- User rows table:
  - Avatar initial, Full Name, Email, Role badge, Joined date, Completion %, Certs count
  - Actions: "View" button → `/admin/users/[id]`, Role dropdown (change role), Deactivate button
- "Bulk Assign" button → opens modal to assign a module to all selected users

**User detail page `/admin/users/[id]`:**
- Profile header: name, email, role, joined, org
- Stats: assigned modules, completed, avg score, certs earned
- "Assign Module" form: select module dropdown + due date → POST action
- Assignments table: module title, status, score, assigned date, completed date
- Certificates table: cert no, module, issued, expires

**API routes needed:**
- `GET /api/admin/users` — list all org users (service role)
- `PATCH /api/admin/users/[id]` — update role
- `POST /api/admin/assign` — assign module to user(s)

---

### PHASE 9 — Admin: Module Management (NEW)
**Files:**
- `src/app/(protected)/admin/modules/page.tsx`
- `src/app/(protected)/admin/modules/new/page.tsx`
- `src/app/(protected)/admin/modules/[id]/edit/page.tsx`
- `src/app/(protected)/admin/modules/[id]/questions/page.tsx`

**Modules list page:**
- Table: title, regulation badge, audience_role, estimated_minutes, questions count, active/inactive toggle
- Actions: Edit, Manage Questions, Delete (soft delete: set is_active=false)
- "Create New Module" button

**Create/Edit module form:**
- Fields: Title, Description (textarea), Regulation (select), Audience Role (select or text), Estimated Minutes, Content URL (optional), Is Active toggle
- On submit → POST/PUT `/api/admin/modules`

**Question editor `/admin/modules/[id]/questions`:**
- List of existing questions with edit/delete
- "Add Question" form:
  - Question body (textarea)
  - Explanation (shown after quiz)
  - 4 option inputs with "Correct?" radio button
  - Points (default 1)
  - Position (order)
- On submit → inserts into `questions` + `question_options`

**API routes needed:**
- `GET/POST /api/admin/modules`
- `PUT/DELETE /api/admin/modules/[id]`
- `GET/POST /api/admin/modules/[id]/questions`
- `PUT/DELETE /api/admin/questions/[id]`

---

### PHASE 10 — Admin: Audit Log Viewer (NEW)
**File:** `src/app/(protected)/admin/audit/page.tsx`

**Shows:**
- Filter bar: User (select), Action (text), Entity Type (select), Date From, Date To
- Paginated table (20 per page):
  - Columns: Timestamp, Actor (user name), Action, Entity Type, Entity ID
  - Click row → expand to show `metadata` JSON
- "Export CSV" button → download audit log as CSV

---

### PHASE 11 — AI Compliance Assistant (NEW)
**Files:**
- `src/app/(protected)/ai-assistant/page.tsx`
- `src/components/ai/chat-window.tsx` — `"use client"`
- `src/app/api/ai/chat/route.ts` — streaming POST handler

**Chat window:**
- Page header: "AI Compliance Assistant" + "Powered by Claude" badge
- Starter prompt chips: "What is the HIPAA Minimum Necessary Standard?", "Explain HITECH breach notification", "When does PHI need to be de-identified?", "What are my overdue modules?"
- Messages area: user messages (right, brand blue), AI messages (left, white card)
- Streaming: AI response streams in token by token (ReadableStream)
- Input box with send button at bottom
- Message history in state (not persisted for MVP)

**API route `/api/ai/chat`:**
- POST, auth required
- Body: `{ message: string; history: Array<{role:'user'|'assistant'; content: string}> }`
- System prompt: "You are a HIPAA, HITECH, SOX, and FDA compliance expert for healthcare organizations. Answer questions clearly and accurately. Be concise. Note: You are not providing legal advice."
- Use Anthropic Claude API (`@anthropic-ai/sdk`) or OpenAI API — whichever key is configured
- Stream response back using `TransformStream`

**Install required:** `@anthropic-ai/sdk` — `npm install @anthropic-ai/sdk`
**Env var needed:** `ANTHROPIC_API_KEY=sk-ant-...`

---

### PHASE 12 — Gamification (NEW)
**Files:**
- `src/app/(protected)/leaderboard/page.tsx`
- `src/components/dashboard/gamification-strip.tsx`
- `db/migrations/20260315_badges.sql`

**Leaderboard page `/leaderboard`:**
- Org leaderboard table: Rank, Avatar initial, Name, Points, Certs Earned, Completion %
- Crown icon for #1, medal icons for #2 and #3
- "Your Rank" highlighted row
- Points system: 10 pts per module completed, 20 pts per cert earned, 5 pts per quiz attempt

**Badge system:**
| Badge | Trigger condition |
|---|---|
| First Steps | Complete first module |
| HIPAA Hero | Complete all HIPAA modules |
| Perfect Score | Score 100% on any quiz |
| Speed Learner | Complete module within 24h of assignment |
| Overachiever | Earn 5+ certifications |
| Streak Master | Complete 5 modules in a row |

**DB migration `db/migrations/20260315_badges.sql`:**
```sql
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_key text not null,
  badge_label text not null,
  earned_at timestamptz default now(),
  unique (user_id, badge_key)
);
alter table public.user_badges enable row level security;
create policy badges_org on public.user_badges
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
```

Badge award logic runs inside the quiz submit API route after issuing a cert.

---

### PHASE 13 — Profile Page (NEW)
**File:** `src/app/(protected)/profile/page.tsx`

**Shows:**
- Avatar (initial-based colored circle)
- Full Name (editable)
- Email (read only)
- Role badge
- Organization name
- Member since date
- Badges earned (grid of badge icons)
- Edit form: update full_name → PATCH `profiles` table

---

## All API Routes to Build

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/health` | No | — | DB check — already built |
| POST | `/api/auth/sign-out` | Yes | all | Sign out — already built |
| GET | `/api/training` | Yes | all | List modules with user's assignment status |
| GET | `/api/training/[id]` | Yes | all | Single module + assignment + questions count |
| POST | `/api/training/[id]/enroll` | Yes | all | Create assignment (status=in_progress) |
| GET | `/api/assessments/[moduleId]` | Yes | all | Questions + options (no is_correct) |
| POST | `/api/assessments/[moduleId]/submit` | Yes | all | Score quiz → update assignment → issue cert → award badges |
| GET | `/api/certifications` | Yes | all | My certs |
| GET | `/api/certifications/[id]` | Yes | all | Single cert |
| GET | `/api/certifications/[id]/download` | Yes | all | Print-ready HTML cert |
| GET | `/api/notifications` | Yes | all | Notifications list |
| PATCH | `/api/notifications/[id]/read` | Yes | all | Mark read |
| PATCH | `/api/notifications/mark-all-read` | Yes | all | Mark all read |
| GET | `/api/analytics/dashboard` | Yes | all | Personal stats for dashboard widgets |
| GET | `/api/analytics/compliance` | Yes | manager+ | Org-wide compliance stats + charts data |
| GET | `/api/analytics/users` | Yes | manager+ | Per-user progress table data |
| GET | `/api/leaderboard` | Yes | all | Org leaderboard with points + ranks |
| GET | `/api/audit` | Yes | manager+ | Paginated audit log |
| GET | `/api/admin/users` | Yes | org_admin | All org users |
| PATCH | `/api/admin/users/[id]` | Yes | org_admin | Update role |
| DELETE | `/api/admin/users/[id]` | Yes | org_admin | Deactivate user |
| GET | `/api/admin/modules` | Yes | org_admin | All modules |
| POST | `/api/admin/modules` | Yes | org_admin | Create module |
| PUT | `/api/admin/modules/[id]` | Yes | org_admin | Update module |
| DELETE | `/api/admin/modules/[id]` | Yes | org_admin | Soft delete (is_active=false) |
| GET | `/api/admin/modules/[id]/questions` | Yes | org_admin | Module questions list |
| POST | `/api/admin/modules/[id]/questions` | Yes | org_admin | Add question + options |
| PUT | `/api/admin/questions/[id]` | Yes | org_admin | Update question |
| DELETE | `/api/admin/questions/[id]` | Yes | org_admin | Delete question |
| POST | `/api/admin/assign` | Yes | org_admin | Bulk assign module to user list |
| POST | `/api/ai/chat` | Yes | all | Streaming AI compliance chat |

---

## Complete Navigation Structure (What Must Be in the Sidebar)

### All roles:
- Dashboard `/dashboard`
- Training `/training`
- Certifications `/certifications`
- Notifications `/notifications`
- Leaderboard `/leaderboard`
- AI Assistant `/ai-assistant`
- Profile `/profile`

### Compliance Manager + Org Admin (additional):
- Compliance Report `/compliance`

### Org Admin only (additional):
- Admin → Users `/admin/users`
- Admin → Modules `/admin/modules`
- Admin → Audit Log `/admin/audit`

---

## Seed Data Improvements Needed

Update `db/seed.sql` to add:

1. **Richer module descriptions** — Each of the 10 modules needs 3-5 paragraphs of real HIPAA/HITECH/SOX/FDA content so the content player has something to display

2. **More questions** — All 10 modules should have 5-10 questions each (currently only 3 modules have questions)

3. **A demo org_admin user** — A pre-seeded user profile with role=`org_admin` so judges can log in as admin immediately (the auth user must still be created via sign-up, but instructions can guide this)

4. **Sample assignments + certifications** — For the demo org_admin user, pre-create some assignments in `completed` status and some certifications so the compliance dashboard shows real data immediately

---

## Packages to Install

```bash
npm install recharts @anthropic-ai/sdk zod clsx tailwind-merge
```

Add to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Build Execution Order for Codex CLI

Tell Codex to implement in this exact order — each phase depends on the previous:

```
Phase 1  → Redesign /dashboard (role-aware home with progress ring + next-up module)
Phase 2  → Redesign /training (catalogue with filters, module cards, proper CTA flow)
Phase 3  → Build /training/[id] (module detail with enroll CTA)
Phase 4  → Build /training/[id]/learn (content player)
Phase 5  → Build /training/[id]/quiz + quiz engine component + assessment API
Phase 6  → Redesign /certifications + build /certifications/[id] + download API
Phase 7  → Build /compliance (org-wide reporting with Recharts charts)
Phase 8  → Build /admin/users and /admin/users/[id]
Phase 9  → Build /admin/modules, /admin/modules/new, /admin/modules/[id]/edit, /admin/modules/[id]/questions
Phase 10 → Build /admin/audit (audit log viewer)
Phase 11 → Build /ai-assistant + /api/ai/chat (streaming Claude/OpenAI)
Phase 12 → Build /leaderboard + gamification + badges migration
Phase 13 → Build /profile page
Phase 14 → Update sidebar in (protected)/layout.tsx with all new navigation links
Phase 15 → Update seed.sql with richer content + more questions
```

---

## Hackathon Judging Checklist

- [ ] App loads at Vercel URL with visible populated data (no empty states on first visit)
- [ ] Sign up → auto-profile → dashboard loads with real data
- [ ] Learner can: browse modules → enroll → read content → take quiz → earn certificate
- [ ] Quiz auto-issues certificate on pass (≥80%) with real certificate number
- [ ] Certificate detail page shows visual certificate with download option
- [ ] Compliance manager sees org-wide compliance charts
- [ ] Org admin can create modules, manage users, view audit log
- [ ] AI chatbot answers HIPAA compliance questions with streaming response
- [ ] Leaderboard shows user rankings
- [ ] All pages responsive on mobile (375px)
- [ ] Navigation progress bar shows on every page transition
- [ ] Loading skeletons show while data fetches
- [ ] No console errors on core user flows
- [ ] Deployed to Vercel with all env vars set
- [ ] Public GitHub repo under Bacancy org
- [ ] README has: product name, Medscape as reference product, description, setup instructions

---

> *"This document is a developer blueprint — not a boundary. Think beyond, build better."*
