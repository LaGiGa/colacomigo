-- ==============================================================================
-- 011_cleanup_products_and_storage.sql
-- 
-- Limpeza do catálogo de produtos e liberação do espaço do Supabase Storage
-- para migração definitiva para o Cloudflare R2.
--
-- Preserva:
--  - categories (Categorias da loja)
--  - brands (Marcas)
--  - profiles (Usuários e administradores)
--  - banners (Banners principais)
--  - store_settings (Configurações gerais)
-- ==============================================================================

BEGIN;

-- 1. Remove dependências de pedidos de teste anteriores (se houverem)
DELETE FROM order_items;

-- 2. Remove estoque das variantes
DELETE FROM inventory;

-- 3. Remove fotos associadas aos produtos
DELETE FROM product_images;

-- 4. Remove variantes de produtos
DELETE FROM product_variants;

-- 5. Remove todos os produtos do catálogo
DELETE FROM products;

-- 6. Esvazia os arquivos de imagens do Supabase Storage para zerar o consumo em MB
DELETE FROM storage.objects 
WHERE bucket_id IN ('products', 'public', 'images', 'uploads');

COMMIT;
