-- =====================================================
-- MIGRATION: 007_recovery_data.sql
-- Recuperação de Banners e Marcas
-- =====================================================

-- Forçar ativação de todos os banners e marcas para garantir visibilidade
UPDATE public.hero_banners SET is_active = TRUE;
UPDATE public.brands SET is_active = TRUE;

-- Garantir colunas básicas se alguma migração anterior falhou
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.hero_banners ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'VER DROP';
ALTER TABLE public.hero_banners ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
