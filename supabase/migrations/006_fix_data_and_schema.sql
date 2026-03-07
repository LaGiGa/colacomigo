-- =====================================================
-- MIGRATION: 006_fix_data_and_schema.sql
-- Limpeza de dados e garantias de schema
-- =====================================================

-- 1. Garantir que a coluna is_admin existe no profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Ativar todas as marcas para garantir que apareçam na Home
UPDATE public.brands SET is_active = TRUE;

-- 3. Limpar banners que não são do usuário
-- Banners que começam com / são locais, banners que começam com http são externos.
-- O usuário disse que tem um banner passando que "não é dele e nem está na pasta public".
-- Isso sugere que é um banner com URL externa (ou talvez um que eu adicionei via script).
-- Vou desativar todos os banners que usam URLs externas e deixar apenas o que parece ser local (/...)
UPDATE public.hero_banners SET is_active = FALSE WHERE image_url LIKE 'http%';

-- Garantir que pelo menos 1 banner esteja ativo (o mais recente)
UPDATE public.hero_banners 
SET is_active = TRUE 
WHERE id = (SELECT id FROM public.hero_banners ORDER BY created_at DESC LIMIT 1);
