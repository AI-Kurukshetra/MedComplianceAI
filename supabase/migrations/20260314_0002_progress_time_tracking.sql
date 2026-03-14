alter table public.module_assignments
  add column if not exists time_spent_minutes integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'module_assignments_time_spent_minutes_check'
  ) then
    alter table public.module_assignments
      add constraint module_assignments_time_spent_minutes_check
      check (time_spent_minutes >= 0);
  end if;
end;
$$;

create index if not exists assignments_user_time_idx
  on public.module_assignments (user_id, time_spent_minutes);
