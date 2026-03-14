-- ============================================================
-- MedCompliance AI - Schema
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  logo_url   text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name       text not null default '',
  email           text not null default '',
  role            text not null default 'learner'
                    check (role in ('org_admin', 'compliance_manager', 'learner')),
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.training_modules (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  title             text not null,
  description       text not null default '',
  content_markdown  text not null default '',
  regulation        text not null check (regulation in ('HIPAA', 'HITECH', 'SOX', 'FDA')),
  audience_role     text not null default 'all',
  estimated_minutes integer not null default 30,
  content_url       text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.questions (
  id              uuid primary key default gen_random_uuid(),
  module_id       uuid not null references public.training_modules(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  body            text not null,
  explanation     text not null default '',
  points          integer not null default 1,
  position        integer not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists public.question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  body        text not null,
  is_correct  boolean not null default false,
  position    integer not null default 0
);

create table if not exists public.module_assignments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  module_id       uuid not null references public.training_modules(id) on delete cascade,
  status          text not null default 'assigned'
                    check (status in ('assigned', 'in_progress', 'completed', 'overdue')),
  score           numeric(5,2),
  time_spent_minutes integer not null default 0
                    check (time_spent_minutes >= 0),
  assigned_at     timestamptz not null default now(),
  due_date        timestamptz,
  completed_at    timestamptz,
  unique (user_id, module_id)
);

create table if not exists public.assessment_attempts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  module_id       uuid not null references public.training_modules(id) on delete cascade,
  answers         jsonb not null default '[]',
  score           numeric(5,2) not null default 0,
  passed          boolean not null default false,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create table if not exists public.certifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  module_id       uuid not null references public.training_modules(id) on delete cascade,
  certificate_no  text unique not null,
  issued_at       timestamptz not null default now(),
  expires_at      timestamptz not null
);

create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  kind            text not null check (kind in ('due_soon', 'overdue', 'renewal', 'assignment', 'achievement')),
  title           text not null,
  message         text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id              bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id   uuid references public.profiles(id) on delete set null,
  action          text not null,
  entity_type     text not null,
  entity_id       text not null,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists profiles_org_idx on public.profiles (organization_id);
create index if not exists profiles_email_idx on public.profiles (email);

create index if not exists modules_org_active_idx on public.training_modules (organization_id, is_active);
create index if not exists modules_regulation_idx on public.training_modules (regulation);

create index if not exists questions_module_idx on public.questions (module_id);
create index if not exists options_question_idx on public.question_options (question_id);

create index if not exists assignments_org_user_idx on public.module_assignments (organization_id, user_id);
create index if not exists assignments_module_idx on public.module_assignments (module_id);
create index if not exists assignments_status_idx on public.module_assignments (status);
create index if not exists assignments_user_time_idx on public.module_assignments (user_id, time_spent_minutes);

create index if not exists attempts_user_module_idx on public.assessment_attempts (user_id, module_id);

create index if not exists certs_org_user_idx on public.certifications (organization_id, user_id);
create index if not exists certs_user_module_idx on public.certifications (user_id, module_id);

create index if not exists notif_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists notif_user_read_idx on public.notifications (user_id, read_at);

create index if not exists audit_org_created_idx on public.audit_logs (organization_id, created_at desc);
create index if not exists audit_actor_idx on public.audit_logs (actor_user_id);

-- ============================================================
-- Helper Functions
-- ============================================================

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_org_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('org_admin', 'compliance_manager'), false)
$$;

create or replace function public.healthcheck()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'ok', true,
    'checked_at', now(),
    'version', version()
  )
$$;

create or replace function public.normalize_org_slug(p_input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_input, '')), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.resolve_signup_organization(p_slug text)
returns table(id uuid, slug text, name text)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_slug text;
begin
  v_slug := public.normalize_org_slug(p_slug);

  if v_slug = '' then
    return;
  end if;

  return query
  select o.id, o.slug, o.name
  from public.organizations o
  where o.slug = v_slug
  limit 1;
end;
$$;

create or replace function public.provision_signup_organization(
  p_name text,
  p_slug text default null
)
returns table(id uuid, slug text, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_template_org_id uuid;
  v_org_id uuid;
  v_base_slug text;
  v_candidate_slug text;
  v_suffix integer := 1;
  module_rec record;
  question_rec record;
  v_new_module_id uuid;
  v_new_question_id uuid;
begin
  v_name := trim(coalesce(p_name, ''));
  if char_length(v_name) < 3 then
    raise exception 'Organization name must be at least 3 characters';
  end if;

  v_base_slug := public.normalize_org_slug(coalesce(nullif(trim(coalesce(p_slug, '')), ''), v_name));
  if v_base_slug = '' then
    raise exception 'Organization slug is invalid';
  end if;

  v_candidate_slug := v_base_slug;
  while exists (select 1 from public.organizations o where o.slug = v_candidate_slug) loop
    v_suffix := v_suffix + 1;
    v_candidate_slug := v_base_slug || '-' || v_suffix;

    if v_suffix > 50 then
      raise exception 'Could not allocate unique organization slug';
    end if;
  end loop;

  insert into public.organizations (slug, name)
  values (v_candidate_slug, v_name)
  returning organizations.id into v_org_id;

  select o.id
  into v_template_org_id
  from public.organizations o
  where o.slug = 'demo-clinic'
  limit 1;

  if v_template_org_id is not null then
    for module_rec in
      select
        tm.id,
        tm.title,
        tm.description,
        tm.regulation,
        tm.audience_role,
        tm.estimated_minutes,
        tm.content_url,
        tm.is_active
      from public.training_modules tm
      where tm.organization_id = v_template_org_id
        and tm.is_active = true
      order by tm.created_at asc
      limit 12
    loop
      insert into public.training_modules (
        organization_id,
        title,
        description,
        regulation,
        audience_role,
        estimated_minutes,
        content_url,
        is_active
      )
      values (
        v_org_id,
        module_rec.title,
        module_rec.description,
        module_rec.regulation,
        module_rec.audience_role,
        module_rec.estimated_minutes,
        module_rec.content_url,
        module_rec.is_active
      )
      returning training_modules.id into v_new_module_id;

      for question_rec in
        select
          q.id,
          q.body,
          q.explanation,
          q.points,
          q.position
        from public.questions q
        where q.organization_id = v_template_org_id
          and q.module_id = module_rec.id
        order by q.position asc, q.created_at asc
      loop
        insert into public.questions (
          module_id,
          organization_id,
          body,
          explanation,
          points,
          position
        )
        values (
          v_new_module_id,
          v_org_id,
          question_rec.body,
          question_rec.explanation,
          question_rec.points,
          question_rec.position
        )
        returning questions.id into v_new_question_id;

        insert into public.question_options (question_id, body, is_correct, position)
        select
          v_new_question_id,
          qo.body,
          qo.is_correct,
          qo.position
        from public.question_options qo
        where qo.question_id = question_rec.id
        order by qo.position asc;
      end loop;
    end loop;
  end if;

  return query
  select o.id, o.slug, o.name
  from public.organizations o
  where o.id = v_org_id;
end;
$$;

grant execute on function public.current_org_id() to anon, authenticated;
grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_org_manager() to anon, authenticated;
grant execute on function public.healthcheck() to anon, authenticated;
grant execute on function public.resolve_signup_organization(text) to anon, authenticated;
grant execute on function public.provision_signup_organization(text, text) to anon, authenticated;

-- ============================================================
-- Auth onboarding trigger
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_org_id uuid;
  fallback_org_id uuid;
  profile_role text;
  profile_name text;
begin
  begin
    requested_org_id := nullif(new.raw_user_meta_data ->> 'organization_id', '')::uuid;
  exception
    when others then requested_org_id := null;
  end;

  select id into fallback_org_id
  from public.organizations
  where slug = 'demo-clinic'
  limit 1;

  if fallback_org_id is null then
    insert into public.organizations (slug, name)
    values ('demo-clinic', 'Demo Clinic Medical Center')
    on conflict (slug) do update set name = excluded.name
    returning id into fallback_org_id;
  end if;

  profile_role := coalesce(nullif(trim(new.raw_user_meta_data ->> 'role'), ''), 'learner');
  if profile_role not in ('org_admin', 'compliance_manager', 'learner') then
    profile_role := 'learner';
  end if;

  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'User'
  );

  insert into public.profiles (id, organization_id, full_name, email, role)
  values (
    new.id,
    coalesce(requested_org_id, fallback_org_id),
    profile_name,
    coalesce(new.email, ''),
    profile_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- Starter profile data trigger (for new profiles)
-- ============================================================

create or replace function public.seed_user_starter_data(p_user_id uuid, p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  existing_cert_id uuid;
begin
  for rec in
    select
      tm.id as module_id,
      row_number() over (order by tm.created_at asc, tm.id asc) as rn
    from public.training_modules tm
    where tm.organization_id = p_organization_id
      and tm.is_active = true
    limit 4
  loop
    insert into public.module_assignments (
      organization_id,
      user_id,
      module_id,
      status,
      score,
      assigned_at,
      due_date,
      completed_at
    )
    values (
      p_organization_id,
      p_user_id,
      rec.module_id,
      case
        when rec.rn = 1 then 'completed'
        when rec.rn = 2 then 'in_progress'
        when rec.rn = 3 then 'assigned'
        else 'overdue'
      end,
      case when rec.rn = 1 then 92 else null end,
      now() - ((rec.rn + 4) * interval '1 day'),
      case
        when rec.rn = 1 then now() + interval '11 months'
        when rec.rn = 2 then now() + interval '7 days'
        when rec.rn = 3 then now() + interval '14 days'
        else now() - interval '2 days'
      end,
      case when rec.rn = 1 then now() - interval '2 days' else null end
    )
    on conflict (user_id, module_id) do nothing;

    if rec.rn = 1 then
      select c.id
      into existing_cert_id
      from public.certifications c
      where c.organization_id = p_organization_id
        and c.user_id = p_user_id
        and c.module_id = rec.module_id
      limit 1;

      if existing_cert_id is null then
        insert into public.certifications (
          organization_id,
          user_id,
          module_id,
          certificate_no,
          issued_at,
          expires_at
        )
        values (
          p_organization_id,
          p_user_id,
          rec.module_id,
          'CERT-' || to_char(now(), 'YYYYMMDD') || '-' ||
            upper(substr(replace(p_user_id::text, '-', ''), 1, 8)) || '-' ||
            upper(substr(replace(rec.module_id::text, '-', ''), 1, 8)) || '-AUTO',
          now() - interval '2 days',
          now() + interval '1 year'
        )
        on conflict (certificate_no) do nothing;
      end if;
    end if;
  end loop;

  insert into public.notifications (
    organization_id,
    user_id,
    kind,
    title,
    message,
    created_at
  )
  select
    p_organization_id,
    p_user_id,
    v.kind,
    v.title,
    v.message,
    v.created_at
  from (values
    ('assignment'::text, 'Welcome to MedCompliance', 'Your starter compliance modules are ready. Begin with HIPAA Privacy Rule Fundamentals.', now() - interval '1 day'),
    ('due_soon'::text, 'Training Due Soon', 'One assigned module is due in the next 7 days. Complete it to keep your compliance score high.', now() - interval '12 hours'),
    ('renewal'::text, 'Certification Active', 'A compliance certificate is now active on your profile.', now() - interval '2 hours')
  ) as v(kind, title, message, created_at)
  where not exists (
    select 1
    from public.notifications n
    where n.organization_id = p_organization_id
      and n.user_id = p_user_id
      and n.title = v.title
  );

  insert into public.audit_logs (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata,
    created_at
  )
  select
    p_organization_id,
    p_user_id,
    'profile_seeded',
    'profiles',
    p_user_id::text,
    jsonb_build_object('seeded', true),
    now()
  where not exists (
    select 1
    from public.audit_logs a
    where a.organization_id = p_organization_id
      and a.entity_type = 'profiles'
      and a.entity_id = p_user_id::text
      and a.action = 'profile_seeded'
  );
end;
$$;

create or replace function public.seed_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_user_starter_data(new.id, new.organization_id);
  return new;
end;
$$;

drop trigger if exists on_profile_seed_data on public.profiles;
create trigger on_profile_seed_data
after insert on public.profiles
for each row
execute function public.seed_new_profile();

-- ============================================================
-- RLS and policies
-- ============================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.training_modules enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.module_assignments enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.certifications enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Drop old policies if they exist

drop policy if exists organizations_select on public.organizations;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists modules_select_org on public.training_modules;
drop policy if exists modules_write_manager on public.training_modules;
drop policy if exists questions_select_org on public.questions;
drop policy if exists questions_write_manager on public.questions;
drop policy if exists options_select_org on public.question_options;
drop policy if exists options_write_manager on public.question_options;
drop policy if exists assignments_read_scope on public.module_assignments;
drop policy if exists assignments_insert_scope on public.module_assignments;
drop policy if exists assignments_update_scope on public.module_assignments;
drop policy if exists attempts_scope_access on public.assessment_attempts;
drop policy if exists certifications_read_scope on public.certifications;
drop policy if exists certifications_insert_scope on public.certifications;
drop policy if exists notifications_read_scope on public.notifications;
drop policy if exists notifications_insert_scope on public.notifications;
drop policy if exists notifications_update_scope on public.notifications;
drop policy if exists audit_read_manager on public.audit_logs;
drop policy if exists audit_insert_org on public.audit_logs;

-- Organizations
create policy organizations_select on public.organizations
  for select to authenticated
  using (id = public.current_org_id());

-- Profiles
create policy profiles_select on public.profiles
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Modules
create policy modules_select_org on public.training_modules
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy modules_write_manager on public.training_modules
  for all to authenticated
  using (
    organization_id = public.current_org_id()
    and public.is_org_manager()
  )
  with check (
    organization_id = public.current_org_id()
    and public.is_org_manager()
  );

-- Questions
create policy questions_select_org on public.questions
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy questions_write_manager on public.questions
  for all to authenticated
  using (
    organization_id = public.current_org_id()
    and public.is_org_manager()
  )
  with check (
    organization_id = public.current_org_id()
    and public.is_org_manager()
  );

-- Question options
create policy options_select_org on public.question_options
  for select to authenticated
  using (
    exists (
      select 1
      from public.questions q
      where q.id = question_options.question_id
        and q.organization_id = public.current_org_id()
    )
  );

create policy options_write_manager on public.question_options
  for all to authenticated
  using (
    exists (
      select 1
      from public.questions q
      where q.id = question_options.question_id
        and q.organization_id = public.current_org_id()
        and public.is_org_manager()
    )
  )
  with check (
    exists (
      select 1
      from public.questions q
      where q.id = question_options.question_id
        and q.organization_id = public.current_org_id()
        and public.is_org_manager()
    )
  );

-- Assignments
create policy assignments_read_scope on public.module_assignments
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  );

create policy assignments_insert_scope on public.module_assignments
  for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  );

create policy assignments_update_scope on public.module_assignments
  for update to authenticated
  using (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  )
  with check (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  );

-- Assessment attempts
create policy attempts_scope_access on public.assessment_attempts
  for all to authenticated
  using (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  )
  with check (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  );

-- Certifications
create policy certifications_read_scope on public.certifications
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  );

create policy certifications_insert_scope on public.certifications
  for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  );

-- Notifications
create policy notifications_read_scope on public.notifications
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  );

create policy notifications_insert_scope on public.notifications
  for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  );

create policy notifications_update_scope on public.notifications
  for update to authenticated
  using (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  )
  with check (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_org_manager())
  );

-- Audit logs
create policy audit_read_manager on public.audit_logs
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    and public.is_org_manager()
  );

create policy audit_insert_org on public.audit_logs
  for insert to authenticated
  with check (organization_id = public.current_org_id());
