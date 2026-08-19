# Baixa de Estoque + Aviso de Venda no WhatsApp

Guia prático do que foi implementado, como ligar e como testar.

> ⚠️ **Ordem obrigatória:** rode a migration no Supabase **antes** de publicar o deploy.
> O código novo usa colunas e funções que só existem depois dela.

---

## 1. Rodar a migration (1x, ~30 segundos)

1. Abra o Supabase → **SQL Editor** → **New query**
2. Cole o conteúdo inteiro de `supabase/migrations/010_stock_control_and_whatsapp.sql`
3. **Run**

O script é seguro para rodar mais de uma vez (`IF NOT EXISTS` / `OR REPLACE`) e já faz o
*backfill*: todos os pedidos que já estavam pagos são marcados como "estoque já tratado"
e "já notificado", então o sistema **não** vai dar baixa retroativa nem disparar WhatsApp
de venda antiga.

O que ele cria:

| Item | Para quê |
|---|---|
| `orders.stock_applied`, `paid_at`, `payment_method` | Controle da baixa e da confirmação |
| `orders.shipping_method`, `shipping_label` | Tipo de entrega (retirada / local / Correios) |
| `orders.whatsapp_notified_at`, `emails_sent_at` | Impede notificação duplicada |
| `orders.coupon_id`, `coupon_code` | Rastreia qual cupom foi usado |
| `store_settings.whatsapp_notify_enabled/_number` | Configuração pelo painel |
| Tabela `stock_movements` | Extrato de entradas e saídas de cada variante |
| `apply_order_stock()` / `restore_order_stock()` | Baixa e estorno atômicos |
| `increment_coupon_uses()` | Contador de uso do cupom |

---

## 2. Ligar o WhatsApp (2 minutos, grátis)

O provedor padrão é o **CallMeBot**: uma API gratuita que só consegue mandar mensagem para
o número que autorizou — que é exatamente o nosso caso (a loja avisando a si mesma).

### Passo a passo

1. No celular que vai **receber** os avisos, salve nos contatos o número do bot:
   **+34 623 80 11 90**
2. Mande para esse contato, pelo WhatsApp, exatamente a mensagem:
   `I allow callmebot to send me messages`
3. Em poucos segundos o bot responde com a sua **APIKEY**
4. No Cloudflare → Workers & Pages → projeto `colacomigo` → **Settings → Variables and Secrets**,
   adicione:

```
CALLMEBOT_APIKEY = <a apikey que o bot mandou>
```

5. Publique o deploy e, no painel, vá em **Configurações → Aviso de Venda no WhatsApp**,
   confira o número e clique em **Enviar teste**.

### Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `CALLMEBOT_APIKEY` | sim (no provedor padrão) | Chave recebida do bot |
| `WHATSAPP_PROVIDER` | não | Força o provedor: `callmebot` \| `zapi` \| `meta` \| `none`. Sem ela, o sistema deduz pelas credenciais presentes |
| `STORE_WHATSAPP_NUMBER` | não | Número padrão, caso não esteja configurado no painel |
| `MP_WEBHOOK_SECRET` | recomendada | Chave secreta do webhook no Mercado Pago — ativa a validação de assinatura |

**Limitações honestas do CallMeBot:** é um serviço gratuito de terceiros, sem SLA e com
limite de frequência de envio. Para o volume de uma loja isso é suficiente, mas se um dia o
serviço sair do ar ou o volume crescer, dá para trocar de provedor **sem mexer no código** —
basta preencher as variáveis do Z-API (`ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`)
ou da Meta (`META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_ID`, `META_WHATSAPP_TEMPLATE`).
Os dois adaptadores já estão prontos em `src/lib/whatsapp.ts`.

Se nenhuma credencial estiver configurada, o sistema **não quebra**: apenas registra a
mensagem no log do Cloudflare e segue com o e-mail normalmente.

---

## 3. Como funciona na prática

```
Pagamento aprovado (webhook do Mercado Pago  OU  polling do checkout)
   ↓
src/lib/orders/fulfill.ts → fulfillPaidOrder()
   ├── 1. marca o pedido como pago
   ├── 2. apply_order_stock()  → baixa no estoque + linha no extrato
   ├── 3. increment_coupon_uses() (se houve cupom)
   ├── 4. e-mail para o cliente + e-mail para a loja
   └── 5. mensagem no WhatsApp da loja
```

Cada etapa é **idempotente**: se o webhook e o polling caírem juntos, a segunda execução
não repete nada. A baixa é travada no banco (`SELECT … FOR UPDATE` + `stock_applied`) e as
notificações usam reserva antes do envio (`emails_sent_at` / `whatsapp_notified_at`).

**Cancelou um pedido no painel?** O estoque volta sozinho (`restore_order_stock`).
Reabriu o pedido? A baixa é reaplicada.

### A mensagem que chega

```
🔥 NOVA VENDA CONFIRMADA
Pedido *#A1B2C3D4*

💰 Total: *R$ 459,90*  (PIX)

👤 CLIENTE
Rafael Souza
📱 (63) 99131-2913
✉️ rafael@email.com

*ENTREGA:* 🏪 RETIRADA NA LOJA
O cliente vai retirar na loja. Combinar horário.

🛒 ITENS
• Camiseta Oversized UKDRIP (Tam M · Preto) — 2un — R$ 299,80
• Boné Trapstar — 1un — R$ 145,00

📉 Estoque já atualizado automaticamente.
🔗 https://www.colacomigoshop.com.br/admin/pedidos/<id>
```

Quando a entrega é local ou Correios, o bloco de entrega traz o **endereço completo** e o
valor do frete no lugar do aviso de retirada.

---

## 4. Onde ver no painel

- **Produtos** → nova coluna **Estoque** (🔴 esgotado · 🟡 até 5 un. · 🟢 ok)
- **Dashboard** → card **Estoque Baixo** com as variantes acabando, clicáveis
- **Pedidos** → coluna **Entrega** com o tipo de cada venda
- **Detalhe do pedido** → bloco de entrega mostra retirada (sem endereço) ou o endereço de envio
- **Sino de novas vendas** → agora mostra também o tipo de entrega
- **Configurações** → seção do WhatsApp com liga/desliga, número e botão de teste

---

## 5. Roteiro de teste (antes de confiar em produção)

1. Cadastre um produto de teste com **estoque 3** numa variante.
2. Aplique um cupom de 99% (ou use credenciais de sandbox do Mercado Pago) para pagar centavos.
3. Compre **1 unidade** escolhendo **Retirada na loja**.
4. Confira:
   - [ ] Pedido com status `paid`
   - [ ] Estoque caiu de 3 → 2 na lista de produtos
   - [ ] Linha nova em `stock_movements` (SQL Editor: `select * from stock_movements order by created_at desc limit 5;`)
   - [ ] E-mail recebido
   - [ ] **WhatsApp recebido** com "RETIRADA NA LOJA"
5. Repita escolhendo **Entrega local** e confira que a mensagem traz o endereço completo.
6. **Cancele** o pedido no painel → o estoque deve voltar para 3.
7. Tente comprar 5 unidades de um item com 2 em estoque → o checkout deve bloquear
   com "Estoque insuficiente".

---

## 6. Checklist de deploy

- [ ] Migration `010` executada no Supabase
- [ ] `CALLMEBOT_APIKEY` configurada no Cloudflare
- [ ] `MP_WEBHOOK_SECRET` configurada (opcional, mas recomendada)
- [ ] `npm run deploy` (ou o pipeline de sempre)
- [ ] Botão **Enviar teste** no painel funcionando
- [ ] Uma compra de teste ponta a ponta
