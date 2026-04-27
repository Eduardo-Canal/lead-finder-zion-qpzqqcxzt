-- Add contexto_empresa_ia column to configuracoes_sistema table
ALTER TABLE configuracoes_sistema
ADD COLUMN IF NOT EXISTS contexto_empresa_ia TEXT;

-- Add comment to the column
COMMENT ON COLUMN configuracoes_sistema.contexto_empresa_ia IS 'Contexto da empresa usado pela IA para gerar abordagens comerciais personalizadas';