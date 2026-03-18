export type Socio = {
  nome: string
  qualificacao: string
  dataEntrada: string
}

export type Lead = {
  cnpj: string
  razaoSocial: string
  cnaePrincipal: string
  cnaesSecundarios: string[]
  municipio: string
  uf: string
  porte: 'MEI' | 'ME' | 'EPP' | 'Demais'
  situacao: 'Ativa' | 'Inapta' | 'Baixada' | 'Suspensa'
  capitalSocial: number
  dataAbertura: string
  naturezaJuridica: string
  contatado: boolean
  contatadoPor?: string
  contatadoEm?: string
  email: string
  telefone: string
  socios: Socio[]
}

export const mockLeads: Lead[] = [
  {
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'TechCorp Soluções em TI Ltda',
    cnaePrincipal: '6201-5/01',
    cnaesSecundarios: ['6202-3/00', '6204-0/00'],
    municipio: 'São Paulo',
    uf: 'SP',
    porte: 'ME',
    situacao: 'Ativa',
    capitalSocial: 100000,
    dataAbertura: '15/03/2018',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    contatado: false,
    email: 'contato@techcorp.com.br',
    telefone: '(11) 98765-4321',
    socios: [
      { nome: 'Carlos Mendes', qualificacao: 'Sócio-Administrador', dataEntrada: '15/03/2018' },
    ],
  },
  {
    cnpj: '98.765.432/0001-10',
    razaoSocial: 'AgroSul Implementos Agrícolas S.A.',
    cnaePrincipal: '2831-3/00',
    cnaesSecundarios: ['4661-3/00'],
    municipio: 'Porto Alegre',
    uf: 'RS',
    porte: 'Demais',
    situacao: 'Ativa',
    capitalSocial: 5000000,
    dataAbertura: '10/08/2005',
    naturezaJuridica: 'Sociedade Anônima Fechada',
    contatado: true,
    contatadoPor: 'Executivo Zion',
    contatadoEm: '24/05/2024',
    email: 'diretoria@agrosul.com.br',
    telefone: '(51) 3344-5566',
    socios: [
      { nome: 'Roberto Alves', qualificacao: 'Diretor', dataEntrada: '10/08/2005' },
      { nome: 'Fernanda Costa', qualificacao: 'Diretor', dataEntrada: '12/04/2010' },
    ],
  },
  {
    cnpj: '45.123.890/0001-55',
    razaoSocial: 'Comércio Norte de Alimentos',
    cnaePrincipal: '4711-3/02',
    cnaesSecundarios: ['4639-7/01'],
    municipio: 'Belém',
    uf: 'PA',
    porte: 'EPP',
    situacao: 'Ativa',
    capitalSocial: 250000,
    dataAbertura: '22/11/2015',
    naturezaJuridica: 'Empresa Individual de Responsabilidade Limitada',
    contatado: false,
    email: 'vendas@comercionorte.com.br',
    telefone: '(91) 98888-7777',
    socios: [{ nome: 'Pedro Alencar', qualificacao: 'Titular', dataEntrada: '22/11/2015' }],
  },
  {
    cnpj: '77.888.999/0001-22',
    razaoSocial: 'Serviços BH Limpeza e Conservação',
    cnaePrincipal: '8121-4/00',
    cnaesSecundarios: [],
    municipio: 'Belo Horizonte',
    uf: 'MG',
    porte: 'MEI',
    situacao: 'Inapta',
    capitalSocial: 5000,
    dataAbertura: '05/01/2020',
    naturezaJuridica: 'Empresário Individual',
    contatado: false,
    email: 'bh.limpeza@gmail.com',
    telefone: '(31) 99999-1111',
    socios: [{ nome: 'José da Silva', qualificacao: 'Empresário', dataEntrada: '05/01/2020' }],
  },
  {
    cnpj: '33.444.555/0001-88',
    razaoSocial: 'Construtora Litoral Sul Ltda',
    cnaePrincipal: '4120-4/00',
    cnaesSecundarios: ['4299-5/99'],
    municipio: 'Florianópolis',
    uf: 'SC',
    porte: 'Demais',
    situacao: 'Ativa',
    capitalSocial: 1500000,
    dataAbertura: '12/09/2010',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    contatado: false,
    email: 'projetos@litoralsul.com.br',
    telefone: '(48) 3232-4444',
    socios: [
      { nome: 'Mariana Santos', qualificacao: 'Sócio-Administrador', dataEntrada: '12/09/2010' },
    ],
  },
  {
    cnpj: '11.222.333/0001-44',
    razaoSocial: 'Logística Nordeste Expresso',
    cnaePrincipal: '4930-2/02',
    cnaesSecundarios: ['5211-7/99'],
    municipio: 'Salvador',
    uf: 'BA',
    porte: 'EPP',
    situacao: 'Ativa',
    capitalSocial: 300000,
    dataAbertura: '30/04/2019',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    contatado: false,
    email: 'operacoes@nordesteexpresso.com.br',
    telefone: '(71) 98765-1234',
    socios: [],
  },
  {
    cnpj: '55.666.777/0001-00',
    razaoSocial: 'Marketing Digital e Criação Jovem',
    cnaePrincipal: '7311-4/00',
    cnaesSecundarios: ['7410-2/99', '6319-2/00'],
    municipio: 'São Paulo',
    uf: 'SP',
    porte: 'ME',
    situacao: 'Suspensa',
    capitalSocial: 20000,
    dataAbertura: '18/07/2022',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    contatado: false,
    email: 'hello@criacaojovem.com',
    telefone: '(11) 97777-6666',
    socios: [
      { nome: 'Lucas Almeida', qualificacao: 'Sócio-Administrador', dataEntrada: '18/07/2022' },
    ],
  },
  {
    cnpj: '99.111.222/0001-33',
    razaoSocial: 'Rio Confecções e Moda Ltda',
    cnaePrincipal: '1412-6/01',
    cnaesSecundarios: ['4781-4/00'],
    municipio: 'Rio de Janeiro',
    uf: 'RJ',
    porte: 'EPP',
    situacao: 'Ativa',
    capitalSocial: 120000,
    dataAbertura: '03/02/2012',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    contatado: false,
    email: 'contato@riomoda.com.br',
    telefone: '(21) 2222-3333',
    socios: [{ nome: 'Juliana Vieira', qualificacao: 'Sócio', dataEntrada: '03/02/2012' }],
  },
  {
    cnpj: '22.333.444/0001-55',
    razaoSocial: 'Centro Automotivo Cerrado',
    cnaePrincipal: '4520-0/01',
    cnaesSecundarios: ['4530-7/03'],
    municipio: 'Goiânia',
    uf: 'GO',
    porte: 'ME',
    situacao: 'Ativa',
    capitalSocial: 50000,
    dataAbertura: '25/10/2016',
    naturezaJuridica: 'Empresário Individual',
    contatado: false,
    email: 'oficina@cerradoauto.com.br',
    telefone: '(62) 3456-7890',
    socios: [{ nome: 'Antônio Marcos', qualificacao: 'Empresário', dataEntrada: '25/10/2016' }],
  },
  {
    cnpj: '88.999.000/0001-66',
    razaoSocial: 'Farmácia Central Manaus',
    cnaePrincipal: '4771-7/01',
    cnaesSecundarios: ['4772-5/00'],
    municipio: 'Manaus',
    uf: 'AM',
    porte: 'ME',
    situacao: 'Baixada',
    capitalSocial: 80000,
    dataAbertura: '14/06/2008',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    contatado: false,
    email: 'sac@farmaciacentral.com.br',
    telefone: '(92) 3333-4444',
    socios: [],
  },
]
