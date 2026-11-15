-- جدولي: شغّل الملف مرة واحدة من SQL Editor قبل زر «أرشفة الترم».
-- الأرشيف للوحة التحكم فقط، والطلبة مش هيشوفوه.

alter table public.settings add column if not exists ignore_bundle boolean not null default false;

create table if not exists public.term_archives (
  id uuid primary key default gen_random_uuid(),
  academic_year text not null default '',
  term text not null,
  label text not null,
  snapshot jsonb not null,
  lecture_count integer not null default 0,
  exam_count integer not null default 0,
  announcement_count integer not null default 0,
  holiday_count integer not null default 0,
  archived_by text not null default '',
  created_at timestamptz not null default now()
);

alter table public.term_archives enable row level security;

drop policy if exists "staff read archives" on public.term_archives;
create policy "staff read archives" on public.term_archives
for select to authenticated
using (public.current_role() in ('super_admin', 'admin'));

drop policy if exists "staff write archives" on public.term_archives;
create policy "staff write archives" on public.term_archives
for insert to authenticated
with check (public.current_role() in ('super_admin', 'admin'));

grant select, insert on public.term_archives to authenticated;
