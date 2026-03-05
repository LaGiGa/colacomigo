# Plano de Ação: Autoridade, Isolamento e E-mails (Trust & Infra)

## Fase 1: Depoimentos Dinâmicos (Opção B)
1. **Banco de Dados (Supabase):** Criar tabela `testimonials` (id, author, city, text, rating, image_url, is_active, created_at) com RLS aberta para leitura.
2. **Admin:** Criar página `/admin/depoimentos` para gerenciar (adicionar, remover, editar) as provas sociais.
3. **Vitrine:** Desenvolver um componente premium de Carrossel Glassmorphism para exibir os depoimentos ativos. Inserir logo abaixo das coleções na tela inicial.

## Fase 2: Isolamento de Acesso ao Admin
1. **Middlewares/Proteção:** Adaptar a autenticação para que a rota `/admin/*` exija não apenas estar logado, mas ter um privilégio (ex: email do dono) ou usar o painel próprio do Supabase para bloquear acesso de clientes.
2. **Login Dedicado:** Criar uma página `/admin/login` separada, focada em segurança, com visual diferente do site para reforçar a barreira.

## Fase 3: E-mails Transacionais com Resend
1. **Configuração:** Instalar pacote `resend` e preparar chaves de API.
2. **E-mail de Atualização de Rastreio:** 
   - Modificar a tela `/admin/pedidos/[id]` para permitir colar o Código de Rastreio (Correios).
   - Ao salvar, disparar chamada de API que envia e-mail HTML bonito para o cliente avisando da postagem.
3. **E-mail de Confirmação de Compra:** Preparar template de e-mail ao criar pedido.

## Fase 4: Deploy (Vercel Host + Cloudflare DNS)
1. Conectar o projeto ao GitHub.
2. Mandar o GitHub para a Vercel (100% automático, sem bugs de imagem do Next.js).
3. Entrar no painel do Cloudflare (onde seu domínio já está) e simplesmente criar um "Apontamento de DNS" (tipo CNAME) apontando para a Vercel. Demora 2 minutos e traz o melhor dos dois mundos.
