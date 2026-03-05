# Plano de Implementação: Resend & Deploy Oficial

## 📋 Resumo da Tarefa
- **Objetivo:** Configurar o sistema de e-mails transacionais (Resend) e realizar o deploy oficial da Cola Comigo Shop na Vercel com domínio customizado via Cloudflare.
- **Data Prevista:** Amanhã (Próxima etapa).
- **Agentes Envolvidos:** `@[project-planner]`, `@[orchestrator]`, `@[backend-specialist]`.

## 🛠️ Requisitos Prévios
- [x] Chave de API do Resend (Criação de conta em [resend.com](https://resend.com)).
- [x] Credenciais do Mercado Pago (Access Token e Public Key).
- [x] Acesso ao repositório GitHub da Cola Comigo Shop.
- [ ] Acesso à conta Vercel do cliente.
- [ ] Acesso ao painel da Cloudflare (Configuração DNS).

## 🗺️ Plano de Implementação

### Fase 1: Configuração do Resend (E-mails)
- [x] Instalar a biblioteca do Resend: `npm install resend`
- [x] Configurar variáveis de ambiente na Vercel/Local: `RESEND_API_KEY`
- [ ] Criar templates de e-mail (React Email ou HTML) para:
    - [ ] Confirmação de Pedido.
    - [ ] Envio de Código de Rastreio.
- [ ] Implementar a rota de API ou Edge Function para disparar os e-mails após a confirmação do pedido no checkout/webhook.
- [ ] Testar disparos em ambiente de staging.

### Fase 2: Deploy Oficial & DNS
- [ ] **GitHub + Vercel:**
    - [ ] Conectar o repositório à Vercel.
    - [ ] Configurar todas as variáveis de ambiente necessárias (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `RESEND_API_KEY`, etc.).
    - [ ] Validar o build de produção (`npm run build`).
- [ ] **Cloudflare + DNS:**
    - [ ] Adicionar o domínio oficial na Vercel (ex: `colacomigoshop.com.br`).
    - [ ] Configurar os registros CNAME e A no Cloudflare apontando para a Vercel.
    - [ ] Garantir que o SSL está configurado como "Full" no Cloudflare.
    - [ ] Testar propagação de DNS.

## 🚦 Critérios de Verificação
1. O site deve carregar corretamente no domínio oficial com HTTPS ativo.
2. Ao realizar uma compra teste, o e-mail de confirmação deve chegar no inbox do cliente via Resend.
3. O painel da Vercel não deve apresentar erros de build ou variáveis de ambiente faltando.

## 📝 Notas de Amanhã
- Validar se o domínio já está sob gestão do Cloudflare.
- Checar se o cliente já possui as credenciais do Resend em mãos.
