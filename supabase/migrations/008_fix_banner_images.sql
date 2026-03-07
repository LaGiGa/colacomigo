-- =====================================================
-- MIGRATION: 008_fix_banner_images.sql
-- Restaurar banners com as imagens locais corretas
-- =====================================================

-- Limpar banners errados (Unsplash/externos)
DELETE FROM public.hero_banners;

-- Inserir os banners corretos apontando para a pasta public
INSERT INTO public.hero_banners (title, subtitle, image_url, link_url, cta_text, is_active, sort_order)
VALUES 
('ESTILO QUE DOMINA', 'DROP EXCLUSIVO COLA COMIGO', '/banner1.png', '/produtos', 'VER AGORA', true, 1),
('SNEAKERS HIGHLIGHTS', 'COLEÇÃO STREETWEAR 2024', '/banner2.png', '/produtos', 'EXPLORAR', true, 2),
('ACESSÓRIOS PREMIUM', 'COMPLETE SEU KIT', '/banner3.png', '/produtos', 'CONFERIR', true, 3),
('NOVA COLEÇÃO', 'UK DRIP & SPORTLIFE', '/banner4.png', '/produtos', 'VER DROP', true, 4),
('O MELHOR DO HYPE', 'PEÇAS SELECIONADAS', '/banner5.png', '/produtos', 'SAIBA MAIS', true, 5);
