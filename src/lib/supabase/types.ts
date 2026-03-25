// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4'
  }
  public: {
    Tables: {
      api_debug_logs: {
        Row: {
          cnae: string | null
          id: string
          limite: number | null
          municipio: string | null
          resposta_json: Json | null
          status_http: number | null
          sucesso: boolean | null
          tempo_resposta_ms: number | null
          timestamp: string
          total_resultados: number | null
          uf: string | null
        }
        Insert: {
          cnae?: string | null
          id?: string
          limite?: number | null
          municipio?: string | null
          resposta_json?: Json | null
          status_http?: number | null
          sucesso?: boolean | null
          tempo_resposta_ms?: number | null
          timestamp?: string
          total_resultados?: number | null
          uf?: string | null
        }
        Update: {
          cnae?: string | null
          id?: string
          limite?: number | null
          municipio?: string | null
          resposta_json?: Json | null
          status_http?: number | null
          sucesso?: boolean | null
          tempo_resposta_ms?: number | null
          timestamp?: string
          total_resultados?: number | null
          uf?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bitrix_api_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          method: string
          request_body: Json | null
          response_body: Json | null
          response_time_ms: number | null
          status_code: number | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          method: string
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          timestamp?: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          timestamp?: string
        }
        Relationships: []
      }
      bitrix_clients_zion: {
        Row: {
          bitrix_id: number
          city: string | null
          cnae_principal: string | null
          cnpj: string | null
          company_name: string | null
          created_at: string | null
          curva_abc: string | null
          email: string | null
          id: string
          phone: string | null
          segmento: string | null
          state: string | null
          synced_at: string | null
        }
        Insert: {
          bitrix_id: number
          city?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string | null
          curva_abc?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          segmento?: string | null
          state?: string | null
          synced_at?: string | null
        }
        Update: {
          bitrix_id?: number
          city?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string | null
          curva_abc?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          segmento?: string | null
          state?: string | null
          synced_at?: string | null
        }
        Relationships: []
      }
      bitrix_rate_limit_config: {
        Row: {
          id: string
          max_requests: number | null
          time_window_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          max_requests?: number | null
          time_window_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          max_requests?: number | null
          time_window_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bitrix_webhook_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
      cache_pesquisas: {
        Row: {
          chave_cache: string
          criado_em: string
          expira_em: string
          id: string
          parametros: Json | null
          resultados: Json
          total_registros: number
        }
        Insert: {
          chave_cache: string
          criado_em?: string
          expira_em?: string
          id?: string
          parametros?: Json | null
          resultados?: Json
          total_registros?: number
        }
        Update: {
          chave_cache?: string
          criado_em?: string
          expira_em?: string
          id?: string
          parametros?: Json | null
          resultados?: Json
          total_registros?: number
        }
        Relationships: []
      }
      company_duplicates: {
        Row: {
          created_at: string
          duplicate_company_id: number
          id: string
          match_type: Database['public']['Enums']['duplicate_match_type']
          merged_at: string | null
          merged_by: string | null
          notes: string | null
          original_company_id: number
          similarity_score: number | null
          status: Database['public']['Enums']['duplicate_status']
        }
        Insert: {
          created_at?: string
          duplicate_company_id: number
          id?: string
          match_type: Database['public']['Enums']['duplicate_match_type']
          merged_at?: string | null
          merged_by?: string | null
          notes?: string | null
          original_company_id: number
          similarity_score?: number | null
          status?: Database['public']['Enums']['duplicate_status']
        }
        Update: {
          created_at?: string
          duplicate_company_id?: number
          id?: string
          match_type?: Database['public']['Enums']['duplicate_match_type']
          merged_at?: string | null
          merged_by?: string | null
          notes?: string | null
          original_company_id?: number
          similarity_score?: number | null
          status?: Database['public']['Enums']['duplicate_status']
        }
        Relationships: [
          {
            foreignKeyName: 'company_duplicates_duplicate_company_id_fkey'
            columns: ['duplicate_company_id']
            isOneToOne: false
            referencedRelation: 'bitrix_clients_zion'
            referencedColumns: ['bitrix_id']
          },
          {
            foreignKeyName: 'company_duplicates_original_company_id_fkey'
            columns: ['original_company_id']
            isOneToOne: false
            referencedRelation: 'bitrix_clients_zion'
            referencedColumns: ['bitrix_id']
          },
        ]
      }
      company_enriched_cache: {
        Row: {
          cnpj: string
          created_at: string
          data: Json
          expires_at: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          data?: Json
          expires_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          data?: Json
          expires_at?: string
        }
        Relationships: []
      }
      company_merge_history: {
        Row: {
          created_at: string
          fields_updated: Json | null
          id: string
          merged_at: string | null
          merged_by: string | null
          merged_to_company_id: number
          merged_to_company_name: string | null
          original_company_id: number
          original_company_name: string | null
          reason: string | null
          reversible: boolean | null
          reverted_at: string | null
          reverted_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          fields_updated?: Json | null
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          merged_to_company_id: number
          merged_to_company_name?: string | null
          original_company_id: number
          original_company_name?: string | null
          reason?: string | null
          reversible?: boolean | null
          reverted_at?: string | null
          reverted_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          fields_updated?: Json | null
          id?: string
          merged_at?: string | null
          merged_by?: string | null
          merged_to_company_id?: number
          merged_to_company_name?: string | null
          original_company_id?: number
          original_company_name?: string | null
          reason?: string | null
          reversible?: boolean | null
          reverted_at?: string | null
          reverted_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'company_merge_history_merged_to_company_id_fkey'
            columns: ['merged_to_company_id']
            isOneToOne: false
            referencedRelation: 'bitrix_clients_zion'
            referencedColumns: ['bitrix_id']
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          casadosdados_api_token: string | null
          data_ultima_atualizacao_rfb: string | null
          id: number
        }
        Insert: {
          casadosdados_api_token?: string | null
          data_ultima_atualizacao_rfb?: string | null
          id?: number
        }
        Update: {
          casadosdados_api_token?: string | null
          data_ultima_atualizacao_rfb?: string | null
          id?: number
        }
        Relationships: []
      }
      contatos_realizados: {
        Row: {
          cnpj: string
          created_at: string | null
          data_contato: string | null
          executivo_id: string | null
          executivo_nome: string | null
          id: string
          status: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          data_contato?: string | null
          executivo_id?: string | null
          executivo_nome?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          data_contato?: string | null
          executivo_id?: string | null
          executivo_nome?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'contatos_realizados_executivo_id_fkey'
            columns: ['executivo_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      empresas_rfb: {
        Row: {
          bairro: string | null
          capital_social: number | null
          cep: string | null
          cnae_fiscal_principal: string | null
          cnae_fiscal_secundaria: string | null
          cnaes_secundarios: Json | null
          cnpj: string
          complemento: string | null
          data_abertura: string | null
          data_inicio_atividade: string | null
          email: string | null
          logradouro: string | null
          municipio: string | null
          natureza_juridica: string | null
          nome_fantasia: string | null
          numero: string | null
          porte: string | null
          razao_social: string | null
          situacao_cadastral: string | null
          socios: Json | null
          telefone_1: string | null
          telefone_2: string | null
          tipo_logradouro: string | null
          uf: string | null
        }
        Insert: {
          bairro?: string | null
          capital_social?: number | null
          cep?: string | null
          cnae_fiscal_principal?: string | null
          cnae_fiscal_secundaria?: string | null
          cnaes_secundarios?: Json | null
          cnpj: string
          complemento?: string | null
          data_abertura?: string | null
          data_inicio_atividade?: string | null
          email?: string | null
          logradouro?: string | null
          municipio?: string | null
          natureza_juridica?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          porte?: string | null
          razao_social?: string | null
          situacao_cadastral?: string | null
          socios?: Json | null
          telefone_1?: string | null
          telefone_2?: string | null
          tipo_logradouro?: string | null
          uf?: string | null
        }
        Update: {
          bairro?: string | null
          capital_social?: number | null
          cep?: string | null
          cnae_fiscal_principal?: string | null
          cnae_fiscal_secundaria?: string | null
          cnaes_secundarios?: Json | null
          cnpj?: string
          complemento?: string | null
          data_abertura?: string | null
          data_inicio_atividade?: string | null
          email?: string | null
          logradouro?: string | null
          municipio?: string | null
          natureza_juridica?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          porte?: string | null
          razao_social?: string | null
          situacao_cadastral?: string | null
          socios?: Json | null
          telefone_1?: string | null
          telefone_2?: string | null
          tipo_logradouro?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      leads_bitrix_sync: {
        Row: {
          company_id: number | null
          created_at: string | null
          deal_id: number | null
          error_log: string | null
          error_message: string | null
          id: string
          kanban_id: string | null
          lead_id: string | null
          stage_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string | null
          deal_id?: number | null
          error_log?: string | null
          error_message?: string | null
          id?: string
          kanban_id?: string | null
          lead_id?: string | null
          stage_id?: string | null
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: number | null
          created_at?: string | null
          deal_id?: number | null
          error_log?: string | null
          error_message?: string | null
          id?: string
          kanban_id?: string | null
          lead_id?: string | null
          stage_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'leads_bitrix_sync_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads_salvos'
            referencedColumns: ['id']
          },
        ]
      }
      leads_salvos: {
        Row: {
          capital_social: number | null
          cnae_principal: string | null
          cnpj: string | null
          created_at: string | null
          data_abertura: string | null
          decisor_email: string | null
          decisor_nome: string | null
          decisor_telefone: string | null
          email: string | null
          historico_interacoes: Json | null
          id: string
          municipio: string | null
          observacoes: string | null
          porte: string | null
          razao_social: string | null
          salvo_por: string | null
          situacao: string | null
          socios: Json | null
          status_contato: string | null
          telefone: string | null
          uf: string | null
          ultima_data_contato: string | null
          user_id: string | null
        }
        Insert: {
          capital_social?: number | null
          cnae_principal?: string | null
          cnpj?: string | null
          created_at?: string | null
          data_abertura?: string | null
          decisor_email?: string | null
          decisor_nome?: string | null
          decisor_telefone?: string | null
          email?: string | null
          historico_interacoes?: Json | null
          id?: string
          municipio?: string | null
          observacoes?: string | null
          porte?: string | null
          razao_social?: string | null
          salvo_por?: string | null
          situacao?: string | null
          socios?: Json | null
          status_contato?: string | null
          telefone?: string | null
          uf?: string | null
          ultima_data_contato?: string | null
          user_id?: string | null
        }
        Update: {
          capital_social?: number | null
          cnae_principal?: string | null
          cnpj?: string | null
          created_at?: string | null
          data_abertura?: string | null
          decisor_email?: string | null
          decisor_nome?: string | null
          decisor_telefone?: string | null
          email?: string | null
          historico_interacoes?: Json | null
          id?: string
          municipio?: string | null
          observacoes?: string | null
          porte?: string | null
          razao_social?: string | null
          salvo_por?: string | null
          situacao?: string | null
          socios?: Json | null
          status_contato?: string | null
          telefone?: string | null
          uf?: string | null
          ultima_data_contato?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'leads_salvos_salvo_por_fkey'
            columns: ['salvo_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          created_at: string
          expected_close_date: string | null
          id: string
          lead_id: string
          notes: string | null
          probability: number | null
          stage: Database['public']['Enums']['opportunity_stage']
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          expected_close_date?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          probability?: number | null
          stage?: Database['public']['Enums']['opportunity_stage']
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          expected_close_date?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          probability?: number | null
          stage?: Database['public']['Enums']['opportunity_stage']
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'opportunities_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads_salvos'
            referencedColumns: ['id']
          },
        ]
      }
      perfis_acesso: {
        Row: {
          id: string
          nome: string
          permissoes: Json
        }
        Insert: {
          id?: string
          nome: string
          permissoes?: Json
        }
        Update: {
          id?: string
          nome?: string
          permissoes?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          email: string
          id: string
          nome: string
          perfil_id: string | null
          require_password_update: boolean
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          email: string
          id?: string
          nome: string
          perfil_id?: string | null
          require_password_update?: boolean
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          email?: string
          id?: string
          nome?: string
          perfil_id?: string | null
          require_password_update?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_perfil_id_fkey'
            columns: ['perfil_id']
            isOneToOne: false
            referencedRelation: 'perfis_acesso'
            referencedColumns: ['id']
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          days_interval: number
          id: string
          is_active: boolean
          last_reminded_at: string | null
          lead_id: string
          reminder_type: Database['public']['Enums']['reminder_type_enum']
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_interval?: number
          id?: string
          is_active?: boolean
          last_reminded_at?: string | null
          lead_id: string
          reminder_type?: Database['public']['Enums']['reminder_type_enum']
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_interval?: number
          id?: string
          is_active?: boolean
          last_reminded_at?: string | null
          lead_id?: string
          reminder_type?: Database['public']['Enums']['reminder_type_enum']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reminders_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads_salvos'
            referencedColumns: ['id']
          },
        ]
      }
      search_history: {
        Row: {
          cidade: string | null
          cnae: string | null
          created_at: string
          estado: string | null
          id: string
          porte: string | null
          total_results: number | null
          user_id: string
        }
        Insert: {
          cidade?: string | null
          cnae?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          porte?: string | null
          total_results?: number | null
          user_id: string
        }
        Update: {
          cidade?: string | null
          cnae?: string | null
          created_at?: string
          estado?: string | null
          id?: string
          porte?: string | null
          total_results?: number | null
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_reminder_settings: {
        Row: {
          closing_days: number
          created_at: string
          follow_up_days: number
          proposal_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          closing_days?: number
          created_at?: string
          follow_up_days?: number
          proposal_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          closing_days?: number
          created_at?: string
          follow_up_days?: number
          proposal_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_potential_duplicates: {
        Args: { min_score?: number }
        Returns: {
          empresa1_id: number
          empresa2_id: number
          similarity_score: number
          tipo_similaridade: string
        }[]
      }
      get_due_followups: {
        Args: never
        Returns: {
          dias_sem_contato: number
          executivo_email: string
          executivo_nome: string
          lead_id: string
          opp_stage: string
          razao_social: string
          reminder_type: string
          user_id: string
        }[]
      }
      get_due_reminders_with_leads: {
        Args: never
        Returns: {
          days_interval: number
          executivo_email: string
          executivo_nome: string
          lead_id: string
          razao_social: string
          reminder_id: string
          reminder_type: Database['public']['Enums']['reminder_type_enum']
          user_id: string
        }[]
      }
      limpar_cache_pesquisas: { Args: { p_cnae?: string }; Returns: number }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { '': string }; Returns: string[] }
    }
    Enums: {
      duplicate_match_type: 'cnpj_exact' | 'razao_social_single' | 'razao_social_multiple'
      duplicate_status: 'pending_review' | 'merged' | 'ignored'
      opportunity_stage: 'prospecting' | 'qualification' | 'proposal' | 'closing'
      reminder_type_enum: 'follow_up' | 'proposal' | 'closing'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      duplicate_match_type: ['cnpj_exact', 'razao_social_single', 'razao_social_multiple'],
      duplicate_status: ['pending_review', 'merged', 'ignored'],
      opportunity_stage: ['prospecting', 'qualification', 'proposal', 'closing'],
      reminder_type_enum: ['follow_up', 'proposal', 'closing'],
    },
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: api_debug_logs
//   id: uuid (not null, default: gen_random_uuid())
//   timestamp: timestamp with time zone (not null, default: now())
//   cnae: text (nullable)
//   uf: text (nullable)
//   status_http: integer (nullable)
//   sucesso: boolean (nullable)
//   municipio: text (nullable)
//   limite: integer (nullable)
//   tempo_resposta_ms: integer (nullable)
//   total_resultados: integer (nullable)
//   resposta_json: jsonb (nullable)
// Table: audit_logs
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   action: text (not null)
//   entity_type: text (not null)
//   entity_id: uuid (nullable)
//   changes: jsonb (nullable)
//   ip_address: inet (nullable)
//   user_agent: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: bitrix_api_logs
//   id: uuid (not null, default: gen_random_uuid())
//   timestamp: timestamp with time zone (not null, default: now())
//   endpoint: text (not null)
//   method: text (not null)
//   status_code: integer (nullable)
//   response_time_ms: integer (nullable)
//   error_message: text (nullable)
//   request_body: jsonb (nullable)
//   response_body: jsonb (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: bitrix_clients_zion
//   id: uuid (not null, default: gen_random_uuid())
//   bitrix_id: integer (not null)
//   company_name: text (nullable)
//   cnpj: text (nullable)
//   cnae_principal: text (nullable)
//   email: text (nullable)
//   phone: text (nullable)
//   city: text (nullable)
//   state: text (nullable)
//   synced_at: timestamp with time zone (nullable, default: now())
//   created_at: timestamp with time zone (nullable, default: now())
//   segmento: text (nullable)
//   curva_abc: text (nullable)
// Table: bitrix_rate_limit_config
//   id: uuid (not null, default: gen_random_uuid())
//   max_requests: integer (nullable, default: 2)
//   time_window_minutes: integer (nullable, default: 1)
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: bitrix_webhook_events
//   id: uuid (not null, default: gen_random_uuid())
//   event_type: text (nullable)
//   payload: jsonb (nullable)
//   processed: boolean (nullable, default: false)
//   processed_at: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: cache_pesquisas
//   id: uuid (not null, default: gen_random_uuid())
//   chave_cache: text (not null)
//   resultados: jsonb (not null, default: '[]'::jsonb)
//   total_registros: integer (not null, default: 0)
//   criado_em: timestamp with time zone (not null, default: now())
//   expira_em: timestamp with time zone (not null, default: (now() + '30 days'::interval))
//   parametros: jsonb (nullable, default: '{}'::jsonb)
// Table: company_duplicates
//   id: uuid (not null, default: gen_random_uuid())
//   original_company_id: integer (not null)
//   duplicate_company_id: integer (not null)
//   similarity_score: numeric (nullable)
//   match_type: duplicate_match_type (not null)
//   status: duplicate_status (not null, default: 'pending_review'::duplicate_status)
//   merged_by: uuid (nullable)
//   merged_at: timestamp with time zone (nullable)
//   notes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: company_enriched_cache
//   cnpj: text (not null)
//   data: jsonb (not null, default: '{}'::jsonb)
//   created_at: timestamp with time zone (not null, default: now())
//   expires_at: timestamp with time zone (not null, default: (now() + '24:00:00'::interval))
// Table: company_merge_history
//   id: uuid (not null, default: gen_random_uuid())
//   original_company_id: integer (not null)
//   merged_to_company_id: integer (not null)
//   merged_by: uuid (nullable)
//   merged_at: timestamp with time zone (nullable)
//   fields_updated: jsonb (nullable)
//   reason: text (nullable)
//   reversible: boolean (nullable, default: true)
//   created_at: timestamp with time zone (not null, default: now())
//   original_company_name: text (nullable)
//   merged_to_company_name: text (nullable)
//   status: text (nullable, default: 'merged'::text)
//   reverted_at: timestamp with time zone (nullable)
//   reverted_by: uuid (nullable)
// Table: configuracoes_sistema
//   id: integer (not null, default: 1)
//   data_ultima_atualizacao_rfb: timestamp with time zone (nullable)
//   casadosdados_api_token: text (nullable)
// Table: contatos_realizados
//   id: uuid (not null, default: gen_random_uuid())
//   cnpj: text (not null)
//   executivo_id: uuid (nullable)
//   executivo_nome: text (nullable)
//   data_contato: timestamp without time zone (nullable, default: now())
//   created_at: timestamp without time zone (nullable, default: now())
//   status: text (nullable, default: 'Contatado'::text)
// Table: empresas_rfb
//   cnpj: text (not null)
//   razao_social: text (nullable)
//   nome_fantasia: text (nullable)
//   situacao_cadastral: text (nullable)
//   data_inicio_atividade: date (nullable)
//   cnae_fiscal_principal: text (nullable)
//   cnae_fiscal_secundaria: text (nullable)
//   tipo_logradouro: text (nullable)
//   logradouro: text (nullable)
//   numero: text (nullable)
//   complemento: text (nullable)
//   bairro: text (nullable)
//   cep: text (nullable)
//   uf: text (nullable)
//   municipio: text (nullable)
//   telefone_1: text (nullable)
//   telefone_2: text (nullable)
//   email: text (nullable)
//   porte: text (nullable)
//   natureza_juridica: text (nullable)
//   capital_social: numeric (nullable)
//   socios: jsonb (nullable, default: '[]'::jsonb)
//   cnaes_secundarios: jsonb (nullable, default: '[]'::jsonb)
//   data_abertura: date (nullable)
// Table: leads_bitrix_sync
//   id: uuid (not null, default: gen_random_uuid())
//   lead_id: uuid (nullable)
//   company_id: integer (nullable)
//   deal_id: integer (nullable)
//   status: text (not null)
//   error_log: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   kanban_id: text (nullable)
//   stage_id: text (nullable)
//   error_message: text (nullable)
//   user_id: uuid (nullable)
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: leads_salvos
//   id: uuid (not null, default: gen_random_uuid())
//   razao_social: text (nullable)
//   cnpj: text (nullable)
//   cnae_principal: text (nullable)
//   municipio: text (nullable)
//   uf: text (nullable)
//   porte: text (nullable)
//   situacao: text (nullable)
//   capital_social: numeric (nullable)
//   data_abertura: date (nullable)
//   email: text (nullable)
//   telefone: text (nullable)
//   socios: jsonb (nullable, default: '[]'::jsonb)
//   salvo_por: uuid (nullable)
//   status_contato: text (nullable)
//   ultima_data_contato: timestamp without time zone (nullable)
//   observacoes: text (nullable)
//   created_at: timestamp without time zone (nullable, default: now())
//   decisor_nome: text (nullable)
//   decisor_telefone: text (nullable)
//   decisor_email: text (nullable)
//   historico_interacoes: jsonb (nullable, default: '[]'::jsonb)
//   user_id: uuid (nullable)
// Table: notifications
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   title: text (not null)
//   message: text (not null)
//   read: boolean (not null, default: false)
//   created_at: timestamp with time zone (not null, default: now())
// Table: opportunities
//   id: uuid (not null, default: gen_random_uuid())
//   lead_id: uuid (not null)
//   stage: opportunity_stage (not null, default: 'prospecting'::opportunity_stage)
//   value: numeric (nullable, default: 0.00)
//   probability: integer (nullable, default: 0)
//   expected_close_date: date (nullable)
//   notes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: perfis_acesso
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   permissoes: jsonb (not null, default: '[]'::jsonb)
// Table: profiles
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   nome: text (not null)
//   email: text (not null)
//   perfil_id: uuid (nullable)
//   ativo: boolean (not null, default: true)
//   require_password_update: boolean (not null, default: false)
// Table: reminders
//   id: uuid (not null, default: gen_random_uuid())
//   lead_id: uuid (not null)
//   user_id: uuid (not null)
//   reminder_type: reminder_type_enum (not null, default: 'follow_up'::reminder_type_enum)
//   days_interval: integer (not null, default: 7)
//   last_reminded_at: timestamp with time zone (nullable)
//   is_active: boolean (not null, default: true)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: search_history
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   cnae: text (nullable)
//   porte: text (nullable)
//   estado: text (nullable)
//   cidade: text (nullable)
//   total_results: integer (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: settings
//   id: uuid (not null, default: gen_random_uuid())
//   key: text (not null)
//   value: jsonb (not null, default: '{}'::jsonb)
//   updated_at: timestamp with time zone (not null, default: now())
// Table: user_reminder_settings
//   user_id: uuid (not null)
//   follow_up_days: integer (not null, default: 7)
//   proposal_days: integer (not null, default: 3)
//   closing_days: integer (not null, default: 1)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())

// --- CONSTRAINTS ---
// Table: api_debug_logs
//   PRIMARY KEY api_debug_logs_pkey: PRIMARY KEY (id)
// Table: audit_logs
//   PRIMARY KEY audit_logs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY audit_logs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
// Table: bitrix_api_logs
//   PRIMARY KEY bitrix_api_logs_pkey: PRIMARY KEY (id)
// Table: bitrix_clients_zion
//   UNIQUE bitrix_clients_zion_bitrix_id_key: UNIQUE (bitrix_id)
//   PRIMARY KEY bitrix_clients_zion_pkey: PRIMARY KEY (id)
// Table: bitrix_rate_limit_config
//   PRIMARY KEY bitrix_rate_limit_config_pkey: PRIMARY KEY (id)
// Table: bitrix_webhook_events
//   PRIMARY KEY bitrix_webhook_events_pkey: PRIMARY KEY (id)
// Table: cache_pesquisas
//   UNIQUE cache_pesquisas_chave_cache_key: UNIQUE (chave_cache)
//   PRIMARY KEY cache_pesquisas_pkey: PRIMARY KEY (id)
// Table: company_duplicates
//   FOREIGN KEY company_duplicates_duplicate_company_id_fkey: FOREIGN KEY (duplicate_company_id) REFERENCES bitrix_clients_zion(bitrix_id) ON DELETE CASCADE
//   FOREIGN KEY company_duplicates_merged_by_fkey: FOREIGN KEY (merged_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY company_duplicates_original_company_id_fkey: FOREIGN KEY (original_company_id) REFERENCES bitrix_clients_zion(bitrix_id) ON DELETE CASCADE
//   PRIMARY KEY company_duplicates_pkey: PRIMARY KEY (id)
//   CHECK company_duplicates_similarity_score_check: CHECK (((similarity_score >= (0)::numeric) AND (similarity_score <= (100)::numeric)))
// Table: company_enriched_cache
//   PRIMARY KEY company_enriched_cache_pkey: PRIMARY KEY (cnpj)
// Table: company_merge_history
//   FOREIGN KEY company_merge_history_merged_by_fkey: FOREIGN KEY (merged_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY company_merge_history_merged_to_company_id_fkey: FOREIGN KEY (merged_to_company_id) REFERENCES bitrix_clients_zion(bitrix_id) ON DELETE CASCADE
//   PRIMARY KEY company_merge_history_pkey: PRIMARY KEY (id)
//   FOREIGN KEY company_merge_history_reverted_by_fkey: FOREIGN KEY (reverted_by) REFERENCES auth.users(id) ON DELETE SET NULL
// Table: configuracoes_sistema
//   PRIMARY KEY configuracoes_sistema_pkey: PRIMARY KEY (id)
// Table: contatos_realizados
//   FOREIGN KEY contatos_realizados_executivo_id_fkey: FOREIGN KEY (executivo_id) REFERENCES profiles(id) ON DELETE CASCADE
//   PRIMARY KEY contatos_realizados_pkey: PRIMARY KEY (id)
// Table: empresas_rfb
//   PRIMARY KEY empresas_rfb_pkey: PRIMARY KEY (cnpj)
// Table: leads_bitrix_sync
//   FOREIGN KEY leads_bitrix_sync_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads_salvos(id) ON DELETE SET NULL
//   PRIMARY KEY leads_bitrix_sync_pkey: PRIMARY KEY (id)
//   FOREIGN KEY leads_bitrix_sync_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: leads_salvos
//   PRIMARY KEY leads_salvos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY leads_salvos_salvo_por_fkey: FOREIGN KEY (salvo_por) REFERENCES profiles(id) ON DELETE SET NULL
//   FOREIGN KEY leads_salvos_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: notifications
//   PRIMARY KEY notifications_pkey: PRIMARY KEY (id)
//   FOREIGN KEY notifications_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: opportunities
//   FOREIGN KEY opportunities_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads_salvos(id) ON DELETE CASCADE
//   PRIMARY KEY opportunities_pkey: PRIMARY KEY (id)
//   CHECK opportunities_probability_check: CHECK (((probability >= 0) AND (probability <= 100)))
// Table: perfis_acesso
//   PRIMARY KEY perfis_acesso_pkey: PRIMARY KEY (id)
// Table: profiles
//   FOREIGN KEY profiles_perfil_id_fkey: FOREIGN KEY (perfil_id) REFERENCES perfis_acesso(id) ON DELETE SET NULL
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
//   FOREIGN KEY profiles_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: reminders
//   FOREIGN KEY reminders_lead_id_fkey: FOREIGN KEY (lead_id) REFERENCES leads_salvos(id) ON DELETE CASCADE
//   PRIMARY KEY reminders_pkey: PRIMARY KEY (id)
//   FOREIGN KEY reminders_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: search_history
//   PRIMARY KEY search_history_pkey: PRIMARY KEY (id)
//   FOREIGN KEY search_history_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: settings
//   UNIQUE settings_key_key: UNIQUE (key)
//   PRIMARY KEY settings_pkey: PRIMARY KEY (id)
// Table: user_reminder_settings
//   PRIMARY KEY user_reminder_settings_pkey: PRIMARY KEY (user_id)
//   FOREIGN KEY user_reminder_settings_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE

// --- ROW LEVEL SECURITY POLICIES ---
// Table: api_debug_logs
//   Policy "Enable INSERT for authenticated admins" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM (profiles p      JOIN perfis_acesso pa ON ((p.perfil_id = pa.id)))   WHERE ((p.user_id = auth.uid()) AND (pa.nome = 'Administrador'::text))))
//   Policy "Enable SELECT for authenticated admins" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM (profiles p      JOIN perfis_acesso pa ON ((p.perfil_id = pa.id)))   WHERE ((p.user_id = auth.uid()) AND (pa.nome = 'Administrador'::text))))
// Table: audit_logs
//   Policy "Enable insert for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "Enable select for admins" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM (profiles p      JOIN perfis_acesso pa ON ((p.perfil_id = pa.id)))   WHERE ((p.user_id = auth.uid()) AND (pa.nome = 'Administrador'::text))))
// Table: bitrix_api_logs
//   Policy "Allow authenticated users all on bitrix_api_logs" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: bitrix_clients_zion
//   Policy "Enable ALL for admins" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM (profiles p      JOIN perfis_acesso pa ON ((p.perfil_id = pa.id)))   WHERE ((p.user_id = auth.uid()) AND (pa.nome = 'Administrador'::text))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM (profiles p      JOIN perfis_acesso pa ON ((p.perfil_id = pa.id)))   WHERE ((p.user_id = auth.uid()) AND (pa.nome = 'Administrador'::text))))
//   Policy "Enable SELECT for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: bitrix_rate_limit_config
//   Policy "Allow authenticated users all on bitrix_rate_limit_config" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: bitrix_webhook_events
//   Policy "Allow authenticated users all on bitrix_webhook_events" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: cache_pesquisas
//   Policy "Allow authenticated users to delete cache" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Allow authenticated users to insert cache" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Allow authenticated users to select cache" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Allow authenticated users to update cache" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: company_duplicates
//   Policy "Enable ALL for authenticated users on company_duplicates" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: company_enriched_cache
//   Policy "Allow authenticated users to delete enriched cache" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Allow authenticated users to insert enriched cache" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Allow authenticated users to select enriched cache" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Allow authenticated users to update enriched cache" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: company_merge_history
//   Policy "Enable ALL for authenticated users on company_merge_history" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: configuracoes_sistema
//   Policy "Enable INSERT for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable SELECT for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable UPDATE for admins only" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM (profiles p      JOIN perfis_acesso pa ON ((p.perfil_id = pa.id)))   WHERE ((p.user_id = auth.uid()) AND (pa.nome = 'Administrador'::text))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM (profiles p      JOIN perfis_acesso pa ON ((p.perfil_id = pa.id)))   WHERE ((p.user_id = auth.uid()) AND (pa.nome = 'Administrador'::text))))
// Table: contatos_realizados
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: empresas_rfb
//   Policy "Enable INSERT for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable SELECT for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable UPDATE for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: leads_bitrix_sync
//   Policy "Users can manage their own sync records" (ALL, PERMISSIVE) roles={authenticated}
//     USING: ((user_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM leads_salvos ls   WHERE ((ls.id = leads_bitrix_sync.lead_id) AND (ls.user_id = auth.uid())))) OR (EXISTS ( SELECT 1    FROM (profiles p      JOIN perfis_acesso pa ON ((p.perfil_id = pa.id)))   WHERE ((p.user_id = auth.uid()) AND (pa.nome = 'Administrador'::text)))))
// Table: leads_salvos
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: notifications
//   Policy "Users can manage their own notifications" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
// Table: opportunities
//   Policy "Enable ALL for authenticated users on opportunities" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: perfis_acesso
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: profiles
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: reminders
//   Policy "Users can manage their own reminders" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
// Table: search_history
//   Policy "Users can delete their own search history" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "Users can insert their own search history" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (user_id = auth.uid())
//   Policy "Users can update their own search history" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())
//   Policy "Users can view their own search history" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: settings
//   Policy "settings_auth_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: user_reminder_settings
//   Policy "Users can manage their own reminder settings" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//     WITH CHECK: (user_id = auth.uid())

// --- DATABASE FUNCTIONS ---
// FUNCTION find_potential_duplicates(numeric)
//   CREATE OR REPLACE FUNCTION public.find_potential_duplicates(min_score numeric DEFAULT 0.75)
//    RETURNS TABLE(empresa1_id integer, empresa2_id integer, similarity_score numeric, tipo_similaridade text)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       -- Configure the similarity threshold locally for this transaction
//       -- This allows the '%' operator to utilize the GiST index efficiently
//       PERFORM set_config('pg_trgm.similarity_threshold', min_score::text, true);
//
//       RETURN QUERY
//       SELECT
//           a.bitrix_id as empresa1_id,
//           b.bitrix_id as empresa2_id,
//           (similarity(a.company_name, b.company_name) * 100)::numeric as similarity_score,
//           'Razão Social (Fuzzy)'::text as tipo_similaridade
//       FROM public.bitrix_clients_zion a
//       JOIN public.bitrix_clients_zion b
//         ON a.company_name % b.company_name
//         AND a.bitrix_id < b.bitrix_id
//       WHERE a.company_name IS NOT NULL AND b.company_name IS NOT NULL
//       AND NOT EXISTS (
//           SELECT 1 FROM public.company_duplicates cd
//           WHERE (cd.original_company_id = a.bitrix_id AND cd.duplicate_company_id = b.bitrix_id)
//              OR (cd.original_company_id = b.bitrix_id AND cd.duplicate_company_id = a.bitrix_id)
//       )
//       ORDER BY similarity(a.company_name, b.company_name) DESC
//       LIMIT 50;
//   END;
//   $function$
//
// FUNCTION get_due_followups()
//   CREATE OR REPLACE FUNCTION public.get_due_followups()
//    RETURNS TABLE(lead_id uuid, user_id uuid, razao_social text, executivo_email text, executivo_nome text, opp_stage text, dias_sem_contato integer, reminder_type text)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       RETURN QUERY
//       WITH lead_data AS (
//           SELECT
//               l.id as lead_id,
//               l.razao_social,
//               l.ultima_data_contato,
//               l.created_at,
//               l.salvo_por,
//               o.stage as opp_stage,
//               p.user_id,
//               p.email as executivo_email,
//               p.nome as executivo_nome,
//               COALESCE(urs.follow_up_days, 7) as follow_up_days,
//               COALESCE(urs.proposal_days, 3) as proposal_days,
//               COALESCE(urs.closing_days, 1) as closing_days,
//               -- Calcula a diferença de dias desde o último contato ou criação
//               EXTRACT(DAY FROM (NOW() - COALESCE(l.ultima_data_contato, l.created_at)))::INTEGER as dias_sem_contato
//           FROM public.leads_salvos l
//           JOIN public.profiles p ON l.salvo_por = p.id
//           LEFT JOIN public.opportunities o ON o.lead_id = l.id
//           LEFT JOIN public.user_reminder_settings urs ON urs.user_id = p.user_id
//           WHERE l.status_contato NOT IN ('Convertido', 'Sem Interesse')
//       ),
//       due_leads AS (
//           SELECT
//               d.*,
//               -- Define o tipo de lembrete esperado com base no estágio do lead no funil
//               CASE
//                   WHEN d.opp_stage = 'proposal' THEN 'proposal'
//                   WHEN d.opp_stage = 'closing' THEN 'closing'
//                   ELSE 'follow_up'
//               END as expected_reminder_type,
//               -- Define a meta de dias com base nas configurações e estágio
//               CASE
//                   WHEN d.opp_stage = 'proposal' THEN d.proposal_days
//                   WHEN d.opp_stage = 'closing' THEN d.closing_days
//                   ELSE d.follow_up_days
//               END as target_days
//           FROM lead_data d
//       )
//       SELECT
//           d.lead_id,
//           d.user_id,
//           d.razao_social,
//           d.executivo_email,
//           d.executivo_nome,
//           d.opp_stage,
//           d.dias_sem_contato,
//           d.expected_reminder_type
//       FROM due_leads d
//       -- Fazemos um LEFT JOIN na tabela reminders para verificar quando foi enviada a última notificação
//       LEFT JOIN public.reminders r ON r.lead_id = d.lead_id AND r.reminder_type::text = d.expected_reminder_type
//       -- Filtramos os leads onde os dias sem contato são maiores ou iguais à meta
//       WHERE d.dias_sem_contato >= d.target_days
//       -- E que não foram notificados nas últimas 24 horas (para evitar spam)
//       AND (r.last_reminded_at IS NULL OR EXTRACT(DAY FROM (NOW() - r.last_reminded_at)) >= 1);
//   END;
//   $function$
//
// FUNCTION get_due_reminders_with_leads()
//   CREATE OR REPLACE FUNCTION public.get_due_reminders_with_leads()
//    RETURNS TABLE(reminder_id uuid, user_id uuid, lead_id uuid, reminder_type reminder_type_enum, days_interval integer, razao_social text, executivo_email text, executivo_nome text)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       RETURN QUERY
//       SELECT
//           r.id as reminder_id,
//           r.user_id,
//           r.lead_id,
//           r.reminder_type,
//           r.days_interval,
//           l.razao_social,
//           p.email as executivo_email,
//           p.nome as executivo_nome
//       FROM public.reminders r
//       JOIN public.leads_salvos l ON r.lead_id = l.id
//       JOIN public.profiles p ON r.user_id = p.user_id
//       WHERE r.is_active = true
//       AND NOW() >= COALESCE(r.last_reminded_at, r.created_at) + (r.days_interval * interval '1 day');
//   END;
//   $function$
//
// FUNCTION limpar_cache_pesquisas(text)
//   CREATE OR REPLACE FUNCTION public.limpar_cache_pesquisas(p_cnae text DEFAULT NULL::text)
//    RETURNS integer
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       v_count int;
//       v_cnae_clean text;
//   BEGIN
//       IF p_cnae IS NULL OR trim(p_cnae) = '' THEN
//           -- Adicionado WHERE id IS NOT NULL para evitar o erro "DELETE requires a WHERE clause"
//           DELETE FROM public.cache_pesquisas WHERE id IS NOT NULL;
//           GET DIAGNOSTICS v_count = ROW_COUNT;
//       ELSE
//           -- Clean up formatting from the input CNAE
//           v_cnae_clean := regexp_replace(p_cnae, '\D', '', 'g');
//
//           -- Delete cache entries where:
//           -- 1. The input CNAE is present in the 'parametros->cnaes' JSON array (new way)
//           -- 2. OR the results text contains the cleaned CNAE (fallback for older cache entries)
//           -- 3. OR the results text contains the formatted input CNAE (fallback for older cache entries)
//           DELETE FROM public.cache_pesquisas
//           WHERE
//               (parametros->'cnaes')::jsonb ? v_cnae_clean
//               OR resultados::text LIKE '%' || v_cnae_clean || '%'
//               OR resultados::text LIKE '%' || p_cnae || '%';
//
//           GET DIAGNOSTICS v_count = ROW_COUNT;
//       END IF;
//
//       RETURN v_count;
//   END;
//   $function$
//
// FUNCTION update_opportunities_updated_at()
//   CREATE OR REPLACE FUNCTION public.update_opportunities_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       NEW.updated_at = NOW();
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION update_reminders_updated_at()
//   CREATE OR REPLACE FUNCTION public.update_reminders_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       NEW.updated_at = NOW();
//       RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: opportunities
//   update_opportunities_updated_at_trigger: CREATE TRIGGER update_opportunities_updated_at_trigger BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION update_opportunities_updated_at()
// Table: reminders
//   update_reminders_updated_at_trigger: CREATE TRIGGER update_reminders_updated_at_trigger BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION update_reminders_updated_at()

// --- INDEXES ---
// Table: audit_logs
//   CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC)
//   CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id)
// Table: bitrix_api_logs
//   CREATE INDEX idx_bitrix_api_logs_endpoint ON public.bitrix_api_logs USING btree (endpoint)
//   CREATE INDEX idx_bitrix_api_logs_timestamp ON public.bitrix_api_logs USING btree ("timestamp")
// Table: bitrix_clients_zion
//   CREATE UNIQUE INDEX bitrix_clients_zion_bitrix_id_key ON public.bitrix_clients_zion USING btree (bitrix_id)
//   CREATE INDEX idx_bitrix_clients_zion_bitrix_id ON public.bitrix_clients_zion USING btree (bitrix_id)
//   CREATE INDEX idx_bitrix_clients_zion_cnae_principal ON public.bitrix_clients_zion USING btree (cnae_principal)
//   CREATE INDEX trgm_idx_bitrix_clients_company_name ON public.bitrix_clients_zion USING gist (company_name gist_trgm_ops)
// Table: bitrix_webhook_events
//   CREATE INDEX idx_bitrix_webhook_events_event_type ON public.bitrix_webhook_events USING btree (event_type)
// Table: cache_pesquisas
//   CREATE UNIQUE INDEX cache_pesquisas_chave_cache_key ON public.cache_pesquisas USING btree (chave_cache)
// Table: company_duplicates
//   CREATE INDEX idx_company_duplicates_duplicate ON public.company_duplicates USING btree (duplicate_company_id)
//   CREATE INDEX idx_company_duplicates_original ON public.company_duplicates USING btree (original_company_id)
//   CREATE INDEX idx_company_duplicates_status ON public.company_duplicates USING btree (status)
// Table: company_merge_history
//   CREATE INDEX idx_company_merge_history_merged_to ON public.company_merge_history USING btree (merged_to_company_id)
//   CREATE INDEX idx_company_merge_history_original ON public.company_merge_history USING btree (original_company_id)
// Table: leads_bitrix_sync
//   CREATE INDEX idx_leads_bitrix_sync_deal_id ON public.leads_bitrix_sync USING btree (deal_id)
//   CREATE INDEX idx_leads_bitrix_sync_lead_id ON public.leads_bitrix_sync USING btree (lead_id)
//   CREATE INDEX idx_leads_bitrix_sync_user_id ON public.leads_bitrix_sync USING btree (user_id)
// Table: leads_salvos
//   CREATE INDEX idx_leads_salvos_user_id ON public.leads_salvos USING btree (user_id)
// Table: notifications
//   CREATE INDEX idx_notifications_read ON public.notifications USING btree (read)
//   CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id)
// Table: opportunities
//   CREATE INDEX idx_opportunities_lead_id ON public.opportunities USING btree (lead_id)
//   CREATE INDEX idx_opportunities_stage ON public.opportunities USING btree (stage)
// Table: reminders
//   CREATE INDEX idx_reminders_is_active ON public.reminders USING btree (is_active)
//   CREATE INDEX idx_reminders_lead_id ON public.reminders USING btree (lead_id)
//   CREATE INDEX idx_reminders_user_id ON public.reminders USING btree (user_id)
// Table: search_history
//   CREATE INDEX idx_search_history_created_at ON public.search_history USING btree (created_at DESC)
//   CREATE INDEX idx_search_history_user_id ON public.search_history USING btree (user_id)
// Table: settings
//   CREATE UNIQUE INDEX settings_key_key ON public.settings USING btree (key)
