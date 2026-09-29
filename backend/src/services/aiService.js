const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.generateStudyPlan = async (studentData) => {
  try {
    // 1. Lista dos modelos de produção ativos da Groq em ordem de preferência
    const preferredModels = [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'openai/gpt-oss-20b'
    ];

    // 2. Busca modelos disponíveis na conta
    const modelsList = await groq.models.list();
    const availableIds = modelsList.data.map(m => m.id);

    // 3. Escolhe o primeiro da lista de preferência que existe na conta
    const selectedModel = preferredModels.find(m => availableIds.includes(m)) || 'llama-3.1-8b-instant';

    console.log(`[Groq AI] Modelo selecionado para uso: ${selectedModel}`);

    const prompt = `
    Você é o assistente virtual pedagógico da plataforma de estudos "Nexo".
    Sua tarefa é analisar o desempenho do aluno e criar um plano de estudos personalizado para 1 semana.

    DADOS DO ALUNO:
    - Nome: ${studentData.name}
    - Objetivo Principal: ${studentData.main_goal}
    - Desempenho em Português: ${studentData.portuguese_score}%
    - Desempenho em Matemática: ${studentData.math_score}%
    - Pontos que precisam de atenção: ${studentData.weakness_topics.join(', ')}

    DIRETRIZES:
    1. Crie um cronograma estruturado de 5 dias (Dia 1 ao Dia 5).
    2. Para cada dia, recomende 1 tópico específico para estudar, o objetivo do dia e 1 termo exato para pesquisar no YouTube.
    3. Escreva um feedback pedagógico motivador para o aluno.

    RESPONDA EXCLUSIVAMENTE EM FORMATO JSON VALIDO, SEGUINDO ESTE SCHEMA:
    {
      "summary": "Resumo motivacional do plano...",
      "weekly_focus": "Onde o aluno deve focar nesta semana",
      "schedule": [
        {
          "day": "Dia 1 - Segunda-feira",
          "subject": "Matemática",
          "topic": "Nome do Tópico",
          "goal": "O que o aluno deve aprender",
          "youtube_query": "Termo de busca recomendado no YouTube"
        }
      ]
    }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente pedagógico que responde estritamente em formato JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: selectedModel,
      response_format: { type: 'json_object' }
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    return JSON.parse(responseContent);

  } catch (error) {
    console.error('DETALHE DO ERRO GROQ:', error);
    throw new Error(`Erro Groq AI: ${error.message}`);
  }
};