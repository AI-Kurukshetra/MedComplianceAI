alter table public.training_modules
  add column if not exists content_markdown text not null default '';
