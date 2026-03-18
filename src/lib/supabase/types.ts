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
          cnpj: string
          complemento: string | null
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
          cnpj: string
          complemento?: string | null
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
          cnpj?: string
          complemento?: string | null
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
          email: string | null
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
          email?: string | null
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
          email?: string | null
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
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          email: string
          id?: string
          nome: string
          perfil_id?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          email?: string
          id?: string
          nome?: string
          perfil_id?: string | null
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
      [_ in never]: never
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

// --- CONSTRAINTS ---
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
// Table: contatos_realizados
//   Policy "Enable ALL for authenticated users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: empresas_rfb
//   Policy "Enable SELECT for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
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
