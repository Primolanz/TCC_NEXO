alter table public.assignment_submissions
  add column if not exists text_content text;
