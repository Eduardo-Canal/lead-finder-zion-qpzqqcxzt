-- Adiciona a coluna casadosdados_api_token na tabela configuracoes_sistema
ALTER TABLE public.configuracoes_sistema 
ADD COLUMN IF NOT EXISTS casadosdados_api_token TEXT;

-- Remove a política de UPDATE anterior, se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'configuracoes_sistema' AND policyname = 'Enable UPDATE for authenticated users'
    ) THEN
        DROP POLICY "Enable UPDATE for authenticated users" ON public.configuracoes_sistema;
    END IF;
END $$;

-- Cria uma política de UPDATE restritiva apenas para o perfil Administrador
CREATE POLICY "Enable UPDATE for admins only" ON public.configuracoes_sistema
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
      WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
      WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
    )
  );
