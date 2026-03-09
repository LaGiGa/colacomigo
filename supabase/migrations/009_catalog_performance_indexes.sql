-- =====================================================
-- MIGRATION: 009_catalog_performance_indexes.sql
-- Melhorias de performance para vitrine de produtos
-- =====================================================

-- Consulta principal da vitrine: produtos ativos ordenados por criação
CREATE INDEX IF NOT EXISTS idx_products_active_created_at
  ON public.products (is_active, created_at DESC);

-- Consultas filtradas por categoria, marca e coleção
CREATE INDEX IF NOT EXISTS idx_products_active_category_created_at
  ON public.products (is_active, category_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_active_brand_created_at
  ON public.products (is_active, brand_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_active_collection_created_at
  ON public.products (is_active, collection_id, created_at DESC);

-- Busca de página de produto por slug (inclusive fallback case-insensitive)
CREATE INDEX IF NOT EXISTS idx_products_slug_lower
  ON public.products (lower(slug));
