DO $seed$
DECLARE
    l1 UUID := '11111111-1111-1111-1111-111111111111'::uuid;
    l2 UUID := '22222222-2222-2222-2222-222222222222'::uuid;
    l3 UUID := '33333333-3333-3333-3333-333333333333'::uuid;
    l4 UUID := '44444444-4444-4444-4444-444444444444'::uuid;
BEGIN
    -- Mock de Leads Salvos para associar a carteira
    INSERT INTO public.leads_salvos (id, razao_social, cnpj, cnae_principal, uf, municipio, status_contato)
    VALUES 
    (l1, 'TechCorp SA', '11111111000111', '6201-5/01', 'SP', 'São Paulo', 'Convertido'),
    (l2, 'AgroSul Ltda', '22222222000122', '0111-3/01', 'RS', 'Porto Alegre', 'Convertido'),
    (l3, 'Comercial XYZ', '33333333000133', '6201-5/01', 'SP', 'Campinas', 'Convertido'),
    (l4, 'Inova Software', '44444444000144', '6204-0/00', 'MG', 'Campinas', 'Convertido')
    ON CONFLICT (id) DO NOTHING;

    -- Inserir dados na carteira_clientes caso não existam
    IF NOT EXISTS (SELECT 1 FROM public.carteira_clientes WHERE empresa_id = l1) THEN
        INSERT INTO public.carteira_clientes (empresa_id, cnae, segmento, porte, ticket_medio, status_cliente)
        VALUES (l1, '6201-5/01', 'Tecnologia', 'Médio', 5500, 'Ativo');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.carteira_clientes WHERE empresa_id = l2) THEN
        INSERT INTO public.carteira_clientes (empresa_id, cnae, segmento, porte, ticket_medio, status_cliente)
        VALUES (l2, '0111-3/01', 'Agronegócio', 'Grande', 15000, 'Ativo');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.carteira_clientes WHERE empresa_id = l3) THEN
        INSERT INTO public.carteira_clientes (empresa_id, cnae, segmento, porte, ticket_medio, status_cliente)
        VALUES (l3, '6201-5/01', 'Tecnologia', 'Pequeno', 2500, 'Inativo');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.carteira_clientes WHERE empresa_id = l4) THEN
        INSERT INTO public.carteira_clientes (empresa_id, cnae, segmento, porte, ticket_medio, status_cliente)
        VALUES (l4, '6204-0/00', 'Consultoria TI', 'Pequeno', 3000, 'Ativo');
    END IF;
END $seed$;
