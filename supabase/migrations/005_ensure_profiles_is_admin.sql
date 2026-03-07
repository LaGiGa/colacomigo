-- =====================================================
-- MIGRATION: 005_ensure_profiles_is_admin.sql
-- Garante que o sistema de permissões do admin está correto
-- =====================================================

DO $$ 
BEGIN
    -- Se existir a coluna 'role' mas não 'is_admin'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        -- Se houver alguém com role 'admin', marca como is_admin
        UPDATE profiles SET is_admin = TRUE WHERE role = 'admin';
    END IF;

    -- Se não existir 'is_admin' ainda (por qualquer motivo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Garantir que pelo menos o usuário atual (se houver) possa ser admin se o usuário estiver logado e souber o ID
-- Mas não temos o ID aqui. O usuário deve fazer isso via SQL Editor se perder o acesso.
