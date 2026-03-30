CREATE TABLE IF NOT EXISTS public.documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.documentation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documentation_id UUID NOT NULL REFERENCES public.documentation(id) ON DELETE CASCADE,
    old_description TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_history ENABLE ROW LEVEL SECURITY;

-- Read policies for documentation
DROP POLICY IF EXISTS "Enable SELECT for authenticated users" ON public.documentation;
CREATE POLICY "Enable SELECT for authenticated users" ON public.documentation
    FOR SELECT TO authenticated USING (true);

-- Write policies for documentation (Admin only)
DROP POLICY IF EXISTS "Enable INSERT for admins" ON public.documentation;
CREATE POLICY "Enable INSERT for admins" ON public.documentation
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ));

DROP POLICY IF EXISTS "Enable UPDATE for admins" ON public.documentation;
CREATE POLICY "Enable UPDATE for admins" ON public.documentation
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ));

DROP POLICY IF EXISTS "Enable DELETE for admins" ON public.documentation;
CREATE POLICY "Enable DELETE for admins" ON public.documentation
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ));

-- Read policies for documentation_history
DROP POLICY IF EXISTS "Enable SELECT for authenticated users" ON public.documentation_history;
CREATE POLICY "Enable SELECT for authenticated users" ON public.documentation_history
    FOR SELECT TO authenticated USING (true);

-- Write policies for documentation_history
DROP POLICY IF EXISTS "Enable INSERT for admins" ON public.documentation_history;
CREATE POLICY "Enable INSERT for admins" ON public.documentation_history
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ));

DROP POLICY IF EXISTS "Enable UPDATE for admins" ON public.documentation_history;
CREATE POLICY "Enable UPDATE for admins" ON public.documentation_history
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ));

DROP POLICY IF EXISTS "Enable DELETE for admins" ON public.documentation_history;
CREATE POLICY "Enable DELETE for admins" ON public.documentation_history
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.documentation) THEN
    INSERT INTO public.documentation (id, module, feature_name, description, updated_at) VALUES
      (gen_random_uuid(), 'prospecting', 'Busca Avançada', 'Utilize filtros avançados como CNAE, Localização (UF/Município) e Porte para encontrar leads altamente segmentados diretamente nas bases da Receita Federal e Casa dos Dados.', '2026-03-25T14:30:00Z'),
      (gen_random_uuid(), 'prospecting', 'Enriquecimento de Dados', 'Rotina automática que consulta provedores externos para buscar informações complementares de contato, como e-mails de sócios, telefones secundários e faturamento estimado.', '2026-03-24T09:15:00Z'),
      (gen_random_uuid(), 'prospecting', 'Validação de CNPJ', 'Serviço embutido nas Edge Functions para garantir que apenas CNPJs válidos e formatados corretamente sejam processados e enviados ao CRM.', '2026-03-20T11:20:00Z'),
      (gen_random_uuid(), 'governance', 'Gestão de Usuários (RBAC)', 'Módulo administrativo para criação, bloqueio e exclusão de usuários, com controle de acesso granular baseado em perfis (Administrador, Executivo, etc).', '2026-03-22T10:00:00Z'),
      (gen_random_uuid(), 'governance', 'Auditoria do Sistema', 'Registro imutável de todas as ações sensíveis realizadas no sistema, incluindo visualizações, edições e exportações, garantindo total rastreabilidade.', '2026-03-26T16:45:00Z'),
      (gen_random_uuid(), 'governance', 'Controle de Acessos Suspeitos', 'Monitoramento contínuo de atividades anômalas, como múltiplos logins simultâneos ou acesso a bases sensíveis fora do horário comercial (alerta de severidade alta).', '2026-03-25T08:10:00Z'),
      (gen_random_uuid(), 'lead-management', 'Meus Leads (CRM Kanban)', 'Painel visual no formato Kanban que permite arrastar e soltar (Drag and Drop) os leads entre as diferentes etapas do funil de prospecção.', '2026-03-26T10:20:00Z'),
      (gen_random_uuid(), 'lead-management', 'Sincronização Bitrix24', 'Mecanismo robusto que envia os leads salvos diretamente para o Bitrix24 como Negócios (Deals), utilizando sistema de Rate Limit e retentativas automáticas (Retry).', '2026-03-23T15:50:00Z'),
      (gen_random_uuid(), 'lead-management', 'Deduplicação de Empresas', 'Sistema inteligente de Fuzzy Matching que detecta e alerta sobre possíveis empresas duplicadas na base antes do envio para o CRM, comparando CNPJ e Razão Social.', '2026-03-21T14:05:00Z'),
      (gen_random_uuid(), 'lead-management', 'Lembretes de Follow-up', 'Notificações automáticas na plataforma e alertas via e-mail para lembrar o executivo de retomar contato com leads que estão há muito tempo na mesma fase do funil.', '2026-03-19T09:30:00Z'),
      (gen_random_uuid(), 'inteligencia-zion', 'Clusters Estratégicos', 'Agrupamento automatizado de setores (CNAEs) com base na performance histórica da carteira, indicando quais segmentos possuem maior prioridade e oportunidade.', '2026-03-24T11:45:00Z'),
      (gen_random_uuid(), 'inteligencia-zion', 'Geração de Abordagem (IA)', 'Integração com a OpenAI (GPT-4) que analisa os dados do lead (CNAE, porte, dores) e gera automaticamente um texto persuasivo para e-mail ou LinkedIn.', '2026-03-25T13:10:00Z'),
      (gen_random_uuid(), 'inteligencia-zion', 'Fit Operacional Score', 'Algoritmo que calcula uma pontuação para cada CNAE avaliando a taxa de sucesso de fechamento e o ticket médio histórico para guiar a prospecção.', '2026-03-22T17:30:00Z'),
      (gen_random_uuid(), 'performance-dashboard', 'Métricas Principais', 'Visão geral na tela inicial (Dashboard) apresentando o total de leads gerados, oportunidades criadas, leads convertidos e a taxa de conversão global.', '2026-03-26T08:00:00Z'),
      (gen_random_uuid(), 'performance-dashboard', 'Análise de Carteira', 'Gráficos interativos (Recharts) que demonstram a distribuição da carteira ativa por segmento, ticket médio e localização geográfica.', '2026-03-25T18:20:00Z'),
      (gen_random_uuid(), 'performance-dashboard', 'Monitoramento de APIs', 'Painel técnico voltado para administradores que exibe o tempo de resposta, volume de chamadas e erros detalhados das integrações Casa dos Dados e Bitrix24.', '2026-03-23T12:15:00Z');
  END IF;
END $$;
