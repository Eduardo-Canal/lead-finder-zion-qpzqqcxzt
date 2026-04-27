CREATE TABLE IF NOT EXISTS cnpj_divergencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bitrix_id integer NOT NULL,
  company_name text,
  cnpj_bitrix text,
  cnpj_contaazul text,
  nome_contaazul text,
  mrr numeric DEFAULT 0,
  contratos jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'pendente',
  detectado_em timestamptz NOT NULL DEFAULT now(),
  resolvido_em timestamptz,
  resolvido_por text,
  CONSTRAINT cnpj_divergencias_status_check CHECK (status IN ('pendente','aprovado','rejeitado'))
);

CREATE INDEX IF NOT EXISTS idx_cnpj_divergencias_status ON cnpj_divergencias(status);
CREATE INDEX IF NOT EXISTS idx_cnpj_divergencias_bitrix_id ON cnpj_divergencias(bitrix_id);

ALTER TABLE cnpj_divergencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for admins" ON cnpj_divergencias
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p JOIN perfis_acesso pa ON p.perfil_id = pa.id
    WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p JOIN perfis_acesso pa ON p.perfil_id = pa.id
    WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
  ));
