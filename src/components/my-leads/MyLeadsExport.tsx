import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Database } from 'lucide-react'
import useMyLeadsStore from '@/stores/useMyLeadsStore'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/Forms/FormStandards'

const STATUS_MAP: Record<string, string> = {
  'Não Contatado': 'NEW',
  'Em Prospecção': 'PROSPECTING',
  'Proposta Enviada': 'PROPOSAL',
  'Sem Interesse': 'REFUSED',
  Convertido: 'WON',
}

const escapeCsv = (val: any) => {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

export function MyLeadsExport() {
  const { filteredLeads } = useMyLeadsStore()
  const [isExportingAll, setIsExportingAll] = useState(false)

  const generateAndDownloadCsv = (leads: any[], filename: string) => {
    if (leads.length === 0) {
      toast.error('Não há dados para exportar.')
      return
    }

    const headers = [
      'TITLE',
      'COMPANY_TITLE',
      'PHONE',
      'EMAIL',
      'ADDRESS_CITY',
      'ADDRESS_REGION',
      'COMMENTS',
      'STATUS_ID',
    ]

    const rows = leads.map((lead) => {
      const statusId = STATUS_MAP[lead.status_contato] || 'NEW'
      return [
        escapeCsv(lead.razao_social),
        escapeCsv(lead.razao_social),
        escapeCsv(lead.telefone || lead.decisor_telefone || ''),
        escapeCsv(lead.email || lead.decisor_email || ''),
        escapeCsv(lead.municipio),
        escapeCsv(lead.uf),
        escapeCsv(lead.observacoes || ''),
        escapeCsv(statusId),
      ].join(',')
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Arquivo CSV gerado com sucesso!')
  }

  const handleExportFiltered = () => {
    generateAndDownloadCsv(filteredLeads, 'leads_filtrados_bitrix24.csv')
  }

  const handleExportAll = async () => {
    setIsExportingAll(true)
    try {
      const { data, error } = await supabase.from('leads_salvos').select('*').limit(10000)

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Não há dados para exportar.')
        return
      }

      generateAndDownloadCsv(data, 'todos_leads_bitrix24.csv')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao buscar todos os leads para exportação.')
    } finally {
      setIsExportingAll(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        onClick={handleExportFiltered}
        disabled={filteredLeads.length === 0}
        className="bg-white"
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar para Bitrix24 (CSV)
      </Button>
      <SubmitButton
        variant="default"
        onClick={handleExportAll}
        isLoading={isExportingAll}
        loadingText="Exportando..."
      >
        <Database className="w-4 h-4 mr-2" />
        Exportar Tudo
      </SubmitButton>
    </div>
  )
}
