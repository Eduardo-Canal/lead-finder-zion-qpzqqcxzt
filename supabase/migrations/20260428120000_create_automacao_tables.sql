DO $$
BEGIN

  -- ============================================================
  -- TABELA: automacao_config
  -- Configurações de campanhas/automações de busca de leads.
  -- Cada linha representa uma campanha (recorrente ou por período).
  -- ============================================================
  CREATE TABLE IF NOT EXISTS public.automacao_config (
    id                            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                          TEXT        NOT NULL,
    descricao                     TEXT,

    -- Filtros de busca (Casa dos Dados)
    cnaes                         TEXT[]      NOT NULL DEFAULT '{}',
    ufs                           TEXT[]      DEFAULT NULL,       -- NULL = todos os estados
    portes                        TEXT[]      DEFAULT NULL,       -- NULL = todos: MEI, ME, EPP, DEMAIS
    municipios                    TEXT[]      DEFAULT NULL,       -- NULL = todos os municípios
    limite_por_execucao           INT         NOT NULL DEFAULT 50,

    -- Contexto para geração de abordagem pela IA (generate-commercial-approach)
    contexto_ia                   TEXT,

    -- Destino no Bitrix24
    bitrix_pipeline_id            TEXT,
    bitrix_stage_id               TEXT,
    bitrix_notification_group_id  TEXT,       -- ID do grupo para notificação noturna

    -- Agendamento
    tipo                          TEXT        NOT NULL DEFAULT 'recorrente'
                                              CHECK (tipo IN ('recorrente', 'campanha')),
    cron_expressao                TEXT        DEFAULT '0 2 * * *',   -- padrão: 2h da manhã
    data_inicio                   DATE        DEFAULT CURRENT_DATE,
    data_fim                      DATE,       -- NULL = sem data de encerramento

    -- Controle
    ativo                         BOOLEAN     NOT NULL DEFAULT true,
    criado_por                    UUID        REFERENCES auth.users(id),
    criado_em                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em                 TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_automacao_config_ativo
    ON public.automacao_config(ativo);

  CREATE INDEX IF NOT EXISTS idx_automacao_config_tipo
    ON public.automacao_config(tipo);

  ALTER TABLE public.automacao_config ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Admin full access on automacao_config" ON public.automacao_config;
  CREATE POLICY "Admin full access on automacao_config" ON public.automacao_config
    FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM profiles p JOIN perfis_acesso pa ON p.perfil_id = pa.id
      WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM profiles p JOIN perfis_acesso pa ON p.perfil_id = pa.id
      WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ));

  DROP POLICY IF EXISTS "Authenticated read on automacao_config" ON public.automacao_config;
  CREATE POLICY "Authenticated read on automacao_config" ON public.automacao_config
    FOR SELECT TO authenticated
    USING (true);


  -- ============================================================
  -- TABELA: execucoes_automacao
  -- Log de cada run da automação noturna.
  -- Uma linha por execução de cada campanha.
  -- ============================================================
  CREATE TABLE IF NOT EXISTS public.execucoes_automacao (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    automacao_config_id     UUID        NOT NULL
                                        REFERENCES public.automacao_config(id)
                                        ON DELETE CASCADE,

    iniciado_em             TIMESTAMPTZ NOT NULL DEFAULT now(),
    finalizado_em           TIMESTAMPTZ,
    status                  TEXT        NOT NULL DEFAULT 'executando'
                                        CHECK (status IN ('executando', 'concluido', 'erro')),

    -- Métricas do run
    leads_encontrados       INT         NOT NULL DEFAULT 0,
    leads_novos             INT         NOT NULL DEFAULT 0,
    leads_duplicados        INT         NOT NULL DEFAULT 0,
    leads_enviados_bitrix   INT         NOT NULL DEFAULT 0,

    erro_mensagem           TEXT,
    metadata                JSONB       DEFAULT '{}'
  );

  CREATE INDEX IF NOT EXISTS idx_execucoes_automacao_config_id
    ON public.execucoes_automacao(automacao_config_id);

  CREATE INDEX IF NOT EXISTS idx_execucoes_automacao_status
    ON public.execucoes_automacao(status);

  CREATE INDEX IF NOT EXISTS idx_execucoes_automacao_iniciado_em
    ON public.execucoes_automacao(iniciado_em DESC);

  ALTER TABLE public.execucoes_automacao ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Admin full access on execucoes_automacao" ON public.execucoes_automacao;
  CREATE POLICY "Admin full access on execucoes_automacao" ON public.execucoes_automacao
    FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM profiles p JOIN perfis_acesso pa ON p.perfil_id = pa.id
      WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM profiles p JOIN perfis_acesso pa ON p.perfil_id = pa.id
      WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ));

  DROP POLICY IF EXISTS "Authenticated read on execucoes_automacao" ON public.execucoes_automacao;
  CREATE POLICY "Authenticated read on execucoes_automacao" ON public.execucoes_automacao
    FOR SELECT TO authenticated
    USING (true);


  -- ============================================================
  -- TABELA: leads_automacao_pendentes
  -- Fila de leads gerados pelas automações noturnas.
  -- Leads vão direto para o Bitrix24 e são rastreados aqui.
  -- ============================================================
  CREATE TABLE IF NOT EXISTS public.leads_automacao_pendentes (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    automacao_config_id     UUID        NOT NULL
                                        REFERENCES public.automacao_config(id)
                                        ON DELETE CASCADE,
    execucao_id             UUID        REFERENCES public.execucoes_automacao(id)
                                        ON DELETE SET NULL,

    -- Dados da empresa (da Casa dos Dados)
    cnpj                    TEXT        NOT NULL,
    razao_social            TEXT,
    cnae_principal          TEXT,
    municipio               TEXT,
    uf                      TEXT,
    porte                   TEXT,
    email                   TEXT,
    telefone                TEXT,
    dados_completos         JSONB       DEFAULT '{}',  -- payload completo da Casa dos Dados

    -- IA
    sugestao_abordagem      TEXT,       -- gerada por generate-commercial-approach com contexto_ia
    score_relevancia        FLOAT       DEFAULT 0,

    -- Funil de status
    -- pendente       → aguardando envio para Bitrix (breve janela durante batch)
    -- enviado_bitrix → enviado com sucesso para o Bitrix24
    -- erro_envio     → falha no envio para o Bitrix
    -- contatado      → SDR realizou primeiro contato
    -- interessado    → lead demonstrou interesse
    -- nao_interessado → lead descartado
    status                  TEXT        NOT NULL DEFAULT 'pendente'
                                        CHECK (status IN (
                                          'pendente',
                                          'enviado_bitrix',
                                          'erro_envio',
                                          'contatado',
                                          'interessado',
                                          'nao_interessado'
                                        )),
    bitrix_lead_id          TEXT,       -- ID do lead criado no Bitrix24

    -- Rastreabilidade SDR
    revisado_por            UUID        REFERENCES auth.users(id),
    revisado_em             TIMESTAMPTZ,
    observacao_sdr          TEXT,

    encontrado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- ============================================================
    -- RESERVADO — Etapa futura: primeiro contato automatizado
    --
    -- contato_auto_canal           TEXT,        -- 'email' | 'whatsapp'
    -- contato_auto_enviado_em      TIMESTAMPTZ,
    -- contato_auto_template        TEXT,
    -- contato_auto_respondeu       BOOLEAN,
    -- contato_auto_respondeu_em    TIMESTAMPTZ,
    -- contato_auto_resposta        TEXT,
    -- ============================================================

    UNIQUE(cnpj, automacao_config_id)   -- mesmo lead não entra duas vezes na mesma campanha
  );

  CREATE INDEX IF NOT EXISTS idx_leads_automacao_config_id
    ON public.leads_automacao_pendentes(automacao_config_id);

  CREATE INDEX IF NOT EXISTS idx_leads_automacao_execucao_id
    ON public.leads_automacao_pendentes(execucao_id);

  CREATE INDEX IF NOT EXISTS idx_leads_automacao_status
    ON public.leads_automacao_pendentes(status);

  CREATE INDEX IF NOT EXISTS idx_leads_automacao_cnpj
    ON public.leads_automacao_pendentes(cnpj);

  CREATE INDEX IF NOT EXISTS idx_leads_automacao_encontrado_em
    ON public.leads_automacao_pendentes(encontrado_em DESC);

  ALTER TABLE public.leads_automacao_pendentes ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Admin full access on leads_automacao_pendentes" ON public.leads_automacao_pendentes;
  CREATE POLICY "Admin full access on leads_automacao_pendentes" ON public.leads_automacao_pendentes
    FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM profiles p JOIN perfis_acesso pa ON p.perfil_id = pa.id
      WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM profiles p JOIN perfis_acesso pa ON p.perfil_id = pa.id
      WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    ));

  DROP POLICY IF EXISTS "Authenticated read on leads_automacao_pendentes" ON public.leads_automacao_pendentes;
  CREATE POLICY "Authenticated read on leads_automacao_pendentes" ON public.leads_automacao_pendentes
    FOR SELECT TO authenticated
    USING (true);

  DROP POLICY IF EXISTS "Authenticated update status on leads_automacao_pendentes" ON public.leads_automacao_pendentes;
  CREATE POLICY "Authenticated update status on leads_automacao_pendentes" ON public.leads_automacao_pendentes
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

END $$;
