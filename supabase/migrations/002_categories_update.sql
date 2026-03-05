-- =====================================================
-- MIGRATION: 002_categories_update.sql
-- Adiciona campos description e position à tabela categories
-- Atualiza seed com categorias reais da Cola Comigo Shop
-- Executar no Supabase SQL Editor
-- =====================================================

-- Adiciona coluna description se não existir
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;

-- Adiciona coluna position (alias de sort_order para compatibilidade)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;

-- Sincroniza position com sort_order
UPDATE categories SET position = sort_order WHERE position = 0 AND sort_order > 0;

-- Adiciona sku e collection nas variáveis de produto
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT FALSE;

-- Remove categorias genéricas e insere as reais da Cola Comigo Shop
-- (Execute apenas se o banco ainda tiver as categorias genéricas)
DELETE FROM categories WHERE slug IN ('roupas', 'sneakers', 'acessorios', 'marcas');

-- Seed: Categorias reais da Cola Comigo Shop
INSERT INTO categories (name, slug, description, position, is_active) VALUES
  ('Camisas',    'camisas',   'Camisas grife e streetwear das melhores marcas',   1, TRUE),
  ('Calças',     'calcas',    'Baggy, Cargo, Jogger e muito mais',                 2, TRUE),
  ('Short''s',   'shorts',    'Bermudas premium para o dia a dia',                 3, TRUE),
  ('Tênis',      'tenis',     'Sneakers das marcas que rolam',                     4, TRUE),
  ('Bonés',      'bones',     'Caps e headwear das melhores grifes',               5, TRUE),
  ('Bags',       'bags',      'Mochilas, pochetes e bags grife',                   6, TRUE),
  ('Casacos',    'casacos',   'Moletons, jaquetas e corta-ventos',                 7, TRUE),
  ('Chinelos',   'chinelos',  'Slides e sandálias das melhores marcas',            8, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Seed: Marcas reais da Cola Comigo Shop
INSERT INTO brands (name, slug) VALUES
  ('Chronic',     'chronic'),
  ('Supreme',     'supreme'),
  ('Trip Side',   'trip-side'),
  ('Ripndip',     'ripndip'),
  ('Nike Pro',    'nike-pro'),
  ('Adidas',      'adidas'),
  ('New Balance', 'new-balance'),
  ('Stone Island','stone-island')
ON CONFLICT (slug) DO NOTHING;

-- Índice para position
CREATE INDEX IF NOT EXISTS idx_categories_position ON categories(position);
