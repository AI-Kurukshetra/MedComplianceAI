# MedCompliance AI

Healthcare compliance training MVP built with:
- Next.js 16 (App Router)
- Supabase (Auth + Postgres + RLS)

## What Is Implemented

- Email/password authentication (sign up, sign in, sign out)
- Auth callback flow at `/auth/callback`
- Auto profile onboarding trigger on `auth.users`
- Protected dashboard at `/dashboard`
- Role-aware module creation (manager roles only)
- Self-assignment flow for modules
- Completion flow that issues certifications
- Notifications and audit logs
- Health endpoint at `/api/health`

## 1. Environment Setup

Create local env file:

```bash
cp .env.local.example .env.local
```

Fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or anon key)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional fallback)
- `NEXT_PUBLIC_SITE_URL` (for email confirmation redirect URL, e.g. `http://localhost:3000`)
- `SUPABASE_SERVICE_ROLE_KEY` (optional)

Supabase Auth settings (Dashboard -> Authentication -> URL Configuration):
- Site URL: your current app URL (for local: `http://localhost:3000`)
- Additional Redirect URLs: include `http://localhost:3000/auth/callback`
- If you run dev on another port, also add that callback URL (for example `http://localhost:3001/auth/callback`)

## 2. Supabase Migration + Seed

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --linked --include-seed
```

## 3. Run Locally

```bash
npm install
npm run dev
```

Open:
- `http://localhost:3000`
- `http://localhost:3000/api/health`

## 4. Core Routes

- `/` Landing page
- `/auth/sign-in` Sign in
- `/auth/sign-up` Sign up
- `/auth/callback` Auth callback
- `/dashboard` Protected compliance dashboard

## 5. Deployment Checks

```bash
npm run lint
npm run build
```
