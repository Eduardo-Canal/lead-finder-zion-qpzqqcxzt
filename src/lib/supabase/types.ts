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
          email: string | null
          id: string
          phone: string | null
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
          email?: string | null
          id?: string
          phone?: string | null
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
          email?: string | null
          id?: string
          phone?: string | null
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
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          data_contato?: string | null
          executivo_id?: string | null
          executivo_nome?: string | null
          id?: string
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          data_contato?: string | null
          executivo_id?: string | null
          executivo_nome?: string | null
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      limpar_cache_pesquisas: { Args: { p_cnae?: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
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

// --- CONSTRAINTS ---
// Table: api_debug_logs
//   PRIMARY KEY api_debug_logs_pkey: PRIMARY KEY (id)
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
// Table: configuracoes_sistema
//   PRIMARY KEY configuracoes_sistema_pkey: PRIMARY KEY (id)
// Table: contatos_realizados
//   FOREIGN KEY contatos_realizados_executivo_id_fkey: FOREIGN KEY (executivo_id) REFERENCES profiles(id) ON DELETE CASCADE
//   PRIMARY KEY contatos_realizados_pkey: PRIMARY KEY (id)
// Table: empresas_rfb
//   PRIMARY KEY empresas_rfb_pkey: PRIMARY KEY (cnpj)
// Table: leads_salvos
//   PRIMARY KEY leads_salvos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY leads_salvos_salvo_por_fkey: FOREIGN KEY (salvo_por) REFERENCES profiles(id) ON DELETE SET NULL
// Table: perfis_acesso
//   PRIMARY KEY perfis_acesso_pkey: PRIMARY KEY (id)
// Table: profiles
//   FOREIGN KEY profiles_perfil_id_fkey: FOREIGN KEY (perfil_id) REFERENCES perfis_acesso(id) ON DELETE SET NULL
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
//   FOREIGN KEY profiles_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE

// --- ROW LEVEL SECURITY POLICIES ---
// Table: api_debug_logs
//   Policy "Enable INSERT for authenticated admins" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM (profiles p      JOIN perfis_acesso pa ON ((p.perfil_id = pa.id)))   WHERE ((p.user_id = auth.uid()) AND (pa.nome = 'Administrador'::text))))
//   Policy "Enable SELECT for authenticated admins" (SELECT, PERMISSIVE) roles={authenticated}
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
// Table: leads_salvos
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
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

// --- DATABASE FUNCTIONS ---
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

// --- INDEXES ---
// Table: bitrix_api_logs
//   CREATE INDEX idx_bitrix_api_logs_endpoint ON public.bitrix_api_logs USING btree (endpoint)
//   CREATE INDEX idx_bitrix_api_logs_timestamp ON public.bitrix_api_logs USING btree ("timestamp")
// Table: bitrix_clients_zion
//   CREATE UNIQUE INDEX bitrix_clients_zion_bitrix_id_key ON public.bitrix_clients_zion USING btree (bitrix_id)
//   CREATE INDEX idx_bitrix_clients_zion_bitrix_id ON public.bitrix_clients_zion USING btree (bitrix_id)
//   CREATE INDEX idx_bitrix_clients_zion_cnae_principal ON public.bitrix_clients_zion USING btree (cnae_principal)
// Table: bitrix_webhook_events
//   CREATE INDEX idx_bitrix_webhook_events_event_type ON public.bitrix_webhook_events USING btree (event_type)
// Table: cache_pesquisas
//   CREATE UNIQUE INDEX cache_pesquisas_chave_cache_key ON public.cache_pesquisas USING btree (chave_cache)
