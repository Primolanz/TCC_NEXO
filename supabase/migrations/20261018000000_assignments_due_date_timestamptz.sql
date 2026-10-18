DO $$
DECLARE
  current_type text;
BEGIN
  SELECT data_type
    INTO current_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'assignments'
     AND column_name = 'due_date';

  IF current_type IS NULL THEN
    RAISE EXCEPTION 'Column public.assignments.due_date was not found';
  ELSIF current_type IN ('date', 'timestamp without time zone') THEN
    ALTER TABLE public.assignments
      ALTER COLUMN due_date TYPE timestamptz
      USING due_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
  ELSIF current_type <> 'timestamp with time zone' THEN
    RAISE EXCEPTION 'Unsupported type for public.assignments.due_date: %', current_type;
  END IF;
END $$;
