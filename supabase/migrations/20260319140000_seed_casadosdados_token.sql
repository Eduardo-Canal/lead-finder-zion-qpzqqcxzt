-- Adiciona o token da API Casa dos Dados conforme solicitado pela User Story
INSERT INTO public.configuracoes_sistema (id, casadosdados_api_token)
VALUES (1, 'c341b77d432d747d3511eafc3db90413b10c568330485ef333605567f3679d2e2d451475511f0136198efca8dc57ad7e1b0c390dcfc30abd3ffb9409bc0e4250')
ON CONFLICT (id) DO UPDATE SET 
  casadosdados_api_token = EXCLUDED.casadosdados_api_token;
