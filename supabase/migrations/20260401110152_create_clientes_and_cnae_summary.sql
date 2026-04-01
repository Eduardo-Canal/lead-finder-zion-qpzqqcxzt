DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS public.clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        cnae TEXT,
        curva_abc TEXT,
        uf TEXT,
        segmento TEXT,
        porte TEXT,
        data_criacao TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.cnae_summary (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cnae TEXT NOT NULL UNIQUE,
        descricao TEXT,
        total_clientes INTEGER DEFAULT 0,
        percentual NUMERIC DEFAULT 0
    );

    ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.cnae_summary ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "authenticated_select_clientes" ON public.clientes;
    CREATE POLICY "authenticated_select_clientes" ON public.clientes
      FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "authenticated_select_cnae_summary" ON public.cnae_summary;
    CREATE POLICY "authenticated_select_cnae_summary" ON public.cnae_summary
      FOR SELECT TO authenticated USING (true);
END $$;

INSERT INTO public.clientes (nome, cnae, curva_abc, uf, segmento, porte)
SELECT * FROM (VALUES 
  ('Empresa Alpha', '6204-0/00', 'A', 'SP', 'Tecnologia', 'MEDIO'),
  ('Tech Solutions', '6204-0/00', 'A', 'SP', 'Tecnologia', 'EPP'),
  ('Varejo Beta', '4711-3/02', 'B', 'RJ', 'Varejo', 'GRANDE'),
  ('Indústria Gama', '1099-6/99', 'C', 'MG', 'Indústria', 'GRANDE'),
  ('Serviços Delta', '8299-7/99', 'B', 'PR', 'Serviços', 'ME')
) AS v(nome, cnae, curva_abc, uf, segmento, porte)
WHERE NOT EXISTS (SELECT 1 FROM public.clientes);

INSERT INTO public.cnae_summary (cnae, descricao, total_clientes, percentual)
SELECT * FROM (VALUES
  ('6204-0/00', 'Consultoria em tecnologia da informação', 2, 40.0),
  ('4711-3/02', 'Comércio varejista de mercadorias em geral', 1, 20.0),
  ('1099-6/99', 'Fabricação de produtos alimentícios', 1, 20.0),
  ('8299-7/99', 'Outras atividades de serviços prestados', 1, 20.0)
) AS v(cnae, descricao, total_clientes, percentual)
ON CONFLICT (cnae) DO NOTHING;
