CREATE TABLE IF NOT EXISTS dados_capturados_contaazul (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id text,
  nome text,
  documento text,
  tipo text,
  raw jsonb,
  capturado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dca_documento ON dados_capturados_contaazul(documento);
CREATE INDEX IF NOT EXISTS idx_dca_nome ON dados_capturados_contaazul(nome);

ALTER TABLE dados_capturados_contaazul ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for admins" ON dados_capturados_contaazul
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p JOIN perfis_acesso pa ON p.perfil_id = pa.id
    WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p JOIN perfis_acesso pa ON p.perfil_id = pa.id
    WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
  ));
