-- Create table for storing normalized Bitrix kanban data
CREATE TABLE IF NOT EXISTS bitrix_kanbans (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('LEAD', 'DEAL')),
  category_id VARCHAR(50) NOT NULL,
  status_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sort INTEGER DEFAULT 0,
  bitrix_id VARCHAR(50),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure uniqueness of entity_type + category_id + status_id combination
  UNIQUE(entity_type, category_id, status_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bitrix_kanbans_entity_type ON bitrix_kanbans(entity_type);
CREATE INDEX IF NOT EXISTS idx_bitrix_kanbans_category_id ON bitrix_kanbans(category_id);
CREATE INDEX IF NOT EXISTS idx_bitrix_kanbans_last_synced ON bitrix_kanbans(last_synced_at);

-- Add RLS policies
ALTER TABLE bitrix_kanbans ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "bitrix_kanbans_read_policy" ON bitrix_kanbans
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admin users to manage kanban data
CREATE POLICY "bitrix_kanbans_admin_policy" ON bitrix_kanbans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN perfis_acesso pa ON pa.id = p.perfil_id
      WHERE p.id = auth.uid()
      AND pa.nome = 'Administrador'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bitrix_kanbans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_bitrix_kanbans_updated_at
  BEFORE UPDATE ON bitrix_kanbans
  FOR EACH ROW EXECUTE FUNCTION update_bitrix_kanbans_updated_at();
