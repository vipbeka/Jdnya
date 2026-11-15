-- جدولي: شغّل الملف مرة واحدة من SQL Editor.
-- يفعّل وصول التغيير لحظيًا لصفحة الطالب، من غير ما يفتح جداول الإدارة.

do $$
declare
  name text;
begin
  foreach name in array array[
    'settings', 'sections', 'classes', 'lectures', 'exams', 'announcements', 'holidays', 'class_groups'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', name);
    end if;
  end loop;
end $$;
