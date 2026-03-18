import { mockLeads } from '@/data/mock-leads'
import { mockMyLeads } from '@/data/mock-my-leads'

export const generateId = () => Math.random().toString(36).substring(2, 9)

class MockDatabase {
  private data: any = null

  constructor() {
    this.load()
  }

  private load() {
    const raw = localStorage.getItem('zion_db_v1')
    if (raw) {
      this.data = JSON.parse(raw)
    } else {
      this.data = this.seed()
      this.save()
    }
  }

  private save() {
    localStorage.setItem('zion_db_v1', JSON.stringify(this.data))
  }

  private seed() {
    return {
      users: [
        { id: 'u1', email: 'admin@zion.com', password: 'password123' },
        { id: 'u2', email: 'user@zion.com', password: 'password123' },
      ],
      perfis_acesso: [
        {
          id: 'p1',
          nome: 'Administrador',
          permissoes: [
            'Buscar Leads',
            'Salvar Leads',
            'Marcar Contato',
            'Editar Status de Contato',
            'Exportar Lista',
            'Acessar Admin',
          ],
        },
        { id: 'p2', nome: 'Visualizador', permissoes: ['Buscar Leads'] },
      ],
      profiles: [
        {
          id: 'prof1',
          user_id: 'u1',
          nome: 'Executivo Zion',
          email: 'admin@zion.com',
          perfil_id: 'p1',
          ativo: true,
        },
        {
          id: 'prof2',
          user_id: 'u2',
          nome: 'Maria Santos',
          email: 'user@zion.com',
          perfil_id: 'p2',
          ativo: true,
        },
      ],
      leads_disponiveis: mockLeads.map((l) => ({
        id: generateId(),
        razao_social: l.razaoSocial,
        cnpj: l.cnpj,
        cnae_principal: l.cnaePrincipal,
        cnaes_secundarios: l.cnaesSecundarios,
        municipio: l.municipio,
        uf: l.uf,
        porte: l.porte,
        situacao: l.situacao,
        capital_social: l.capitalSocial,
        data_abertura: l.dataAbertura,
        email: l.email,
        telefone: l.telefone,
        socios: l.socios,
      })),
      leads_salvos: mockMyLeads.map((l) => ({
        id: l.id,
        razao_social: l.razaoSocial,
        cnpj: l.cnpj,
        cnae_principal: l.cnae,
        municipio: l.municipio,
        uf: l.uf,
        porte: 'Demais',
        situacao: 'Ativa',
        capital_social: 100000,
        data_abertura: '01/01/2020',
        email: '',
        telefone: '',
        socios: [],
        salvo_por: l.executivo === 'Executivo Zion' ? 'prof1' : 'prof2',
        status_contato: l.status,
        ultima_data_contato: l.ultimoContato !== '-' ? l.ultimoContato : null,
        observacoes: l.observacoes,
        created_at: new Date().toISOString(),
      })),
      contatos_realizados: mockLeads
        .filter((l) => l.contatado)
        .map((l) => ({
          id: generateId(),
          cnpj: l.cnpj,
          executivo_id: 'prof1',
          executivo_nome: l.contatadoPor || 'Executivo Zion',
          data_contato: l.contatadoEm || new Date().toLocaleDateString('pt-BR'),
          created_at: new Date().toISOString(),
        })),
    }
  }

  async getTable(table: string) {
    this.load()
    return this.data[table] || []
  }

  async insert(table: string, record: any) {
    this.load()
    if (!this.data[table]) this.data[table] = []
    this.data[table].push(record)
    this.save()
    return record
  }

  async update(table: string, id: string, record: any) {
    this.load()
    if (!this.data[table]) return
    const idx = this.data[table].findIndex((r: any) => r.id === id)
    if (idx !== -1) {
      this.data[table][idx] = { ...this.data[table][idx], ...record }
      this.save()
    }
  }

  async delete(table: string, id: string) {
    this.load()
    if (!this.data[table]) return
    this.data[table] = this.data[table].filter((r: any) => r.id !== id)
    this.save()
  }
}

export const mockDb = new MockDatabase()
