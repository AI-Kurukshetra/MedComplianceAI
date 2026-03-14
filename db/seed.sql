-- ============================================================
-- MedCompliance AI - Seed
-- ============================================================

-- 1) Demo organization
insert into public.organizations (slug, name)
values ('demo-clinic', 'Demo Clinic Medical Center')
on conflict (slug) do update set name = excluded.name;

-- 2) Training modules with real video URLs
with module_data as (
  select * from (values
    ('HIPAA Privacy Rule Fundamentals', 'A comprehensive introduction to the HIPAA Privacy Rule covering patient rights, permitted disclosures, and minimum necessary standards.', 'HIPAA', 'all', 30, 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
    ('HIPAA Security Rule Essentials', 'Technical and administrative safeguards required under the HIPAA Security Rule for protecting electronic PHI.', 'HIPAA', 'it_staff', 45, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'),
    ('PHI Handling for Clinical Staff', 'Practical guidance on handling Protected Health Information in clinical settings, including documentation and verbal communication.', 'HIPAA', 'nurses', 25, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
    ('Incident Reporting & Breach Notification', 'How to identify, report, and respond to security incidents and breaches under HITECH breach notification requirements.', 'HITECH', 'all', 35, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
    ('Audit Trail Best Practices', 'Understanding audit controls, log management, and demonstrating compliance through complete and accurate audit trails.', 'HIPAA', 'admins', 20, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'),
    ('SOX Financial Controls Overview', 'Introduction to Sarbanes-Oxley internal controls, financial reporting requirements, and documentation standards for healthcare finance.', 'SOX', 'admins', 40, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
    ('FDA 21 CFR Part 11 Compliance', 'Electronic records and electronic signatures regulations under FDA 21 CFR Part 11 for clinical and laboratory systems.', 'FDA', 'it_staff', 50, 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'),
    ('Cybersecurity Awareness for Healthcare', 'Recognizing phishing, ransomware, and social engineering threats specific to the healthcare environment.', 'HIPAA', 'all', 30, 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'),
    ('HIPAA for New Employees', 'Onboarding module covering foundational HIPAA concepts, employee responsibilities, and common compliance pitfalls.', 'HIPAA', 'all', 20, 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'),
    ('Advanced HITECH Compliance', 'Deep dive into HITECH enforcement, penalty tiers, business associate agreements, and proactive compliance program design.', 'HITECH', 'compliance_manager', 45, 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4')
  ) as t(title, description, regulation, audience_role, estimated_minutes, content_url)
),
org as (
  select id as organization_id
  from public.organizations
  where slug = 'demo-clinic'
  limit 1
)
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
select
  o.organization_id,
  md.title,
  md.description,
  md.regulation,
  md.audience_role,
  md.estimated_minutes,
  md.content_url,
  true
from module_data md
cross join org o
where not exists (
  select 1
  from public.training_modules tm
  where tm.organization_id = o.organization_id
    and tm.title = md.title
);

-- 3) If modules exist already, ensure missing content URLs are patched
with urls as (
  select * from (values
    ('HIPAA Privacy Rule Fundamentals', 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
    ('HIPAA Security Rule Essentials', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'),
    ('PHI Handling for Clinical Staff', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
    ('Incident Reporting & Breach Notification', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'),
    ('Audit Trail Best Practices', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'),
    ('SOX Financial Controls Overview', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'),
    ('FDA 21 CFR Part 11 Compliance', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'),
    ('Cybersecurity Awareness for Healthcare', 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'),
    ('HIPAA for New Employees', 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'),
    ('Advanced HITECH Compliance', 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4')
  ) as t(title, content_url)
)
update public.training_modules tm
set content_url = u.content_url,
    updated_at = now()
from urls u
where tm.title = u.title
  and coalesce(tm.content_url, '') = '';

-- 4) Quiz data: create 3 starter questions for any module that has none

do $$
declare
  m record;
  q1 uuid;
  q2 uuid;
  q3 uuid;
begin
  for m in
    select id, organization_id, title
    from public.training_modules
    where is_active = true
  loop
    if not exists (select 1 from public.questions where module_id = m.id) then
      insert into public.questions (module_id, organization_id, body, explanation, points, position)
      values (
        m.id,
        m.organization_id,
        'What is the primary objective of "' || m.title || '"?',
        'This module focuses on enforcing healthcare compliance and secure handling practices.',
        1,
        1
      )
      returning id into q1;

      insert into public.question_options (question_id, body, is_correct, position) values
        (q1, 'Maintain compliance with healthcare regulations and patient data safeguards', true, 1),
        (q1, 'Reduce all training requirements to optional reading', false, 2),
        (q1, 'Share all data broadly without access controls', false, 3),
        (q1, 'Disable documentation and audit tracking', false, 4);

      insert into public.questions (module_id, organization_id, body, explanation, points, position)
      values (
        m.id,
        m.organization_id,
        'Which action best supports compliance readiness?',
        'Documented completion, timely reporting, and policy adherence improve readiness.',
        1,
        2
      )
      returning id into q2;

      insert into public.question_options (question_id, body, is_correct, position) values
        (q2, 'Complete assigned modules and keep evidence records current', true, 1),
        (q2, 'Skip module assessments if deadlines are near', false, 2),
        (q2, 'Store PHI in unapproved channels for convenience', false, 3),
        (q2, 'Ignore renewal and expiry notifications', false, 4);

      insert into public.questions (module_id, organization_id, body, explanation, points, position)
      values (
        m.id,
        m.organization_id,
        'Who should have access to sensitive compliance records?',
        'Access must follow least-privilege and role-based authorization.',
        1,
        3
      )
      returning id into q3;

      insert into public.question_options (question_id, body, is_correct, position) values
        (q3, 'Only authorized users based on role and business need', true, 1),
        (q3, 'Any authenticated user regardless of role', false, 2),
        (q3, 'All external vendors by default', false, 3),
        (q3, 'Public anonymous users for transparency', false, 4);
    end if;
  end loop;
end $$;

-- 5) Starter data backfill for existing profiles that have no assignments yet

do $$
declare
  p record;
begin
  for p in
    select pr.id, pr.organization_id
    from public.profiles pr
    where not exists (
      select 1
      from public.module_assignments ma
      where ma.user_id = pr.id
    )
  loop
    perform public.seed_user_starter_data(p.id, p.organization_id);
  end loop;
end $$;
