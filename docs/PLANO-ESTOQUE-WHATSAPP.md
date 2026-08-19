# Plano: Baixa Automática de Estoque + Notificação WhatsApp
### Cola Comigo Shop — Auditoria completa + implementação das 2 funcionalidades

> Documento gerado a partir de uma varredura completa do código (`src/`, `supabase/`, configs de deploy).
> Baseline técnico verificado: `npx tsc --noEmit` passa **sem erros**. Next.js 16.1.6 + React 19 +
> Supabase + Mercado Pago, rodando em Cloudflare Workers via OpenNext.

---

## 1. Como o sistema funciona hoje (fluxo real da venda)

```
Cliente escolhe produto → carrinho (localStorage/zustand)
   ↓
/checkout → escolhe entrega (retirada / entrega Palmas / Correios) → preenche endereço
   ↓
POST /api/checkout/preference   → cria `addresses` + `orders` (status=pending) + `order_items`
   ↓
PaymentBrick → POST /api/checkout/payment → Mercado Pago → status awaiting_payment/paid
   ↓
   ├── POST /api/checkout/webhook        (Mercado Pago avisa)      → marca 'paid' + 2 e-mails
   └── GET  /api/checkout/order-status   (polling do front, 5s)    → marca 'paid' + 2 e-mails
   ↓
Admin: AdminSalesNotifier faz polling de /api/admin/orders a cada 10s e mostra toast
```

**O que NÃO acontece hoje:**
- ❌ Nenhuma baixa de estoque. A função `decrement_stock(p_variant_id, p_qty)` **já existe no banco**
  (aparece em `src/types/database.types.ts:767`) mas **nunca é chamada em lugar nenhum do código**.
- ❌ Nenhuma notificação por WhatsApp para a loja. Só e-mail (Resend) para
  `NEW_SALE_NOTIFY_EMAIL` / `colacomigoshop@gmail.com`.
- ❌ O tipo de entrega escolhido (retirada / entrega local / Correios) **não é salvo no pedido**.
  Só o valor do frete (`shipping_cost`) é gravado. Então nem o admin nem o e-mail sabem
  se aquela venda é retirada na loja ou envio.

---

## 2. Diagnóstico — problemas encontrados

Ordenados por gravidade. Os marcados com 🔗 são pré-requisitos das duas funcionalidades pedidas.

### 🔴 CRÍTICO

| # | Problema | Onde | Impacto |
|---|---|---|---|
| C1 | **Preço do pedido é controlado pelo cliente.** A rota recebe `items[].price`, `shipping.price` e o objeto `coupon` (com `discount_value`) direto do `body` e calcula o total a partir disso, sem conferir no banco. | `src/app/api/checkout/preference/route.ts:22-42` | Alguém com o DevTools aberto compra um tênis de R$ 800 por R$ 1,00. O Mercado Pago cobra o valor que o servidor mandou. **Prejuízo financeiro direto.** |
| C2 | **Editar um produto apaga e recria todas as variantes.** O PATCH faz `DELETE FROM product_variants WHERE product_id = x` e insere de novo com IDs novos. | `src/app/api/admin/products/[id]/route.ts:41-49` | Pedidos antigos perdem o vínculo com o item vendido (`order_items.variant_id` fica órfão/nulo), carrinhos salvos no navegador do cliente apontam para variantes que não existem mais, e **qualquer controle de estoque é zerado a cada edição**. 🔗 |
| C3 | **Não existe baixa de estoque.** | (ausente) | É a funcionalidade 1 pedida. 🔗 |
| C4 | **Webhook do Mercado Pago sem validação de assinatura.** Não verifica o header `x-signature`. | `src/app/api/checkout/webhook/route.ts:9` | Endpoint público que qualquer um pode chamar. Hoje o dano é limitado (o código busca o pagamento na API do MP antes de agir), mas quando a baixa de estoque entrar, vira vetor para zerar estoque e disparar notificações falsas. 🔗 |

### 🟠 ALTO

| # | Problema | Onde | Impacto |
|---|---|---|---|
| A1 | **Cálculo de frete dos Correios está quebrado.** O front envia `{ cepDestino, itens }` e a API espera `items` → retorna **400 sempre**. Além disso a API testa `settings?.is_active`, coluna que **não existe** em `shipping_settings`, e devolve `{id, name, price, deadline}` enquanto o front espera `{serviceName, carrier, price, estimatedDays}`. | `ShippingCalculator.tsx:139` vs `api/checkout/shipping/route.ts:9,24,70` | O botão "CALCULAR" nunca funciona. O cliente só consegue escolher retirada ou entrega local. |
| A2 | **`user_id` nunca é gravado no pedido.** | `api/checkout/preference/route.ts:52` | A página "Meus Pedidos" (`ContaPedidosClient.tsx:58` filtra por `user_id`) fica **sempre vazia** para todo cliente logado. |
| A3 | **Validação de cupom lê colunas que não existem.** Usa `used_count`, `usage_limit`, `min_purchase_value`; no banco são `uses_count`, `max_uses`, `min_order_value`. E compara `discount_type === 'percentage'` enquanto o admin grava `'percent'`. `uses_count` também nunca é incrementado. | `api/checkout/coupon/route.ts:29-40` | **Limite de uso e valor mínimo do cupom nunca são aplicados.** Um cupom "10 usos" pode ser usado infinitas vezes. |
| A4 | **Lógica de "pedido pago" duplicada, sem trava de idempotência.** ~100 linhas praticamente idênticas no webhook e no order-status; os dois podem rodar ao mesmo tempo (o polling roda de 5 em 5s). | `webhook/route.ts:56-150` e `order-status/route.ts:44-140` | E-mails duplicados para o cliente. Quando a baixa de estoque entrar, **baixa dobrada**. 🔗 |
| A5 | **E-mail do admin gera `[object Promise]`.** Usa `.map(async …).join('')` sem `Promise.all`. | `api/admin/orders/[id]/send-email/route.ts:33-40` | O e-mail de confirmação reenviado pelo painel sai com a lista de itens corrompida. |

### 🟡 MÉDIO

| # | Problema | Onde |
|---|---|---|
| M1 | **Tipo de entrega não é salvo.** O `carrier` (`store_pickup` / `palmas_local` / `pac` / `sedex`) é escolhido no checkout mas descartado — só `serviceName` e `price` vão para a API, e a API só grava o preço. 🔗 | `CheckoutFlow.tsx:203-206` + `preference/route.ts` |
| M2 | **Nenhuma validação de estoque no carrinho ou no checkout.** O `addItem` sempre soma +1 sem olhar `stock`. Dá para vender 10 unidades de um item que tem 1. 🔗 | `store/useCartStore.ts:12-27` |
| M3 | **Migrations desatualizadas em relação ao banco real.** O SQL em `supabase/migrations/` descreve tabela `inventory` (não usada — o estoque real é `product_variants.stock`), `orders.shipping_address_id` (real: `address_id`), `profiles.is_admin` (real: `role`), `payment_transactions.raw_payload` (real: `raw_data`). | `supabase/migrations/001…009` |
| M4 | **Polling caro no admin.** `AdminSalesNotifier` chama `/api/admin/orders` a cada 10s, e essa rota faz `select *` de **todos** os pedidos com joins. Com 1.000 pedidos e o painel aberto 8h/dia isso é ~2.900 requisições/dia puxando a base inteira. | `AdminSalesNotifier.tsx:82` + `api/admin/orders/route.ts:12` |
| M5 | **O admin não mostra estoque na lista de produtos.** Só dentro do formulário de edição. | `ProdutosAdminClient.tsx` |
| M6 | **Número de WhatsApp da loja hardcoded** em pelo menos 3 arquivos (`5563991312913`). | `WhatsAppButton.tsx:4`, `ProductActions.tsx:46`, `Footer.tsx` |

### ⚪ BAIXO
- Arquivos de lixo versionados na raiz: `push.bat`, `push.cmd`, `push-now.ps1`, `do_push.py`, `push-changes.py`, `push-fix.py`, `push_optimizations.py`, `final-push.sh`, `commit-bundle-fix.ps1`, `build_log.txt`, `build_output.log`, `build_output.txt`, `full_build_log.txt`, `push_result.txt`.
- `README.md` ainda é o template padrão do `create-next-app`.
- Nenhum segredo commitado — `.gitignore` cobre `.env*` corretamente. ✅

---

## 3. Funcionalidade 1 — Baixa automática de estoque

### Decisão de arquitetura: quando dar baixa?

| Momento | Prós | Contras |
|---|---|---|
| Na criação do pedido (reserva) | Nunca vende duplicado | PIX abandonado trava estoque; precisa de rotina de expiração |
| **No pagamento aprovado** ✅ recomendado | Estoque = realidade financeira; sem fantasmas | Janela curta de risco entre 2 clientes simultâneos |

**Recomendação:** baixa **no pagamento aprovado**, + **checagem de disponibilidade na criação do pedido**
(bloqueia o caso comum de comprar item esgotado) + `GREATEST(stock - qty, 0)` para nunca negativar.

### 3.1 Banco — migration `010_stock_movements_and_order_fulfillment.sql`

```sql
-- Idempotência: garante que a baixa só acontece 1x por pedido
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_applied      BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at            TIMESTAMPTZ;

-- Histórico auditável de movimentação (o "extrato" do estoque)
CREATE TABLE IF NOT EXISTS stock_movements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  delta       INT NOT NULL,               -- negativo = venda, positivo = estorno/entrada
  reason      TEXT NOT NULL,              -- 'sale' | 'cancel_restock' | 'manual_adjust'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Baixa atômica e idempotente (SECURITY DEFINER, chamada via service_role)
CREATE OR REPLACE FUNCTION apply_order_stock(p_order_id UUID) RETURNS JSONB …
-- Estorno para pedidos cancelados/reembolsados
CREATE OR REPLACE FUNCTION restore_order_stock(p_order_id UUID) RETURNS JSONB …
```

A função trava a linha do pedido (`SELECT … FOR UPDATE`), sai fora se `stock_applied = true`,
percorre os `order_items`, faz `UPDATE product_variants SET stock = GREATEST(stock - qty, 0)`,
grava cada movimento em `stock_movements` e marca `stock_applied = true`. Tudo numa transação.

### 3.2 Código

1. **`src/lib/orders/fulfill.ts` (novo)** — função única `fulfillPaidOrder(orderId, paymentId)`:
   marca o pedido como pago **de forma condicional** (`.eq('status', 'pending')` / `'awaiting_payment'`
   — se não voltar linha, outro processo já cuidou e a função retorna), chama `apply_order_stock`,
   dispara os e-mails e a notificação de WhatsApp. **Elimina as ~200 linhas duplicadas** (problema A4).
2. **`webhook/route.ts` e `order-status/route.ts`** passam a chamar só `fulfillPaidOrder`.
3. **`api/admin/orders/[id]/route.ts`** — ao mudar o status para `cancelled`/`refunded`,
   chama `restore_order_stock` (devolve o estoque automaticamente).
4. **`api/checkout/preference/route.ts`** — antes de criar o pedido, busca as variantes no banco e
   valida `stock >= quantity`; se faltar, devolve 409 com a lista de itens indisponíveis
   (e o front mostra a mensagem). **No mesmo passo recalcula preço, frete e cupom pelo banco — resolve o C1.**
5. **`api/admin/products/[id]/route.ts`** — trocar o `delete + insert` de variantes por **upsert por `id`**
   (atualiza as existentes, insere as novas, desativa as removidas com `is_active = false` em vez de deletar).
   Resolve o C2 e preserva o estoque nas edições.

### 3.3 Painel administrativo (o que você vai ver)

- **Lista de produtos:** nova coluna **Estoque** (soma das variantes) com badge colorido —
  🔴 esgotado · 🟡 ≤ 5 unidades · 🟢 ok.
- **Dashboard:** card **"Estoque baixo"** listando as variantes com ≤ 5 unidades, com link direto.
- **Detalhe do pedido:** cada item mostra "baixa dada ✓" e o estoque restante daquela variante.
- **Produto:** aba/histórico de movimentação (últimas entradas e saídas via `stock_movements`).

---

## 4. Funcionalidade 2 — Notificação de venda no WhatsApp da loja

### 4.1 Pré-requisito: salvar o tipo de entrega

Migration:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method       TEXT;  -- store_pickup | local_delivery | correios_pac | correios_sedex
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label        TEXT;  -- "Retirar na Loja"
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_notified_at  TIMESTAMPTZ;
```
`CheckoutFlow` passa a enviar `shipping.carrier`; `preference` grava `shipping_method` + `shipping_label`
(e o `user_id` do cliente logado — resolve o A2 de quebra). O admin passa a exibir um badge
**RETIRADA NA LOJA** / **ENTREGA PALMAS** / **CORREIOS** na lista e no detalhe do pedido.

### 4.2 Mensagem que a loja vai receber

```
🔥 NOVA VENDA CONFIRMADA — #A1B2C3D4

💰 Total: R$ 459,90  (PIX · aprovado)

👤 CLIENTE
Rafael Souza
📱 (63) 99131-2913
✉️ rafael@email.com

📦 ENTREGA: RETIRADA NA LOJA
   (ou) ENTREGA PALMAS-TO — R$ 15,00
        Rua das Flores, 123 - Apto 202
        Plano Diretor Sul — Palmas/TO — CEP 77000-000
   (ou) CORREIOS PAC — R$ 25,90 · prazo 7 dias úteis
        <endereço completo>

🛒 ITENS
• Camiseta Oversized UKDRIP — Tam M · Preto — 2un — R$ 299,80
• Boné Trapstar — Único — 1un — R$ 145,00

📉 Estoque atualizado automaticamente.
🔗 https://www.colacomigoshop.com.br/admin/pedidos/<id>
```

### 4.3 Como o disparo funciona

- Novo `src/lib/whatsapp.ts` com uma função única `sendStoreSaleNotification(order)` e um
  **adaptador de provedor** escolhido por variável de ambiente (`WHATSAPP_PROVIDER`).
  Trocar de provedor depois = trocar 1 variável, sem mexer no resto do código.
- Chamada dentro de `fulfillPaidOrder`, **depois** da baixa de estoque, protegida por `try/catch`:
  se o WhatsApp falhar, o pedido e o e-mail continuam normais (a venda nunca quebra por causa da notificação).
- `whatsapp_notified_at` evita mensagem duplicada; 1 retry automático em caso de falha de rede.
- Número de destino **configurável no painel** (`/admin/configuracoes`), não hardcoded,
  com botão **"Enviar mensagem de teste"**.
- Fallback: se o envio falhar 2x, o e-mail de nova venda sai com um aviso no topo.

### 4.4 Escolha do provedor (⚠️ preciso da sua decisão)

| Opção | Custo | Setup | Risco |
|---|---|---|---|
| **A. Meta WhatsApp Cloud API** (oficial) ✅ *recomendado* | Grátis até ~1.000 conversas/mês | Meta Business + **número dedicado** (não pode ser o mesmo que está no celular) + aprovação de 1 template | Nenhum — é oficial. Exige template aprovado para mensagem iniciada pela empresa |
| **B. Z-API / UltraMsg** (não oficial) | ~R$ 99–150/mês | Escaneia QR Code com o **número atual da loja**, 10 min | Mensagem livre, sem template. Risco (baixo mas real) de bloqueio do número pelo WhatsApp |
| **C. Evolution API** (open source) | Grátis, mas exige VPS (~R$ 30/mês) | Precisa de servidor próprio — **não roda no Cloudflare Workers** | Mesmo risco do B + manutenção do servidor |
| **D. Twilio WhatsApp** | ~US$ 0,005/msg + número | Conta Twilio, cobrança em dólar | Oficial, porém mais caro e também usa template |
| **E. Telegram** (complemento) | Grátis | 5 min, sem burocracia | Não é WhatsApp — serve como canal extra/backup instantâneo |

**Minha recomendação:** **A (Meta Cloud API)** — é oficial, gratuita no volume da loja, roda direto do
Cloudflare Workers via `fetch` e não corre risco de banimento. O único ponto chato é precisar de um
número dedicado para a API. **Se você quiser receber no mesmo número que já usa no celular**, aí a
opção é a **B (Z-API)**, aceitando o custo mensal e o risco.

O código será escrito com adaptador para **A e B**, então dá para começar por um e trocar depois.

---

## 5. Ordem de execução proposta

| Fase | O que entra | Estimativa |
|---|---|---|
| **0. Base** | Migration 010 (colunas + `stock_movements` + RPCs), regenerar `database.types.ts`, sincronizar as migrations com o banco real (M3), limpar arquivos de lixo | ~0,5 dia |
| **1. Estoque** 🎯 | `fulfill.ts` unificado, `apply_order_stock`/`restore_order_stock`, upsert de variantes (C2), validação de estoque no checkout, colunas e badges de estoque no painel | ~1 dia |
| **2. WhatsApp** 🎯 | `shipping_method` no pedido, `lib/whatsapp.ts` + adaptador, template da mensagem, config do número no painel, botão de teste | ~1 dia |
| **3. Segurança do checkout** | Recalcular preço/frete/cupom no servidor (C1), validar assinatura do webhook (C4) | ~0,5 dia |
| **4. Correções restantes** | Frete Correios (A1), `user_id` no pedido (A2), cupom (A3), e-mail `[object Promise]` (A5), polling do admin (M4) | ~0,5 dia |
| **5. Testes + deploy** | Compra de teste ponta a ponta (PIX e cartão), conferência da baixa, mensagem no WhatsApp, deploy no Cloudflare | ~0,5 dia |

As fases **1 e 2** são as que você pediu. As fases **3 e 4** eu recomendo fortemente —
principalmente a **C1 (preço controlado pelo cliente)**, que é risco de prejuízo direto e existe hoje,
agora, em produção. Mas quem decide o escopo é você: dá para entregar 1 e 2 isoladas.

## 6. Como vamos testar sem bagunçar a loja

1. Produto de teste, oculto (`is_active = false` depois), com estoque conhecido (ex.: 3 unidades).
2. Cupom de 99% para pagar centavos, ou credenciais de **sandbox** do Mercado Pago.
3. Compra via PIX → conferir: status `paid`, estoque 3 → 2, linha em `stock_movements`,
   e-mail recebido, mensagem no WhatsApp com o tipo de entrega correto.
4. Repetir com "Retirada na loja" e com "Correios" para validar as 3 variações da mensagem.
5. Cancelar o pedido no painel → conferir estoque voltando para 3.
6. Simular webhook duplicado (chamar 2x) → conferir que a baixa **não** acontece de novo.

---

## 7. O que eu preciso de você para começar

1. **Provedor de WhatsApp** (seção 4.4) — A, B ou outro.
2. **Número que vai receber** as notificações (pode ser o mesmo do site, `(63) 99131-2913`?).
3. **Escopo**: só as fases 1 e 2, ou incluo as correções críticas (fases 3 e 4)?
4. **Acesso ao Supabase** para rodar a migration 010 — ou eu entrego o SQL pronto e você
   roda no SQL Editor do painel do Supabase (mais simples e seguro).
