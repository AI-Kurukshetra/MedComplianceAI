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

grant execute on function public.resolve_signup_organization(text) to anon, authenticated;
grant execute on function public.provision_signup_organization(text, text) to anon, authenticated;
