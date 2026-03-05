# Cola Comigo Shop - Full Audit & Storefront Fix Plan

## 🎯 Objetivo
Finalizar a orquestração do site principal (storefront), garantindo que as páginas dinâmicas (coleções, categorias, marcas) funcionem via Banco de Dados (sem erros 404) e realizando auditorias de Frontend, Backend, Segurança e SEO.

---

## 🛠️ Fase 2: Implementação (Agentes Paralelos)

### 1. 🎨 Engenharia Frontend & Integração de Banco (`frontend-specialist`)
As rotas dinâmicas do site estão falhando (404) porque dependem de mapas fixos no código (`COLECOES_MAP`, `CATEGORIAS_MAP`), ignorando os cadastros que você faz no painel. O objetivo é conectar tudo na nuvem.

*   **Coleções (`/colecoes/[slug]`):** Remover o `COLECOES_MAP` hardcoded. Buscar a coleção ativa do Supabase. Se o slug existir, mostrar os produtos. Caso contrário, `notFound()`.
*   **Categorias (`/categorias/[slug]`):** Remover o `CATEGORIAS_MAP`. Buscar categoria ativa no Supabase via slug. Listar produtos que pertençam ao `category_id` dessa categoria.
*   **Marcas (`/marcas/[slug]`):** Validar a mesma estrutura dinâmica, substituindo qualquer mapeamento pre-programado por consulta ao banco (`brands`).
*   **Menu Global (`Header.tsx`):** Garantir que os links do menu apontem para as categorias estruturadas e evitar links soltos que dão 404.
*   **Página "Todos os Produtos" (`/produtos`):** Identificar e corrigir a falha técnica que está ocultando o produto fictício criado (ajustar a query do Supabase para o mapeamento correto de variants e images).

### 2. 🛡 Auditoria de Segurança e Backend (`backend-specialist` & `security-auditor`)
*   **Inspeção RLS (Row Level Security):** Confirmar se tabelas como `categories`, `brands`, e `collections` permitem leitura pública.
*   **Scripts de Segurança:** Executar o script nativo da plataforma `.agent/skills/vulnerability-scanner/scripts/security_scan.py` para caçar chaves expostas ou fraquezas.
*   **Revisão de Middlewares e Cookies:** Garantir que buscas no Storefront sejam feitas via acesso deslogado (`createClient` padrão) de forma rápida e eficiente.

### 3. 📈 Auditoria de SEO e UX (`seo-specialist` & `performance-optimizer`)
*   **Metadata Dinâmica:** Nas rotas `/[slug]`, a Tag `<title>` atualizava via dicionário estático. Agora precisaremos que a função `generateMetadata` realize uma extra-fetch do Supabase para gerar o título customizado ("Sua Coleção | Cola Comigo").
*   **Teste de Integridade:** Passar os scripts `.agent/skills/seo-fundamentals/scripts/seo_checker.py` para garantir tags canônicas e marcação schema se necessário.

---

## 🚦 Critérios de Sucesso
- Acessar `/colecoes/qualquer-nome` e ver produtos atrelados, ou tela vazia amigável, sem erro de compilação 404 desde que ela exista no Painel.
- O Produto "Camiseta Oversized Fictícia" aparecer listado na aba "SHOP ALL / PRODUTOS".
- Relatório de scripts de Validação retornando OK.
