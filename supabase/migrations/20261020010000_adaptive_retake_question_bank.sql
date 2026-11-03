alter table public.questions
  add column if not exists module text not null default 'INITIAL',
  add column if not exists is_initial boolean not null default true;

update public.questions
set module = 'INITIAL', is_initial = true
where module is null;

alter table public.diagnostics
  add column if not exists module text not null default 'INITIAL';

create table if not exists public.study_plan_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  study_plan_id uuid not null references public.study_plans(id) on delete cascade,
  day_index integer not null check (day_index >= 0),
  topic text not null default '',
  subject text not null default '',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (study_plan_id, day_index)
);

create index if not exists study_plan_progress_user_plan_idx
  on public.study_plan_progress (user_id, study_plan_id);

insert into public.questions (subject, topic, statement, options, correct_option, module, is_initial)
select item.subject, item.topic, item.statement, item.options::jsonb, item.correct_option, 'RETAKE', false
from (values
  ('Língua Portuguesa', 'Sintaxe', 'Na frase “Os estudantes revisaram o conteúdo com atenção”, qual é o sujeito?', '["com atenção", "o conteúdo", "Os estudantes", "revisaram", "atenção"]', 2),
  ('Língua Portuguesa', 'Concordância verbal', 'Assinale a frase com concordância verbal adequada.', '["Fazem dois anos que estudo aqui.", "Houveram mudanças no calendário.", "Existem boas razões para revisar.", "A turma chegaram cedo.", "Devem haver novas aulas."]', 2),
  ('Língua Portuguesa', 'Pontuação', 'Em “Quando terminou a leitura, Marina anotou as dúvidas”, a vírgula separa:', '["um vocativo", "uma oração adverbial deslocada", "o sujeito do verbo", "um aposto explicativo", "termos de uma enumeração"]', 1),
  ('Língua Portuguesa', 'Coesão textual', 'Leia: “Rafaela encontrou um caderno. Ela o guardou na mochila.” A palavra “o” retoma:', '["Rafaela", "mochila", "encontrou", "caderno", "guardou"]', 3),
  ('Língua Portuguesa', 'Figuras de linguagem', 'Na expressão “A notícia correu pela escola”, ocorre:', '["metáfora", "eufemismo", "hipérbole", "ironia", "antítese"]', 0),
  ('Língua Portuguesa', 'Gêneros textuais', 'Um texto que apresenta ingredientes e instruções ordenadas para preparar um prato pertence principalmente ao gênero:', '["editorial", "relato", "receita", "crônica", "verbete"]', 2),
  ('Língua Portuguesa', 'Interpretação de texto', 'Um cartaz diz: “Leve sua garrafa reutilizável. Menos descartáveis, mais cuidado com o bairro.” Qual é o objetivo principal?', '["narrar uma lembrança", "ensinar uma receita", "convencer o leitor a reduzir descartáveis", "descrever uma paisagem", "anunciar um resultado esportivo"]', 2),
  ('Língua Portuguesa', 'Regência verbal', 'Complete conforme a norma-padrão: “A pesquisadora assistiu ___ palestra sobre leitura.”', '["à", "a", "na", "pela", "com a"]', 0),
  ('Língua Portuguesa', 'Classes de palavras', 'Na frase “O grupo caminhou lentamente”, a palavra “lentamente” modifica:', '["o substantivo grupo", "o verbo caminhou", "o artigo o", "a frase seguinte", "um pronome oculto"]', 1),
  ('Língua Portuguesa', 'Variação linguística', 'Uma diferença de pronúncia entre regiões do Brasil é exemplo de variação:', '["histórica", "geográfica", "situacional apenas", "técnica", "individual sem contexto"]', 1),
  ('Língua Portuguesa', 'Orações coordenadas', 'Em “Estudei bastante, portanto me senti mais confiante”, a conjunção “portanto” expressa ideia de:', '["oposição", "causa", "conclusão", "alternância", "explicação"]', 2),
  ('Língua Portuguesa', 'Acentuação', 'Qual palavra está acentuada por ser proparoxítona?', '["café", "também", "lâmpada", "país", "avó"]', 2),
  ('Língua Portuguesa', 'Sintaxe', 'Em “A biblioteca permaneceu silenciosa”, o termo “silenciosa” funciona como:', '["objeto direto", "predicativo do sujeito", "adjunto adverbial", "complemento nominal", "vocativo"]', 1),
  ('Língua Portuguesa', 'Pontuação', 'Qual alternativa usa corretamente os dois-pontos?', '["Trouxe: lápis, caderno e régua.", "Ela explicou: que chegaria cedo.", "O aviso dizia: “A sala está fechada”.", "Os alunos: estudaram juntos.", "Hoje: é dia de prova."]', 2),
  ('Língua Portuguesa', 'Interpretação de texto', '“Embora estivesse cansado, Pedro terminou o experimento.” A palavra “embora” introduz uma ideia de:', '["concessão", "finalidade", "consequência", "comparação", "proporção"]', 0),
  ('Matemática', 'Frações', 'Uma jarra tinha 3/4 de litro de suco. Foram servidos 1/3 de litro. Quanto restou?', '["1/12 L", "5/12 L", "7/12 L", "2/3 L", "1/2 L"]', 1),
  ('Matemática', 'Geometria', 'Um retângulo mede 8 cm por 5 cm. Qual é seu perímetro?', '["13 cm", "26 cm", "40 cm", "80 cm", "30 cm"]', 1),
  ('Matemática', 'Porcentagem', 'Uma mochila de R$ 120 recebeu desconto de 15%. Qual é o novo preço?', '["R$ 18", "R$ 98", "R$ 102", "R$ 105", "R$ 108"]', 2),
  ('Matemática', 'Razão e proporção', 'Se 4 cadernos custam R$ 36, mantendo o mesmo preço por unidade, quanto custam 7 cadernos?', '["R$ 54", "R$ 56", "R$ 63", "R$ 72", "R$ 81"]', 2),
  ('Matemática', 'Equações', 'Qual valor de x resolve 3x - 7 = 20?', '["7", "8", "9", "10", "11"]', 2),
  ('Matemática', 'Geometria', 'Um triângulo tem base de 10 cm e altura de 6 cm. Qual é sua área?', '["16 cm²", "30 cm²", "32 cm²", "60 cm²", "80 cm²"]', 1),
  ('Matemática', 'Números decimais', 'Uma fita de 2,4 m foi dividida em 6 partes iguais. Qual é o comprimento de cada parte?', '["0,04 m", "0,4 m", "1,4 m", "4 m", "14,4 m"]', 1),
  ('Matemática', 'Média aritmética', 'As notas de Lia foram 6, 8 e 10. Qual é a média aritmética?', '["7", "7,5", "8", "8,5", "9"]', 2),
  ('Matemática', 'Potenciação', 'Qual é o valor de 2³ × 2²?', '["16", "24", "32", "64", "128"]', 2),
  ('Matemática', 'Probabilidade', 'Uma caixa tem 3 bolas azuis e 2 vermelhas. Ao retirar uma bola ao acaso, qual é a probabilidade de ela ser vermelha?', '["1/5", "2/5", "1/2", "3/5", "2/3"]', 1),
  ('Matemática', 'Geometria', 'Um ângulo mede 128°. Qual é sua classificação?', '["agudo", "reto", "obtuso", "raso", "completo"]', 2),
  ('Matemática', 'Frações', 'Qual fração é equivalente a 5/8?', '["10/12", "15/24", "20/28", "25/32", "30/56"]', 1),
  ('Matemática', 'Expressões numéricas', 'Calcule 18 - 2 × (3 + 4).', '["4", "14", "28", "32", "112"]', 0),
  ('Matemática', 'Razão e proporção', 'Em um mapa, 1 cm representa 5 km. Uma distância de 7 cm no mapa corresponde a:', '["12 km", "25 km", "30 km", "35 km", "40 km"]', 3),
  ('Matemática', 'Porcentagem', 'Em uma turma de 40 estudantes, 30% participam do clube de ciências. Quantos estudantes são?', '["10", "12", "14", "18", "30"]', 1)
) as item(subject, topic, statement, options, correct_option)
where not exists (
  select 1 from public.questions existing
  where lower(trim(existing.statement)) = lower(trim(item.statement))
);
