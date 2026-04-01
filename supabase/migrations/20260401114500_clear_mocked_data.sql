DO $$
BEGIN
    -- Limpa os dados mockados inseridos anteriormente nas tabelas de clientes e cnae_summary
    TRUNCATE TABLE public.clientes;
    TRUNCATE TABLE public.cnae_summary;
END $$;
