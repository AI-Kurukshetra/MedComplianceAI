-- ============================================================
-- MedCompliance AI - Reset (safe for repeated runs)
-- ============================================================

-- Drop triggers first

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profile_seed_data on public.profiles;

-- Drop functions

drop function if exists public.seed_new_profile() cascade;
drop function if exists public.seed_user_starter_data(uuid, uuid) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.current_org_id() cascade;
drop function if exists public.current_user_role() cascade;
drop function if exists public.is_org_manager() cascade;
drop function if exists public.healthcheck() cascade;
drop function if exists public.normalize_org_slug(text) cascade;
drop function if exists public.resolve_signup_organization(text) cascade;
drop function if exists public.provision_signup_organization(text, text) cascade;

-- Drop tables (children before parents)

drop table if exists public.assessment_attempts cascade;
drop table if exists public.question_options cascade;
drop table if exists public.questions cascade;
drop table if exists public.notifications cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.certifications cascade;
drop table if exists public.module_assignments cascade;
drop table if exists public.training_modules cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;

-- Optional future tables (if created later)

drop table if exists public.training_paths cascade;
drop table if exists public.documents cascade;
drop table if exists public.ai_chat_sessions cascade;
