-- قاعدة معرفة "اسأل جدولي": أسئلة وأجوبة رسمية تتعدل من لوحة التحكم.
-- شغّل الملف مرة واحدة من محرر SQL في سوبا بيس.
alter table public.settings add column if not exists assistant_kb text not null default '';
