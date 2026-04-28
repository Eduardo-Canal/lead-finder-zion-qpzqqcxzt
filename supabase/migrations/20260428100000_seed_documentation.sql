-- Adiciona restrição única para permitir upsert seguro (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'documentation_module_feature_unique'
      AND conrelid = 'public.documentation'::regclass
  ) THEN
    ALTER TABLE public.documentation
      ADD CONSTRAINT documentation_module_feature_unique UNIQUE (module, feature_name);
  END IF;
END $$;

-- ============================================================
-- MÓDULO: prospecting (Prospecção)
-- ============================================================
INSERT INTO public.documentation (module, feature_name, description, updated_at, version) VALUES
(
  'prospecting',
  'Busca de Leads por CNAE',
  'Permite pesquisar empresas ativas no Brasil filtradas por código CNAE, estado e porte.

Como usar:
1. Acesse "Painel de Prospecção" no menu lateral.
2. Selecione um ou mais CNAEs desejados.
3. Aplique filtros opcionais de estado e porte da empresa.
4. Clique em "Buscar" — os resultados são obtidos via API Casa dos Dados.

Cada empresa retornada exibe: razão social, CNPJ, cidade/UF, telefone, e-mail e CNAE principal.
O sistema verifica automaticamente se a empresa já existe no Bitrix24 antes de exibir.',
  NOW(), 1
),
(
  'prospecting',
  'Deduplicação Automática',
  'Antes de enviar um lead ao Bitrix24, o sistema verifica duplicatas por CNPJ e razão social.

Lógica de deduplicação:
- Comparação por CNPJ (somente dígitos) com clientes já existentes no Bitrix.
- Fallback por similaridade de nome quando CNPJ não está disponível.
- Empresas já cadastradas são marcadas como "Já no CRM" na listagem de resultados.

Edge function responsável: sync-lead-to-bitrix-dedup.',
  NOW(), 1
),
(
  'prospecting',
  'Enriquecimento de Leads',
  'Ao selecionar um lead para detalhes, o sistema enriquece automaticamente os dados via:

1. API Casa dos Dados — sócios, porte, data de abertura, situação cadastral.
2. API pública CNPJ.ws — CNAE principal e secundários, endereço completo.

Os dados enriquecidos ficam disponíveis no modal de detalhes do lead e são usados para gerar a abordagem comercial pela IA.',
  NOW(), 1
),
(
  'prospecting',
  'Abordagem Comercial por IA',
  'Gera automaticamente uma sugestão de abordagem comercial personalizada para cada lead.

Funcionamento:
- Analisa o segmento de atuação (CNAE), porte e localização da empresa.
- Usa o modelo Claude (Anthropic) configurado nas Configurações de IA.
- Considera o contexto de negócio da Zion Logtec (transportes, logística).

O texto gerado pode ser copiado diretamente para uso em e-mail, WhatsApp ou ligação.',
  NOW(), 1
)
ON CONFLICT (module, feature_name) DO UPDATE
  SET description = EXCLUDED.description, updated_at = NOW(), version = public.documentation.version + 1;

-- ============================================================
-- MÓDULO: governance (Governança)
-- ============================================================
INSERT INTO public.documentation (module, feature_name, description, updated_at, version) VALUES
(
  'governance',
  'Gestão de Usuários',
  'Permite ao Administrador criar, editar e remover usuários do sistema.

Perfis disponíveis:
- Administrador: acesso total, incluindo configurações, integrações e dados sensíveis.
- Visualizador: acesso somente leitura às telas principais.

Como criar um usuário:
1. Acesse "Gestão de Usuários" no menu.
2. Clique em "Novo Usuário".
3. Preencha nome, e-mail e perfil.
4. O usuário recebe convite por e-mail para definir sua senha.',
  NOW(), 1
),
(
  'governance',
  'Controle de Acesso por Perfil',
  'O sistema aplica controle de acesso em duas camadas:

1. Frontend: rotas e componentes sensíveis são ocultados para perfis sem permissão.
2. Banco de dados: Row Level Security (RLS) no Supabase garante que usuários só acessem dados autorizados.

Regras principais:
- Somente Administradores acessam: Configurações, Gestão de Usuários, logs de auditoria.
- Todos os usuários autenticados acessam: Prospecção, Leads, Histórico, Documentação.',
  NOW(), 1
),
(
  'governance',
  'Log de Atividades',
  'Registra automaticamente as ações realizadas por cada usuário na plataforma.

Eventos registrados:
- Login e logout.
- Envio de lead ao Bitrix24.
- Geração de abordagem por IA.
- Execução de sincronizações (Bitrix, Conta Azul, CNAE).
- Aprovação/rejeição de divergências de CNPJ.

Os logs são armazenados na tabela user_activity_log e visíveis na tela de Auditoria.',
  NOW(), 1
)
ON CONFLICT (module, feature_name) DO UPDATE
  SET description = EXCLUDED.description, updated_at = NOW(), version = public.documentation.version + 1;

-- ============================================================
-- MÓDULO: lead-management (Gestão de Leads)
-- ============================================================
INSERT INTO public.documentation (module, feature_name, description, updated_at, version) VALUES
(
  'lead-management',
  'Meus Leads',
  'Exibe todos os leads prospectados e enviados ao Bitrix24 pelo usuário logado.

Informações exibidas: razão social, CNPJ, cidade, data de envio, status no funil do Bitrix.

Ações disponíveis:
- Visualizar detalhes e dados enriquecidos.
- Abrir diretamente no Bitrix24 (link externo).
- Marcar como favorito para acompanhamento prioritário.',
  NOW(), 1
),
(
  'lead-management',
  'Histórico de Pesquisas',
  'Registra todas as buscas realizadas no Painel de Prospecção.

Cada registro contém: CNAEs pesquisados, filtros aplicados, quantidade de resultados, data/hora e usuário.

Permite retomar buscas anteriores com um clique, recarregando os mesmos parâmetros na tela de prospecção.',
  NOW(), 1
),
(
  'lead-management',
  'Lembretes de Follow-up',
  'Permite criar lembretes associados a leads para acompanhamento posterior.

Como criar:
1. Abra o modal de detalhes de um lead.
2. Clique em "Adicionar Lembrete".
3. Defina data, hora e texto do lembrete.

O sistema envia notificações automáticas via edge function send-reminders, executada periodicamente para verificar lembretes vencidos.',
  NOW(), 1
)
ON CONFLICT (module, feature_name) DO UPDATE
  SET description = EXCLUDED.description, updated_at = NOW(), version = public.documentation.version + 1;

-- ============================================================
-- MÓDULO: inteligencia-zion (Inteligência Zion)
-- ============================================================
INSERT INTO public.documentation (module, feature_name, description, updated_at, version) VALUES
(
  'inteligencia-zion',
  'Painel de Inteligência',
  'Visão consolidada da carteira de clientes Zion com métricas estratégicas.

Inclui:
- Total de clientes por Curva ABC (A+, A, B, C).
- Distribuição geográfica por estado.
- Evolução histórica do MRR ao longo dos meses.
- Top CNAEs com maior concentração de clientes.

Os dados são sincronizados a partir do Bitrix24 e atualizados pelo botão "Sincronizar Bitrix".',
  NOW(), 1
),
(
  'inteligencia-zion',
  'Sincronização Bitrix24',
  'Importa e mantém atualizada a base de clientes do Bitrix24 no Lead Finder.

O que é sincronizado:
- Razão social, CNPJ, cidade/UF, telefone, e-mail.
- CNAE principal (campo personalizado no Bitrix).
- Curva ABC atual (campo personalizado).
- MRR (valor de contrato mensal).

Edge function: fetch-bitrix-clients-zion.
Frequência recomendada: diária ou sempre que houver alteração no CRM.',
  NOW(), 1
)
ON CONFLICT (module, feature_name) DO UPDATE
  SET description = EXCLUDED.description, updated_at = NOW(), version = public.documentation.version + 1;

-- ============================================================
-- MÓDULO: curva-abc-financeira (Curva ABC Financeira)
-- ============================================================
INSERT INTO public.documentation (module, feature_name, description, updated_at, version) VALUES
(
  'curva-abc-financeira',
  'Integração com Conta Azul',
  'Conecta o Lead Finder ao Conta Azul para importar os valores reais de contratos dos clientes.

Configuração (aba Configurações → Conta Azul):
1. Informe o Client ID e Client Secret obtidos no portal de desenvolvedores do Conta Azul.
2. Defina a Redirect URI (ex: http://localhost:5173/conta-azul/callback).
3. Clique em "Autorizar" — você será redirecionado para o Conta Azul para aprovar o acesso.
4. Após aprovação, o token é salvo automaticamente e renovado conforme necessário.

Fluxo OAuth2: Authorization Code Grant (padrão seguro, sem tráfego de senha).',
  NOW(), 1
),
(
  'curva-abc-financeira',
  'Sincronização de MRR (Buscar Dados)',
  'Importa todos os contratos ativos do Conta Azul e calcula o MRR por cliente.

Como funciona:
1. Busca todos os contratos com paginação robusta (100 por página, tolerância a duplicatas da API).
2. Para cada contrato, busca o CNPJ do cliente via endpoint /v1/pessoas/{id}.
3. Filtra apenas contratos com periodicidade = NUNCA (prazo indeterminado — contratos recorrentes).
4. Vincula cada contrato ao cliente Bitrix por CNPJ.

Resultado: MRR atualizado para cada cliente na tabela contaazul_cache.

Edge function: fetch-mrr.',
  NOW(), 1
),
(
  'curva-abc-financeira',
  'Matching de Clientes (3 Níveis)',
  'Algoritmo de correspondência entre clientes do Conta Azul e do Bitrix24.

Nível 1 — CNPJ Exato:
Compara o CNPJ do contrato (Conta Azul) com o CNPJ cadastrado no Bitrix. Correspondência direta, mais confiável.

Nível 2 — Similaridade de Nome:
Quando o CNPJ não bate, compara a razão social. Exige mínimo 2 palavras significativas em comum (ignora artigos, preposições e termos jurídicos como LTDA, S.A.).

Nível 3 — CNPJ Base (8 dígitos):
Compara apenas os primeiros 8 dígitos do CNPJ (raiz da empresa). Captura casos em que o mesmo grupo econômico possui filiais com CNPJs diferentes.
Só aceita correspondência se houver exatamente 1 candidato com aquela raiz.',
  NOW(), 1
),
(
  'curva-abc-financeira',
  'Divergências de CNPJ',
  'Quando o Conta Azul possui um CNPJ diferente do cadastrado no Bitrix para o mesmo cliente, o sistema registra uma divergência para revisão humana.

Fluxo:
1. A sincronização detecta a discrepância e registra na tabela cnpj_divergencias.
2. O painel de divergências aparece na aba Recalcular da Curva ABC Financeira.
3. O responsável analisa os dados (CNPJ Bitrix vs. CNPJ Conta Azul, nome, MRR).
4. Ações disponíveis:
   - Autorizar Atualização: aplica o CNPJ do Conta Azul no Bitrix e no banco.
   - Rejeitar: mantém o CNPJ original, sem alteração.

Ao autorizar, o sistema também atualiza o CNAE automaticamente se houver mudança.',
  NOW(), 1
),
(
  'curva-abc-financeira',
  'Atualização Automática de CNAE',
  'Ao aprovar uma divergência de CNPJ, o sistema consulta automaticamente o CNAE primário do novo CNPJ.

Fonte: API pública publica.cnpj.ws (gratuita, sem autenticação).

Processo:
1. Busca o CNAE principal da empresa pelo novo CNPJ.
2. Compara com o CNAE atualmente cadastrado no Bitrix.
3. Se diferente, atualiza localmente (bitrix_clients_zion) e envia ao Bitrix CRM.

Formato gravado: "código - Descrição da atividade" (ex: "4782201 - Comércio varejista de calçados").

Edge function: resolve-cnpj-divergence.',
  NOW(), 1
),
(
  'curva-abc-financeira',
  'Definir CNPJ Manualmente',
  'Permite cadastrar o CNPJ de clientes que estão no Bitrix sem este dado preenchido.

Como usar:
1. Clique em "Fontes de Dados" na aba Recalcular.
2. Localize o cliente desejado (busca por nome ou CNPJ).
3. Clientes sem CNPJ exibem o botão "Definir CNPJ" (âmbar) na coluna CNPJ.
4. Informe o CNPJ e clique em "Salvar e enviar ao Bitrix".

Ao salvar:
- CNPJ é gravado localmente (bitrix_clients_zion).
- CNPJ é enviado para o campo correspondente no Bitrix CRM.
- CNAE é buscado e atualizado automaticamente.

Edge function: set-client-cnpj.',
  NOW(), 1
),
(
  'curva-abc-financeira',
  'Fontes de Dados (Dialog)',
  'Painel que exibe todos os clientes Bitrix com status de integração do Conta Azul.

Acesso: botão "Fontes de Dados" na aba Recalcular da Curva ABC Financeira.

Colunas exibidas:
- Cliente: razão social cadastrada no Bitrix.
- CNPJ: formatado ou botão para definir se vazio.
- MRR: valor sincronizado do Conta Azul (ou "Não sincronizado").
- Curva ABC: classificação atual.
- Conta Azul: link "Ver dados" abre drawer com contratos e histórico.
- Oracle: integração futura (em breve).

Suporta busca por nome ou CNPJ e atualização da lista em tempo real.',
  NOW(), 1
),
(
  'curva-abc-financeira',
  'Cálculo e Classificação da Curva ABC',
  'Classifica os clientes em faixas A+, A, B, C com base no MRR individual.

Modos disponíveis (configuráveis na aba Configurações):
- Modo Fixo: faixas com valores absolutos de MRR (ex: A+ ≥ R$ 4.000).
- Modo Percentual: faixas baseadas em percentual do MRR total da carteira.

Processo:
1. Clique em "Calcular Curva ABC" na aba Recalcular.
2. O sistema lê o MRR de cada cliente (da tabela contaazul_cache).
3. Aplica os thresholds configurados.
4. Grava a classificação no Bitrix CRM (campo Curva ABC) e localmente.
5. Registra o histórico de classificação para comparações futuras.

Edge function: calculate-abc.',
  NOW(), 1
)
ON CONFLICT (module, feature_name) DO UPDATE
  SET description = EXCLUDED.description, updated_at = NOW(), version = public.documentation.version + 1;

-- ============================================================
-- MÓDULO: analise-carteira (Análise de Carteira)
-- ============================================================
INSERT INTO public.documentation (module, feature_name, description, updated_at, version) VALUES
(
  'analise-carteira',
  'Visão Geral da Carteira',
  'Dashboard com indicadores consolidados da carteira de clientes Zion agrupados por CNAE.

Indicadores exibidos:
- Total de CNAEs distintos na carteira.
- Quantidade de clientes por faixa da Curva ABC (A+, A, B, C).
- Gráfico dos Top 10 CNAEs por volume de clientes.

Filtros disponíveis:
- Estado / Região.
- Curva ABC (A+, A, B, C).
- CNAE específico.

Os dados são lidos em tempo real da tabela bitrix_clients_zion.',
  NOW(), 1
),
(
  'analise-carteira',
  'Potencial de Mercado por CNAE',
  'Estima o total de empresas ativas no Brasil em cada segmento CNAE, representando o mercado endereçável.

Como é obtido:
1. Clique em "Atualizar Potencial" na tela de Análise de Carteira.
2. Para cada CNAE da carteira, o sistema chama a API Casa dos Dados com filtro por CNAE e situação "ATIVA".
3. O total retornado é armazenado na tabela cnae_market_data_potencial.

Cache: os dados são reutilizados por 30 dias para evitar consumo desnecessário de créditos da API.

Pré-requisito: chave de API da Casa dos Dados configurada em Configurações → Integrações.

Edge function: sync-cnae-market-data-potencial.',
  NOW(), 1
),
(
  'analise-carteira',
  'Penetração de Mercado',
  'Percentual do mercado potencial que a Zion já atende em cada segmento CNAE.

Fórmula:
Penetração = (Clientes Zion no CNAE ÷ Potencial de Mercado) × 100

Exemplos de leitura:
- 2% → mercado pouco explorado, alta oportunidade de crescimento.
- 15% → presença significativa, crescimento moderado.
- 30%+ → mercado maduro para a Zion, foco em retenção.

Calculado automaticamente no frontend sempre que a tela é carregada. Requer que o Potencial de Mercado esteja preenchido.',
  NOW(), 1
),
(
  'analise-carteira',
  'Tendência por CNAE',
  'Indica se o mercado potencial de um segmento está crescendo, decrescendo ou estável entre sincronizações.

Como é calculada:
- A cada execução de "Atualizar Potencial", o sistema compara o novo valor de potencial_mercado com o da execução anterior.
- Crescente: potencial atual > potencial anterior.
- Decrescente: potencial atual < potencial anterior.
- Estável: sem variação.

Exibida como badge colorida na tabela de Inteligência por CNAE:
- Verde (↑): Crescente.
- Vermelho (↓): Decrescente.
- Cinza (—): Estável.',
  NOW(), 1
),
(
  'analise-carteira',
  'Inteligência Estratégica por CNAE',
  'Tabela detalhada que cruza todos os indicadores por segmento de atuação.

Colunas:
- Código CNAE e Descrição.
- Total de Clientes Zion no segmento.
- Distribuição por Curva ABC: A+, A, B, C, Não Classificado.
- Potencial de Mercado: total de empresas ativas no Brasil (via Casa dos Dados).
- Penetração: % do mercado atendido pela Zion.
- Tendência: variação do mercado entre sincronizações.

Uso estratégico:
- CNAEs com alta penetração e tendência crescente → prioridade de retenção.
- CNAEs com baixa penetração e potencial alto → oportunidade de prospecção ativa.
- CNAEs com tendência decrescente → alerta de contração de mercado.',
  NOW(), 1
),
(
  'analise-carteira',
  'Exportar Relatório',
  'Gera um relatório da carteira com todos os dados visíveis na tela, incluindo filtros aplicados.

Formato: planilha com CNAEs, clientes, distribuição ABC, potencial e penetração.

Como usar:
1. Aplique os filtros desejados (estado, curva, CNAE).
2. Clique em "Exportar Relatório".
3. O arquivo é gerado e baixado automaticamente no navegador.',
  NOW(), 1
)
ON CONFLICT (module, feature_name) DO UPDATE
  SET description = EXCLUDED.description, updated_at = NOW(), version = public.documentation.version + 1;

-- ============================================================
-- MÓDULO: performance-dashboard (Performance Dashboard)
-- ============================================================
INSERT INTO public.documentation (module, feature_name, description, updated_at, version) VALUES
(
  'performance-dashboard',
  'Dashboard Principal',
  'Visão executiva com os principais indicadores do Lead Finder Zion.

Métricas exibidas:
- Total de leads prospectados no período.
- Leads enviados ao Bitrix24.
- Taxa de conversão prospecção → CRM.
- CNAEs mais prospectados.
- Atividade por usuário.

O período pode ser ajustado (últimos 7, 30, 90 dias) e os dados são atualizados em tempo real.',
  NOW(), 1
),
(
  'performance-dashboard',
  'Histórico de Sincronizações',
  'Registra todas as execuções de sincronização realizadas na plataforma.

Tipos registrados:
- Sincronização Bitrix24 (import de clientes).
- Sincronização Conta Azul (MRR e contratos).
- Atualização de Potencial de Mercado (Casa dos Dados).
- Cálculo de Curva ABC.

Cada registro contém: data/hora, usuário, quantidade de registros processados e status (sucesso/erro).',
  NOW(), 1
)
ON CONFLICT (module, feature_name) DO UPDATE
  SET description = EXCLUDED.description, updated_at = NOW(), version = public.documentation.version + 1;
