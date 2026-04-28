-- Atualiza status de funcionalidades já concluídas e adiciona novos módulos

-- 1. Atualizar registros existentes para refletir estado atual
UPDATE public.technical_specs
SET
  status = 'Pronto',
  description = 'Busca dados adicionais como CNPJ, CNAE principal, razão social e situação cadastral via CNPJ.ws. Suporta atualização retroativa de clientes sem CNPJ cadastrado.',
  stack = '["Edge Functions (Deno)", "CNPJ.ws API", "Bitrix24 REST API"]'::jsonb,
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000002'::uuid;

UPDATE public.technical_specs
SET
  status = 'Pronto',
  description = 'Identificação de possíveis duplicidades usando similaridade fonética via pg_trgm. Matching por CNPJ exato, similaridade de nome e CNPJ base (8 dígitos) para filiais.',
  stack = '["PostgreSQL pg_trgm", "Algoritmo Fuzzy 3 Níveis", "Supabase Functions"]'::jsonb,
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000005'::uuid;

-- 2. Inserir novos registros para módulos Curva ABC Financeira e Análise de Carteira
INSERT INTO public.technical_specs (id, module, feature_title, stack, status, description)
VALUES
  -- Curva ABC Financeira
  (
    '00000000-0000-0000-0000-000000000010'::uuid,
    'Curva ABC Financeira',
    'Classificação ABC por MRR',
    '["React", "Recharts", "Supabase", "PostgreSQL"]'::jsonb,
    'Pronto',
    'Classifica automaticamente clientes em curvas A, B e C com base no MRR (Receita Mensal Recorrente). Categoria A: top 80% do faturamento; B: próximos 15%; C: últimos 5%.'
  ),
  (
    '00000000-0000-0000-0000-000000000011'::uuid,
    'Curva ABC Financeira',
    'Integração OAuth2 ContaAzul',
    '["OAuth2 Authorization Code", "Edge Functions (Deno)", "ContaAzul REST API"]'::jsonb,
    'Pronto',
    'Autenticação via OAuth2 com refresh token automático. Sincroniza serviços recorrentes do ContaAzul filtrando por periodicidade ativa, mapeando clientes por CNPJ com fallback por nome.'
  ),
  (
    '00000000-0000-0000-0000-000000000012'::uuid,
    'Curva ABC Financeira',
    'Sincronização Histórico Financeiro',
    '["Edge Functions (Deno)", "ContaAzul API v3", "Supabase"]'::jsonb,
    'Pronto',
    'Sincroniza o histórico de cobranças do ContaAzul para calcular MRR por cliente. Trata situações especiais: serviços com periodicidade NUNCA, clientes sem CNPJ e divergências cadastrais.'
  ),
  (
    '00000000-0000-0000-0000-000000000013'::uuid,
    'Curva ABC Financeira',
    'Resolução de Divergências CNPJ',
    '["PostgreSQL", "Edge Functions", "CNPJ.ws API"]'::jsonb,
    'Pronto',
    'Detecta e exibe divergências entre CNPJ do ContaAzul e Bitrix24. Permite ao operador definir o CNPJ correto diretamente na interface, propagando a atualização para o Bitrix e enriquecendo o CNAE.'
  ),
  (
    '00000000-0000-0000-0000-000000000014'::uuid,
    'Curva ABC Financeira',
    'Definição de CNPJ via Interface',
    '["React", "Edge Functions", "Bitrix24 REST API", "CNPJ.ws API"]'::jsonb,
    'Pronto',
    'Permite definir o CNPJ de clientes que não possuem cadastro no Bitrix24. Valida formato, busca CNAE automaticamente via CNPJ.ws e atualiza campos customizados no Bitrix24 sem alterar o nome fantasia.'
  ),
  (
    '00000000-0000-0000-0000-000000000015'::uuid,
    'Curva ABC Financeira',
    'Dialog Fontes de Dados',
    '["React", "Shadcn/UI Dialog", "Supabase"]'::jsonb,
    'Pronto',
    'Painel detalhado de todos os clientes Zion com CNPJ, CNAE, curva ABC e valor de contrato. Permite filtrar e corrigir divergências de CNPJ direto na listagem.'
  ),

  -- Análise de Carteira
  (
    '00000000-0000-0000-0000-000000000020'::uuid,
    'Análise de Carteira',
    'Potencial de Mercado por CNAE',
    '["Edge Functions (Deno)", "API Casa dos Dados", "PostgreSQL"]'::jsonb,
    'Pronto',
    'Consulta o total de empresas ativas no Brasil para cada CNAE presente na carteira Zion, usando a API Casa dos Dados. Resultado representa o tamanho total do mercado endereçável por segmento.'
  ),
  (
    '00000000-0000-0000-0000-000000000021'::uuid,
    'Análise de Carteira',
    'Taxa de Penetração por CNAE',
    '["PostgreSQL", "Cálculo Analítico"]'::jsonb,
    'Pronto',
    'Calcula o percentual de penetração Zion em cada segmento: (clientes_zion / potencial_mercado) × 100. Permite identificar segmentos com alta e baixa saturação.'
  ),
  (
    '00000000-0000-0000-0000-000000000022'::uuid,
    'Análise de Carteira',
    'Tendência de Mercado',
    '["PostgreSQL", "Lógica Comparativa Histórica"]'::jsonb,
    'Pronto',
    'Compara o potencial de mercado atual com a última execução de sincronização. Classifica o mercado como crescente, decrescente ou estável por CNAE.'
  ),
  (
    '00000000-0000-0000-0000-000000000023'::uuid,
    'Análise de Carteira',
    'Cache de Pesquisas de Mercado',
    '["PostgreSQL", "Supabase Edge Functions", "SHA-256 Hash"]'::jsonb,
    'Pronto',
    'Armazena resultados de consultas à API Casa dos Dados com validade de 30 dias. Evita chamadas redundantes e reduz consumo de cota da API via hash SHA-256 dos parâmetros de busca.'
  ),
  (
    '00000000-0000-0000-0000-000000000024'::uuid,
    'Análise de Carteira',
    'Sincronização Automática de Potencial',
    '["Edge Functions (Deno)", "API Casa dos Dados", "Supabase Cron"]'::jsonb,
    'Pronto',
    'Função sync-cnae-market-data-potencial processa todos os CNAEs da carteira iterativamente, com rate limiting de 600ms por chamada de API e fallback de cache para evitar throttling.'
  )
ON CONFLICT (id) DO UPDATE SET
  module = EXCLUDED.module,
  feature_title = EXCLUDED.feature_title,
  stack = EXCLUDED.stack,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  updated_at = NOW();
