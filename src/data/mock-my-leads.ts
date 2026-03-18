export type ContactStatus =
  | 'Não Contatado'
  | 'Em Prospecção'
  | 'Proposta Enviada'
  | 'Sem Interesse'
  | 'Convertido'

export type MyLead = {
  id: string
  razaoSocial: string
  cnpj: string
  cnae: string
  municipio: string
  uf: string
  executivo: string
  status: ContactStatus
  ultimoContato: string
  observacoes: string
}

export const mockMyLeads: MyLead[] = [
  {
    id: '1',
    razaoSocial: 'TechCorp Soluções em TI Ltda',
    cnpj: '12.345.678/0001-90',
    cnae: '6201-5/01',
    municipio: 'São Paulo',
    uf: 'SP',
    executivo: 'Executivo Zion',
    status: 'Em Prospecção',
    ultimoContato: '12/10/2023',
    observacoes: 'Demonstraram interesse na nova ferramenta de automação. Ligar na próxima semana.',
  },
  {
    id: '2',
    razaoSocial: 'AgroSul Implementos Agrícolas S.A.',
    cnpj: '98.765.432/0001-10',
    cnae: '2831-3/00',
    municipio: 'Porto Alegre',
    uf: 'RS',
    executivo: 'João Silva',
    status: 'Convertido',
    ultimoContato: '05/11/2023',
    observacoes: 'Contrato assinado. Passado para a equipe de CS.',
  },
  {
    id: '3',
    razaoSocial: 'Comércio Norte de Alimentos',
    cnpj: '45.123.890/0001-55',
    cnae: '4711-3/02',
    municipio: 'Belém',
    uf: 'PA',
    executivo: 'Executivo Zion',
    status: 'Proposta Enviada',
    ultimoContato: '18/11/2023',
    observacoes: 'Aguardando retorno sobre os valores da proposta B.',
  },
  {
    id: '4',
    razaoSocial: 'Construtora Litoral Sul Ltda',
    cnpj: '33.444.555/0001-88',
    cnae: '4120-4/00',
    municipio: 'Florianópolis',
    uf: 'SC',
    executivo: 'Maria Clara',
    status: 'Não Contatado',
    ultimoContato: '-',
    observacoes: '',
  },
  {
    id: '5',
    razaoSocial: 'Logística Nordeste Expresso',
    cnpj: '11.222.333/0001-44',
    cnae: '4930-2/02',
    municipio: 'Salvador',
    uf: 'BA',
    executivo: 'Executivo Zion',
    status: 'Sem Interesse',
    ultimoContato: '20/09/2023',
    observacoes: 'Fechou com a concorrência por questão de preço.',
  },
  {
    id: '6',
    razaoSocial: 'Marketing Digital e Criação Jovem',
    cnpj: '55.666.777/0001-00',
    cnae: '7311-4/00',
    municipio: 'São Paulo',
    uf: 'SP',
    executivo: 'João Silva',
    status: 'Não Contatado',
    ultimoContato: '-',
    observacoes: 'Lead importado da campanha de Ads.',
  },
  {
    id: '7',
    razaoSocial: 'Rio Confecções e Moda Ltda',
    cnpj: '99.111.222/0001-33',
    cnae: '1412-6/01',
    municipio: 'Rio de Janeiro',
    uf: 'RJ',
    executivo: 'Executivo Zion',
    status: 'Em Prospecção',
    ultimoContato: '01/12/2023',
    observacoes: 'Diretora Juliana pediu para retornar após o fechamento do mês.',
  },
  {
    id: '8',
    razaoSocial: 'Centro Automotivo Cerrado',
    cnpj: '22.333.444/0001-55',
    cnae: '4520-0/01',
    municipio: 'Goiânia',
    uf: 'GO',
    executivo: 'Maria Clara',
    status: 'Convertido',
    ultimoContato: '15/08/2023',
    observacoes: 'Cliente ativo desde agosto.',
  },
  {
    id: '9',
    razaoSocial: 'Farmácia Central Manaus',
    cnpj: '88.999.000/0001-66',
    cnae: '4771-7/01',
    municipio: 'Manaus',
    uf: 'AM',
    executivo: 'Executivo Zion',
    status: 'Proposta Enviada',
    ultimoContato: '10/11/2023',
    observacoes: 'Em fase final de aprovação pelo conselho.',
  },
  {
    id: '10',
    razaoSocial: 'Serviços BH Limpeza e Conservação',
    cnpj: '77.888.999/0001-22',
    cnae: '8121-4/00',
    municipio: 'Belo Horizonte',
    uf: 'MG',
    executivo: 'João Silva',
    status: 'Não Contatado',
    ultimoContato: '-',
    observacoes: '',
  },
]
