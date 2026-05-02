-- ============================================================
-- MÓDULO WHATSAPP AUTOMATION — LeadFinderZion
-- Cobre: número principal, executivos, grupos de feira,
--        chatbot, fila outbound e co-piloto IA
-- ============================================================

-- ------------------------------------------------------------
-- 1. CONFIGURAÇÃO GLOBAL DO MÓDULO
--    Singleton (id = 1). Horário comercial, responsável padrão,
--    prompt base do bot e credenciais uazapi.dev.
-- ------------------------------------------------------------
CREATE TABLE public.whatsapp_module_config (
  id                    INT PRIMARY KEY DEFAULT 1,
  uazapi_base_url       TEXT NOT NULL DEFAULT 'https://api.uazapi.dev',
  uazapi_global_token   TEXT NOT NULL DEFAULT '',
  horario_inicio        TIME NOT NULL DEFAULT '08:00',
  horario_fim           TIME NOT NULL DEFAULT '18:00',
  dias_semana           INT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  responsavel_bitrix_id TEXT NOT NULL DEFAULT '',
  responsavel_nome      TEXT NOT NULL DEFAULT '',
  prompt_base           TEXT NOT NULL DEFAULT 'Você é assistente virtual da Zionlogtec, empresa de tecnologia logística. Responda perguntas com objetividade e cordialidade. Quando o lead demonstrar interesse em falar com um atendente, ofereça agendamento. Não invente preços ou prazos.',
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT whatsapp_module_config_singleton CHECK (id = 1)
);

INSERT INTO public.whatsapp_module_config (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. INSTÂNCIAS uazapi.dev
--    Cada linha = um número conectado (principal ou executivo).
--    Tipo 'principal' = número da Débora / número de testes.
--    Tipo 'executivo' = números dos vendedores Zion.
--    Sem número fixo em código — tudo gerenciado por aqui.
-- ------------------------------------------------------------
CREATE TABLE public.whatsapp_instances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              TEXT NOT NULL,
  numero            TEXT NOT NULL DEFAULT '',
  tipo              TEXT NOT NULL DEFAULT 'principal'
                      CHECK (tipo IN ('principal', 'executivo')),
  instance_key      TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'desconectado'
                      CHECK (status IN ('desconectado', 'conectando', 'conectado', 'erro')),
  bitrix_user_id    TEXT,
  bitrix_user_nome  TEXT,
  ativo             BOOLEAN NOT NULL DEFAULT true,
  ultimo_ping       TIMESTAMPTZ,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX whatsapp_instances_principal_unico
  ON public.whatsapp_instances (tipo)
  WHERE tipo = 'principal' AND ativo = true;

-- ------------------------------------------------------------
-- 3. CONVERSAS
--    Uma linha por par (instância + número do contato).
--    Armazena o estado atual do chatbot e dados de agendamento.
-- ------------------------------------------------------------
CREATE TABLE public.whatsapp_conversations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id          UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  phone                TEXT NOT NULL,
  contact_name         TEXT,
  bitrix_entity_id     TEXT,
  bitrix_entity_type   TEXT CHECK (bitrix_entity_type IN ('lead', 'deal', 'contact', 'company')),
  estado               TEXT NOT NULL DEFAULT 'INICIO'
                         CHECK (estado IN (
                           'INICIO','CONVERSANDO','OFERTA_AGENDAMENTO',
                           'COLETANDO_DIA','COLETANDO_HORARIO','AGENDADO','HUMANO'
                         )),
  bot_ativo            BOOLEAN NOT NULL DEFAULT true,
  agendamento_dia      TEXT,
  agendamento_hora     TEXT,
  automacao_config_id  UUID REFERENCES public.automacao_config(id) ON DELETE SET NULL,
  ultimo_contato       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (instance_id, phone)
);

CREATE INDEX whatsapp_conversations_phone_idx ON public.whatsapp_conversations (phone);
CREATE INDEX whatsapp_conversations_instance_idx ON public.whatsapp_conversations (instance_id);
CREATE INDEX whatsapp_conversations_estado_idx ON public.whatsapp_conversations (estado);

-- ------------------------------------------------------------
-- 4. MENSAGENS
--    Histórico completo de cada conversa.
--    quoted_message_id permite linkar respostas a fotos (feira).
-- ------------------------------------------------------------
CREATE TABLE public.whatsapp_messages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id    UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  message_id         TEXT NOT NULL,
  quoted_message_id  TEXT,
  direcao            TEXT NOT NULL CHECK (direcao IN ('recebida', 'enviada')),
  tipo               TEXT NOT NULL DEFAULT 'texto'
                       CHECK (tipo IN ('texto','imagem','documento','audio','video','sticker')),
  conteudo           TEXT,
  caption            TEXT,
  media_url          TEXT,
  processado         BOOLEAN NOT NULL DEFAULT false,
  criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id)
);

CREATE INDEX whatsapp_messages_conversation_idx ON public.whatsapp_messages (conversation_id);
CREATE INDEX whatsapp_messages_quoted_idx ON public.whatsapp_messages (quoted_message_id)
  WHERE quoted_message_id IS NOT NULL;

-- ------------------------------------------------------------
-- 5. CONFIGURAÇÃO DE GRUPOS DE FEIRA
--    Cada evento/feira tem sua própria configuração de grupo.
--    group_id = ID do grupo no WhatsApp (formato: número@g.us).
-- ------------------------------------------------------------
CREATE TABLE public.whatsapp_group_config (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                 TEXT NOT NULL,
  group_id             TEXT NOT NULL UNIQUE,
  instance_id          UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  automacao_config_id  UUID REFERENCES public.automacao_config(id) ON DELETE SET NULL,
  descricao            TEXT,
  ativo                BOOLEAN NOT NULL DEFAULT true,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. FILA DE ENVIOS OUTBOUND
--    Leads da automação aguardando contato via WhatsApp.
--    O scheduler lê desta tabela respeitando delays e limites.
-- ------------------------------------------------------------
CREATE TABLE public.whatsapp_send_queue (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id          UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  automacao_config_id  UUID REFERENCES public.automacao_config(id) ON DELETE SET NULL,
  lead_cnpj            TEXT,
  bitrix_lead_id       TEXT,
  phone                TEXT NOT NULL,
  contact_name         TEXT,
  mensagem             TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pendente'
                         CHECK (status IN ('pendente','enviando','enviado','erro','respondido','cancelado')),
  tentativas           INT NOT NULL DEFAULT 0,
  max_tentativas       INT NOT NULL DEFAULT 3,
  agendado_para        TIMESTAMPTZ,
  enviado_em           TIMESTAMPTZ,
  erro_mensagem        TEXT,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX whatsapp_send_queue_status_idx ON public.whatsapp_send_queue (status);
CREATE INDEX whatsapp_send_queue_agendado_idx ON public.whatsapp_send_queue (agendado_para)
  WHERE status = 'pendente';

-- ------------------------------------------------------------
-- 7. SUGESTÕES DE IA PARA CO-PILOTO
--    Alimentada pelo webhook das instâncias de executivos.
--    Frontend subscreve via Supabase Realtime por conversation_id.
-- ------------------------------------------------------------
CREATE TABLE public.whatsapp_ai_suggestions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  message_id       UUID REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,
  sugestoes        JSONB NOT NULL DEFAULT '[]'::jsonb,
  contexto         TEXT,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX whatsapp_ai_suggestions_conversation_idx
  ON public.whatsapp_ai_suggestions (conversation_id);

-- ------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE public.whatsapp_module_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_group_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_send_queue      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_ai_suggestions  ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados têm acesso completo (mesmo padrão da tabela settings)
CREATE POLICY "whatsapp_module_config_auth"  ON public.whatsapp_module_config  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_instances_auth"      ON public.whatsapp_instances       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_conversations_auth"  ON public.whatsapp_conversations   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_messages_auth"       ON public.whatsapp_messages        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_group_config_auth"   ON public.whatsapp_group_config    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_send_queue_auth"     ON public.whatsapp_send_queue      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_ai_suggestions_auth" ON public.whatsapp_ai_suggestions  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role (Edge Functions) também tem acesso
CREATE POLICY "whatsapp_module_config_service"  ON public.whatsapp_module_config  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_instances_service"      ON public.whatsapp_instances       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_conversations_service"  ON public.whatsapp_conversations   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_messages_service"       ON public.whatsapp_messages        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_group_config_service"   ON public.whatsapp_group_config    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_send_queue_service"     ON public.whatsapp_send_queue      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_ai_suggestions_service" ON public.whatsapp_ai_suggestions  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 9. REALTIME — habilita subscriptions para o co-piloto
-- ------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_ai_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
