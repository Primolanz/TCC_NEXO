alter table public.assignment_submissions
  add column if not exists submitted_at timestamptz;

update public.assignment_submissions
set submitted_at = created_at
where submitted_at is null
  and created_at is not null
  and status = 'SUBMITTED';
