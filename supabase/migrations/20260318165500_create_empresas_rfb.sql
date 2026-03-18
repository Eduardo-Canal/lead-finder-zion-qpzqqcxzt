CREATE TABLE IF NOT EXISTS public.empresas_rfb (
    cnpj TEXT PRIMARY KEY,
    razao_social TEXT,
    nome_fantasia TEXT,
    situacao_cadastral TEXT,
    data_inicio_atividade DATE,
    cnae_fiscal_principal TEXT,
    cnae_fiscal_secundaria TEXT,
    tipo_logradouro TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cep TEXT,
    uf TEXT,
    municipio TEXT,
    telefone_1 TEXT,
    telefone_2 TEXT,
    email TEXT,
    porte TEXT,
    natureza_juridica TEXT,
    capital_social NUMERIC,
    socios JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.empresas_rfb ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable SELECT for authenticated users" ON public.empresas_rfb
  FOR SELECT TO authenticated USING (true);

-- Seed some mock data to make sure the search is working end-to-end immediately
INSERT INTO public.empresas_rfb (
  cnpj, razao_social, nome_fantasia, situacao_cadastral, data_inicio_atividade, 
  cnae_fiscal_principal, cnae_fiscal_secundaria, uf, municipio, telefone_1, email, porte, capital_social, socios
) VALUES
('12.345.678/0001-90', 'TechCorp Soluções em TI Ltda', 'TechCorp', 'Ativa', '2018-03-15', '6201-5/01', '6202-3/00,6204-0/00', 'SP', 'São Paulo', '(11) 98765-4321', 'contato@techcorp.com.br', 'ME', 100000, '[{"nome": "Carlos Mendes", "qualificacao": "Sócio-Administrador"}]'::jsonb),
('98.765.432/0001-10', 'AgroSul Implementos Agrícolas S.A.', 'AgroSul', 'Ativa', '2005-08-10', '2831-3/00', '4661-3/00', 'RS', 'Porto Alegre', '(51) 3344-5566', 'diretoria@agrosul.com.br', 'Demais', 5000000, '[{"nome": "Roberto Alves", "qualificacao": "Diretor"}, {"nome": "Fernanda Costa", "qualificacao": "Diretor"}]'::jsonb),
('45.123.890/0001-55', 'Comércio Norte de Alimentos', 'Norte Alimentos', 'Ativa', '2015-11-22', '4711-3/02', '4639-7/01', 'PA', 'Belém', '(91) 98888-7777', 'vendas@comercionorte.com.br', 'EPP', 250000, '[{"nome": "Pedro Alencar", "qualificacao": "Titular"}]'::jsonb),
('77.888.999/0001-22', 'Serviços BH Limpeza e Conservação', 'BH Limpeza', 'Inapta', '2020-01-05', '8121-4/00', '', 'MG', 'Belo Horizonte', '(31) 99999-1111', 'bh.limpeza@gmail.com', 'MEI', 5000, '[{"nome": "José da Silva", "qualificacao": "Empresário"}]'::jsonb),
('33.444.555/0001-88', 'Construtora Litoral Sul Ltda', 'Litoral Sul', 'Ativa', '2010-09-12', '4120-4/00', '4299-5/99', 'SC', 'Florianópolis', '(48) 3232-4444', 'projetos@litoralsul.com.br', 'Demais', 1500000, '[{"nome": "Mariana Santos", "qualificacao": "Sócio-Administrador"}]'::jsonb)
ON CONFLICT (cnpj) DO NOTHING;
