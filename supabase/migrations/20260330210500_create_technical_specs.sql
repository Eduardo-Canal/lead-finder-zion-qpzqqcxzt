CREATE TABLE IF NOT EXISTS public.technical_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module TEXT NOT NULL,
    feature_title TEXT NOT NULL,
    stack JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Em desenvolvimento',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.technical_specs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Permitir leitura para todos os usuários autenticados" ON public.technical_specs;
CREATE POLICY "Permitir leitura para todos os usuários autenticados"
ON public.technical_specs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir alteração para administradores" ON public.technical_specs;
CREATE POLICY "Permitir alteração para administradores"
ON public.technical_specs FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN perfis_acesso pa ON p.perfil_id = pa.id
    WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN perfis_acesso pa ON p.perfil_id = pa.id
    WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
  )
);

-- Popular dados de exemplo iniciais se a tabela estiver vazia
INSERT INTO public.technical_specs (id, module, feature_title, stack, status, description)
VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'Prospecting', 'Busca Avançada de Leads', '["React", "Supabase Edge Functions", "API Casa dos Dados"]'::jsonb, 'Pronto', 'Permite buscar leads usando múltiplos filtros como CNAE, Localização, Porte e Status.'),
('00000000-0000-0000-0000-000000000002'::uuid, 'Prospecting', 'Enriquecimento de Dados', '["Edge Functions", "CNPJ.ws API"]'::jsonb, 'Em desenvolvimento', 'Busca dados adicionais como quadro societário, telefones e e-mails de forma automatizada.'),
('00000000-0000-0000-0000-000000000003'::uuid, 'Governance', 'Auditoria de Acessos', '["PostgreSQL Triggers", "Supabase Auth"]'::jsonb, 'Pronto', 'Registra log de atividades sensíveis realizadas pelos usuários para compliance.'),
('00000000-0000-0000-0000-000000000004'::uuid, 'Lead Management', 'Sincronização Bitrix24', '["Supabase Edge Functions", "Bitrix24 REST API"]'::jsonb, 'Pronto', 'Integração bidirecional de leads, oportunidades e status com o CRM Bitrix24.'),
('00000000-0000-0000-0000-000000000005'::uuid, 'Lead Management', 'Deduplicação de Empresas', '["PostgreSQL pg_trgm", "Fuzzy Search Algorithm"]'::jsonb, 'Em desenvolvimento', 'Identifica possíveis duplicidades de leads na base de dados comparando nomes foneticamente.'),
('00000000-0000-0000-0000-000000000006'::uuid, 'Inteligência Zion', 'Análise de Fit Operacional Clássico', '["JavaScript", "Heurísticas"]'::jsonb, 'Deprecado', 'Modelo inicial de pontuação de leads. Substituído pela nova versão analítica de clusters.'),
('00000000-0000-0000-0000-000000000007'::uuid, 'Inteligência Zion', 'Geração de Abordagem IA', '["OpenAI GPT-4", "Edge Functions Prompts"]'::jsonb, 'Pronto', 'Cria automaticamente sugestões de email e abordagem comercial persuasiva baseada no perfil e dores do lead.'),
('00000000-0000-0000-0000-000000000008'::uuid, 'Performance Dashboard', 'Dashboard de Vendas Real-time', '["Recharts", "Supabase Realtime Subscriptions"]'::jsonb, 'Em desenvolvimento', 'Métricas de conversão de leads e produtividade dos executivos atualizadas em tempo real na tela inicial.')
ON CONFLICT (id) DO NOTHING;
