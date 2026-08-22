# Comparativo de telas — "PLENA COSEMS" (fora do padrão) × plenaintelligence.ai (referência)

Auditoria visual das capturas enviadas em 22/08/2026.

- **Tela A (divergente):** `PLENA COSEMS` — gerada em outro chat.
- **Telas B–E (referência):** `plenaintelligence.ai/inicio`, `/escolha-municipio`,
  `/emendas-parlamentares`, `/comercial/fiscal`.

Severidade: 🔴 quebra de marca · 🟠 quebra de padrão · 🟡 ajuste fino.

---

## 1. Marca e identidade

| # | Item | Tela A (errada) | Referência | Sev. |
|---|---|---|---|---|
| 1.1 | Logotipo | Quadrado azul com a letra **"P"** + texto "PLENA / COSEMS · TO" | Logotipo oficial Plena Intelligence (cérebro + wordmark), `LOGO-1`/`LOGO-4` conforme tema | 🔴 |
| 1.2 | Nome do produto | "PLENA COSEMS" | "PLENA INTELLIGENCE"; o cliente aparece no seletor de município | 🔴 |
| 1.3 | Tipografia | Sans genérica (Inter/system-ui) | Montserrat (títulos) + Roboto (corpo) | 🔴 |
| 1.4 | Eyebrow do hero | `PLATAFORMA PLENA · COSEMS TOCANTINS` | `PLATAFORMA PLENA` | 🟠 |

## 2. Nomenclatura dos módulos

| # | Tela A | Referência | Sev. |
|---|---|---|---|
| 2.1 | Financeiro | **Plena Finanças** (`PRODUTO · GESTÃO FINANCEIRA`) | 🔴 |
| 2.2 | Projetos | **Plena Projetos** (`PRODUTO · CAPTAÇÃO`) | 🔴 |
| 2.3 | IA COSEMS | **Plena Agentes I.A.** (`PRODUTOS · PLENA NEXUS`) | 🔴 |
| 2.4 | Apoio Técnico / Operacional | não existem como módulos no catálogo | 🟠 |
| 2.5 | Governança | **Governança e Plataforma** (`PLATAFORMA`) | 🟡 |
| 2.6 | Ausentes | **Plena Gestor SUS**, **Plena Emendas**, **Plena Legis SUS**, **Plena Comercial** | 🔴 |

> O nome do cliente (COSEMS, prefeitura, município) **nunca** entra no nome do produto.

## 3. Sistema de temas

| # | Item | Tela A | Referência | Sev. |
|---|---|---|---|---|
| 3.1 | Quantidade | 6 bolinhas | **8** bolinhas | 🟠 |
| 3.2 | Cores | navy, ciano, laranja, oliva, quase-preto, cinza-azulado | ciano, esmeralda, azul, coral, lima, noturno, âmbar, violeta | 🟠 |
| 3.3 | Claro/escuro | pílula **"🌙 Tema Escuro"** flutuando no rodapé da página | toggle no header, ao lado das bolinhas | 🟠 |
| 3.4 | Eixos | tema e luminosidade misturados | dois eixos independentes (`data-theme` × `.dark`) | 🟠 |

## 4. Sidebar

| # | Item | Tela A | Referência | Sev. |
|---|---|---|---|---|
| 4.1 | Bloco de marca | avatar "P" + texto | bloco do logotipo (120px / 72px recolhido) | 🔴 |
| 4.2 | Item de menu | avatar com **inicial da palavra** (D, F, P, O, A, I, G) | **ícone Lucide** em tile translúcido | 🟠 |
| 4.3 | Kicker | `PRODUTO · CAPTAÇ...` truncado com reticências | kicker completo, quebrando em 2 linhas quando preciso | 🟡 |
| 4.4 | Submenus | inexistentes — todos os itens são folhas | accordion inline de até 3 níveis, com `você está aqui` no item corrente | 🟠 |
| 4.5 | Botão recolher | ausente | círculo de 24px na borda direita, `top: 88px` | 🟠 |
| 4.6 | CTA de rodapé | `🏛️ Habilitar Município Real` (emoji + texto divergente) | `Habilitar Meu Município Real`, ícone Lucide, gradiente violeta | 🟠 |
| 4.7 | Cores dos módulos | paleta improvisada (verde, azul, roxo genéricos) | gradientes canônicos por módulo (seção 5 do padrão) | 🟠 |

## 5. Header

| # | Item | Tela A | Referência | Sev. |
|---|---|---|---|---|
| 5.1 | Botão `Sair` | **vermelho sólido, grande**, dominando o header | contorno/soft com ícone, texto vermelho | 🟠 |
| 5.2 | Seletor de município | **ausente** | `Selecionar município` ou brasão + `⇅ Trocar município` | 🔴 |
| 5.3 | Hamburger | ausente | presente, à esquerda | 🟡 |
| 5.4 | Tela cheia | ausente | ícone `⛶` antes do sino | 🟡 |
| 5.5 | Chip de usuário | sem ponto de presença e sem chevron | ponto verde + chevron para o menu | 🟡 |
| 5.6 | Perfil | `ADMINISTRADOR DO SISTEMA` em caixa alta forte | `Administrador do Sistema`, `10px`, discreto | 🟡 |

## 6. Conteúdo e cards

| # | Item | Tela A | Referência | Sev. |
|---|---|---|---|---|
| 6.1 | Grade de módulos | **1 coluna** ocupando ~50% da largura | **3 colunas** (`lg:grid-cols-3`) | 🔴 |
| 6.2 | Título do card | no corpo branco, abaixo da faixa | **sobre a faixa em gradiente**, em branco | 🟠 |
| 6.3 | Ícone do card | emoji 💰 📋 | ícone Lucide em tile translúcido | 🔴 |
| 6.4 | Altura da faixa | ~110px, desproporcional | ~96px | 🟡 |
| 6.5 | Link de entrada | só `Entrar →` | `Entrar →` ou `Entrar e escolher o município →` conforme o módulo | 🟡 |
| 6.6 | Breadcrumb | `Início` solto, sem hierarquia | `Módulo › Página` | 🟠 |
| 6.7 | Seção "não contratadas" | ausente | `AINDA NÃO CONTRATADAS` + cards `EM BREVE` | 🟠 |
| 6.8 | Largura do conteúdo | texto centralizado estreito, muito espaço vazio à direita | `max-width: 1400px` centralizado e preenchido | 🟠 |

## 7. Elementos indevidos / faltantes

| # | Item | Situação | Sev. |
|---|---|---|---|
| 7.1 | **Barra inferior com abas** (`Dashboard / Financeiro / Projetos / Operacional / IA COSEMS`) | **Não existe no padrão Plena.** Duplica a sidebar. Remover. | 🔴 |
| 7.2 | Pílula `🌙 Tema Escuro` no rodapé | Não existe. Mover para o header. | 🟠 |
| 7.3 | **FAB "Plena I.A."** (canto inferior direito) | **Ausente na Tela A.** Obrigatório em toda tela autenticada. | 🟠 |
| 7.4 | Faixa de KPIs | Ausente (a referência usa em `/emendas-parlamentares` e `/comercial/fiscal`) | 🟡 |
| 7.5 | Banners de alerta | Ausentes | 🟡 |

---

## Diagnóstico

A Tela A não é "uma variação" do padrão: ela foi construída **sem acesso à identidade
Plena**. Os desvios se concentram exatamente onde um modelo sem contexto improvisa —
logotipo, fonte, paleta, nomes de módulo e navegação.

**Causa provável:** o chat que gerou a Tela A trabalhava em um repositório sem
`CLAUDE.md`, sem `plena-tokens.css` e sem `PLENA-UI-STANDARD.md`. Cada sessão de IA
começa do zero e enxerga **apenas** o repositório ao qual está conectada — não há memória
compartilhada entre chats. Sem esses arquivos no repositório, o modelo inventa um design
plausível, e o resultado é a Tela A.

**Correção:** aplicar o pacote `design-system/` + `CLAUDE.md` em todo repositório Plena,
conforme o `README.md` desta pasta.

---

## Plano de correção da Tela A (ordem sugerida)

1. Instalar `plena-tokens.css` + preset Tailwind; remover todo hex solto.
2. Trocar as fontes para Montserrat/Roboto via `next/font`.
3. Colocar o logotipo Plena na sidebar (com troca por tema).
4. Renomear os módulos para os nomes canônicos e aplicar os gradientes corretos.
5. Substituir todos os emojis e avatares-de-inicial por ícones Lucide.
6. Expandir o seletor de temas para 8 e mover o toggle claro/escuro para o header.
7. **Remover a barra de navegação inferior.**
8. Adicionar o seletor de município no header.
9. Passar a grade de módulos para 3 colunas e mover o título para dentro da faixa.
10. Adicionar breadcrumb, submenus inline na sidebar e o FAB Plena I.A.
11. Rodar o Checklist de Entrega (seção 14 do padrão).
