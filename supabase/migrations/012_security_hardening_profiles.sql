-- =====================================================
-- MIGRATION: 012_security_hardening_profiles.sql
--
-- OBJETIVO:
--   Blindagem definitiva contra escalação de privilégios na tabela profiles.
--   1. Trigger BEFORE UPDATE que impede usuários comuns de alterarem 'role' e 'is_admin'.
--   2. Substituição de políticas RLS permissivas por políticas estritas de SELECT/UPDATE/INSERT.
-- =====================================================

-- 1. FUNÇÃO TRIGGER PARA BLINDAR 'role' E 'is_admin'
CREATE OR REPLACE FUNCTION public.protect_profiles_admin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_jwt_role TEXT;
BEGIN
    -- Se nem 'role' nem 'is_admin' foram alterados, permite a atualização normal
    IF (OLD.role IS NOT DISTINCT FROM NEW.role) AND (OLD.is_admin IS NOT DISTINCT FROM NEW.is_admin) THEN
        RETURN NEW;
    END IF;

    -- Extrai o role do JWT da requisição atual
    BEGIN
        v_jwt_role := current_setting('request.jwt.claims', true)::jsonb->>'role';
    EXCEPTION WHEN OTHERS THEN
        v_jwt_role := NULL;
    END;

    -- Apenas service_role ou o próprio superuser do postgres podem alterar privilégios
    IF v_jwt_role = 'service_role' OR current_user = 'postgres' THEN
        RETURN NEW;
    END IF;

    -- Qualquer outra tentativa (usuários anon ou authenticated) é sumariamente bloqueada
    RAISE EXCEPTION 'Acesso Negado: Usuários não possuem permissão para alterar campos administrativos (role/is_admin).';
END;
$$;

-- 2. REGISTRAR TRIGGER NA TABELA PROFILES
DROP TRIGGER IF EXISTS trg_protect_profiles_admin_fields ON public.profiles;
CREATE TRIGGER trg_protect_profiles_admin_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profiles_admin_fields();

-- 3. AJUSTAR POLÍTICAS DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover política antiga e vulnerável
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- Leitura: usuário lê apenas seu próprio registro
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Atualização: usuário só pode atualizar seu próprio perfil (a trigger impede alteração de role/is_admin)
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Inserção: apenas perfil padrão de cliente
CREATE POLICY "profiles_insert_own"
    ON public.profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() = id 
        AND (role IS NULL OR role = 'customer') 
        AND (is_admin IS NULL OR is_admin = FALSE)
    );
