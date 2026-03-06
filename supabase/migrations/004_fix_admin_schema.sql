-- =====================================================
-- MIGRATION: 004_fix_admin_schema.sql
-- Ajustes finos no banco para o Admin funcionar 100%
-- =====================================================

-- 1. Garantir que a coluna cta_text existe em hero_banners (o front espera ela)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hero_banners' AND column_name='cta_text') THEN
        ALTER TABLE hero_banners ADD COLUMN cta_text TEXT DEFAULT 'VER DROP';
    END IF;
END $$;

-- 2. Limpar os banners de teste/placeholder que estão confundindo o usuário
-- Deletamos os que usam as imagens padrão /bannerX.png ou links externos (unsplash)
DELETE FROM hero_banners 
WHERE image_url LIKE '/banner%.png' 
   OR image_url LIKE 'http%';

-- 3. Garantir que is_admin existe no profiles (visto no schema 001, mas reforçando se necessário)
-- Não fazemos nada se já existe, mas se o usuário tiver rodado algo que mudou para 'role', 
-- o código agora já está buscando 'is_admin'.

-- 4. Otimização: Adicionar índice no slug das tabelas principais para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
