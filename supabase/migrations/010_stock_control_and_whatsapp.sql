-- =====================================================
-- MIGRATION: 010_stock_control_and_whatsapp.sql
--
-- OBJETIVO
--   1. Baixa automática de estoque quando o pagamento é aprovado
--   2. Dados necessários para notificar a loja no WhatsApp
--      (tipo de entrega, forma de pagamento, controle de duplicidade)
--   3. Correções de integridade encontradas na auditoria
--
-- COMO EXECUTAR
--   Supabase → SQL Editor → cole este arquivo inteiro → Run.
--   É seguro rodar mais de uma vez (tudo usa IF NOT EXISTS / OR REPLACE).
--   ⚠️  Rode ANTES de publicar o novo deploy no Cloudflare.
-- =====================================================

-- =====================================================
-- 1. COLUNAS NOVAS EM `orders`
-- =====================================================

-- Controle de idempotência da baixa de estoque.
-- Garante que o mesmo pedido nunca dá baixa duas vezes, mesmo que o
-- webhook do Mercado Pago e o polling do checkout rodem ao mesmo tempo.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_applied BOOLEAN NOT NULL DEFAULT FALSE;

-- Momento exato da aprovação do pagamento
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Tipo de entrega escolhido pelo cliente no checkout.
-- Valores: 'store_pickup' | 'local_delivery' | 'correios_pac' | 'correios_sedex' | 'correios'
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;

-- Rótulo exibível da entrega, como o cliente viu na tela ("Retirar na Loja")
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label TEXT;

-- Forma de pagamento retornada pelo Mercado Pago ('pix', 'credit_card', ...)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Controle de duplicidade das notificações
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_notified_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS emails_sent_at TIMESTAMPTZ;

-- Rastreabilidade do cupom usado na compra
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Índice para o painel filtrar vendas recentes rapidamente
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
  ON public.orders (status, created_at DESC);


-- =====================================================
-- 2. CONFIGURAÇÃO DA NOTIFICAÇÃO NO PAINEL
-- =====================================================

ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS whatsapp_notify_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS whatsapp_notify_number  TEXT;

-- Número padrão da loja (só preenche se estiver vazio)
UPDATE public.store_settings
   SET whatsapp_notify_number = '5563991312913'
 WHERE id = 1 AND (whatsapp_notify_number IS NULL OR whatsapp_notify_number = '');


-- =====================================================
-- 3. HISTÓRICO DE MOVIMENTAÇÃO DE ESTOQUE
--    (o "extrato" de entradas e saídas de cada variante)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id  UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  order_id    UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  delta       INT  NOT NULL,     -- negativo = saída (venda) · positivo = entrada (estorno/ajuste)
  reason      TEXT NOT NULL,     -- 'sale' | 'cancel_restock' | 'manual_adjust'
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON public.stock_movements (variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_order   ON public.stock_movements (order_id);

-- RLS ligado e SEM policies: ninguém lê pelo client público.
-- Só o service_role (usado nas rotas de API do painel) enxerga.
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- 4. BAIXA DE ESTOQUE — atômica e idempotente
-- =====================================================

CREATE OR REPLACE FUNCTION public.apply_order_stock(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_applied   BOOLEAN;
  v_item      RECORD;
  v_new_stock INT;
  v_items     JSONB := '[]'::JSONB;
BEGIN
  -- Trava a linha do pedido: se duas requisições chegarem juntas
  -- (webhook + polling), a segunda espera aqui e depois sai fora.
  SELECT stock_applied INTO v_applied
    FROM public.orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found');
  END IF;

  IF v_applied THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'already_applied', 'items', v_items);
  END IF;

  FOR v_item IN
    SELECT variant_id, quantity
      FROM public.order_items
     WHERE order_id = p_order_id
       AND variant_id IS NOT NULL
  LOOP
    -- GREATEST(...,0) impede estoque negativo em caso de venda simultânea
    UPDATE public.product_variants
       SET stock = GREATEST(stock - v_item.quantity, 0)
     WHERE id = v_item.variant_id
     RETURNING stock INTO v_new_stock;

    IF v_new_stock IS NOT NULL THEN
      INSERT INTO public.stock_movements (variant_id, order_id, delta, reason)
      VALUES (v_item.variant_id, p_order_id, -v_item.quantity, 'sale');

      v_items := v_items || jsonb_build_object(
        'variant_id',    v_item.variant_id,
        'delta',         -v_item.quantity,
        'stock_after',   v_new_stock
      );
    END IF;

    v_new_stock := NULL;
  END LOOP;

  UPDATE public.orders SET stock_applied = TRUE WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'reason', 'applied', 'items', v_items);
END;
$$;


-- =====================================================
-- 5. ESTORNO DE ESTOQUE — pedido cancelado ou reembolsado
-- =====================================================

CREATE OR REPLACE FUNCTION public.restore_order_stock(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_applied   BOOLEAN;
  v_item      RECORD;
  v_new_stock INT;
  v_items     JSONB := '[]'::JSONB;
BEGIN
  SELECT stock_applied INTO v_applied
    FROM public.orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'order_not_found');
  END IF;

  IF NOT v_applied THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'nothing_to_restore', 'items', v_items);
  END IF;

  FOR v_item IN
    SELECT variant_id, quantity
      FROM public.order_items
     WHERE order_id = p_order_id
       AND variant_id IS NOT NULL
  LOOP
    UPDATE public.product_variants
       SET stock = stock + v_item.quantity
     WHERE id = v_item.variant_id
     RETURNING stock INTO v_new_stock;

    IF v_new_stock IS NOT NULL THEN
      INSERT INTO public.stock_movements (variant_id, order_id, delta, reason)
      VALUES (v_item.variant_id, p_order_id, v_item.quantity, 'cancel_restock');

      v_items := v_items || jsonb_build_object(
        'variant_id',  v_item.variant_id,
        'delta',       v_item.quantity,
        'stock_after', v_new_stock
      );
    END IF;

    v_new_stock := NULL;
  END LOOP;

  UPDATE public.orders SET stock_applied = FALSE WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'reason', 'restored', 'items', v_items);
END;
$$;


-- =====================================================
-- 6. CONTADOR DE USO DE CUPOM
--    (a coluna existia mas nunca era incrementada)
-- =====================================================

CREATE OR REPLACE FUNCTION public.increment_coupon_uses(p_coupon_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coupons SET uses_count = COALESCE(uses_count, 0) + 1 WHERE id = p_coupon_id;
$$;


-- =====================================================
-- 7. PERMISSÕES — só o backend (service_role) executa
-- =====================================================

REVOKE ALL ON FUNCTION public.apply_order_stock(UUID)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.restore_order_stock(UUID)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_coupon_uses(UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.apply_order_stock(UUID)     TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_order_stock(UUID)   TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_coupon_uses(UUID) TO service_role;


-- =====================================================
-- 8. BACKFILL — pedidos que já estão pagos
--
--    Marca os pedidos pagos ANTES desta migration como
--    "estoque já tratado", para que o novo código não saia
--    dando baixa retroativa em venda antiga.
--    O estoque atual do painel é considerado a verdade.
-- =====================================================

UPDATE public.orders
   SET stock_applied = TRUE,
       paid_at       = COALESCE(paid_at, updated_at, created_at)
 WHERE status IN ('paid', 'preparing', 'processing', 'shipped', 'delivered')
   AND stock_applied = FALSE;

-- Também marca como "já notificado" para não disparar WhatsApp de venda antiga
UPDATE public.orders
   SET whatsapp_notified_at = COALESCE(whatsapp_notified_at, updated_at, created_at),
       emails_sent_at       = COALESCE(emails_sent_at, updated_at, created_at)
 WHERE status IN ('paid', 'preparing', 'processing', 'shipped', 'delivered')
   AND whatsapp_notified_at IS NULL;
