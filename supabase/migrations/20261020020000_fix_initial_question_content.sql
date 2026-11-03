-- Padroniza o nome de Matemática nas questões do diagnóstico inicial.
update public.questions
set subject = 'Matemática'
where subject ilike '%mathemat%'
  and module = 'INITIAL';

-- Corrige a grafia em enunciados e alternativas sem alterar outras questões.
update public.questions
set statement = regexp_replace(statement, 'estabeleched', 'estabelecido', 'gi'),
    options = regexp_replace(options::text, 'estabeleched', 'estabelecido', 'gi')::jsonb
where module = 'INITIAL'
  and (
    statement ilike '%estabeleched%'
    or options::text ilike '%estabeleched%'
  );

-- Recria alternativas distintas para a questão do plural de "animal".
-- O índice correto é zero-based, conforme usado pelo banco de questões.
update public.questions
set options = jsonb_build_array('animais', 'animaises', 'animais-es', 'animas', 'animals'),
    correct_option = 0
where module = 'INITIAL'
  and statement ilike '%animal%'
  and statement ilike '%plural%';
