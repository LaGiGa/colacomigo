# PLENA-UI-STANDARD — Padrão de Frontend da Plataforma Plena

> **Status:** norma obrigatória.
> **Escopo:** todo produto, módulo, tela ou protótipo da Plena Intelligence — em qualquer
> repositório, em qualquer ferramenta de IA (Claude Code, Cursor, Copilot, v0, Lovable…).
> **Regra de ouro:** se este documento e o pedido do chat divergirem, **este documento vence**.
> Só uma instrução explícita do usuário dizendo "ignore o padrão nesta tela" pode sobrepô-lo.

---

## 0. Como usar este documento

1. Copie a pasta `design-system/` (este `.md` + `plena-tokens.css` + `tailwind-plena-preset.js`)
   para a **raiz de todo repositório Plena**.
2. Copie o `CLAUDE.md.template` para a raiz do repositório como `CLAUDE.md`.
3. Em ferramentas sem leitura de repositório, cole o `PROMPT-INICIAL.md` na **primeira**
   mensagem do chat.
4. Antes de entregar qualquer tela, rode o **Checklist de Entrega** (seção 14).

**Ordem de precedência quando houver conflito:**

```
1. Instrução explícita do usuário no chat  (mais forte)
2. PLENA-UI-STANDARD.md  (este arquivo)
3. IDENTIDADE_VISUAL_PLENA.md  (brandbook)
4. Código existente do repositório
5. Bom senso do modelo  (mais fraco)
```

> ⚠️ **Documentos revogados.** `design-system/plena-intelligence/MASTER.md` (gerado
> automaticamente, com Fira Code / `#22C55E` / "Dark Mode OLED") **não é a identidade Plena**
> e está revogado. Se existir no repositório, ignore-o e apague-o. Ele é uma das causas
> conhecidas de telas saírem fora do padrão.

---

## 1. Identidade da marca (imutável)

Fonte: `IDENTIDADE_VISUAL_PLENA.md` (Brandbook oficial).

| Cor | Hex | Token | Aplicação |
|---|---|---|---|
| Azul Noturno | `#041E42` | `--plena-azul` / `plena-azul` | Fundos escuros, títulos, autoridade |
| Verde Água | `#00C19F` | `--plena-verde` / `plena-verde` | Acentos, ícones, estado ativo |
| Cinza Neutro | `#D8D8D5` | `--plena-cinza` / `plena-cinza` | Bordas, texto secundário |
| Gradiente Plena (início) | `#00AFEC` | `--plena-from` / `plena-from` | CTAs, destaques |
| Gradiente Plena (fim) | `#01EFA1` | `--plena-to` / `plena-to` | CTAs, destaques |

**Gradiente Plena:** `linear-gradient(90deg, #00AFEC 0%, #01EFA1 100%)`

### Tipografia

| Papel | Fonte | Uso |
|---|---|---|
| Display | **Montserrat** | H1–H4, labels em caixa alta, kickers, botões, nomes de módulo |
| Corpo | **Roboto** | Parágrafos, tabelas, formulários, textos longos |

Carregue via `next/font/google` expondo `--font-montserrat` e `--font-roboto`.

**Proibido:** Inter, Fira Code/Sans, Geist, Poppins, system-ui como fonte primária.
Elas são o sintoma mais visível de tela fora do padrão.

### Logotipo

- Arquivos oficiais: `public/Plena_Intelligence_LOGO - 1.png` … `- 4.png`
  (`1` = versão clara/light, `4` = versão escura/dark).
- **Toda tela autenticada exibe o logotipo Plena** no topo da sidebar, dentro de um bloco
  próprio de `120px` de altura (`72px` quando recolhida), largura máxima `220px`,
  `object-contain`.
- Troca automática por tema: `resolvedTheme === 'dark' ? LOGO-4 : LOGO-1`.
- **Nunca** substituir o logotipo por: inicial em círculo, emoji, ícone genérico,
  texto puro, ou logo de cliente/COSEMS. O logotipo do cliente (brasão do município)
  aparece **no seletor de município**, nunca no lugar da marca Plena.
- **Nunca** recolorir, distorcer, aplicar sombra ou rotacionar o logotipo.

---

## 2. Sistema de temas (o seletor "TEMAS")

O header exibe o label `TEMAS` seguido de **8 bolinhas** de cor, na ordem fixa abaixo.
A bolinha ativa recebe anel (`ring-2`) e leve aumento de escala.

| # | Nome | `data-theme` | Acento |
|---|---|---|---|
| 1 | Ciano (padrão) | `ciano` | `#00AFEC` |
| 2 | Esmeralda | `esmeralda` | `#00C19F` |
| 3 | Azul | `azul` | `#2563EB` |
| 4 | Coral | `coral` | `#E2603C` |
| 5 | Lima | `lima` | `#4CAF6D` |
| 6 | Noturno | `noturno` | `#1E293B` |
| 7 | Âmbar | `ambar` | `#A8850C` |
| 8 | Violeta | `violeta` | `#7C4DBE` |

### Regras invioláveis do tema

1. Trocar de tema altera **apenas** os tokens `--theme-*`. Nunca `--plena-*`.
2. **Light e dark são ortogonais ao tema.** São dois eixos independentes:
   `data-theme` (acento) × `.dark` (luminosidade). Um seletor não substitui o outro.
3. A preferência é persistida (`localStorage`) e aplicada **antes da primeira pintura**
   (script inline no `<head>`), para não haver flash de tema errado.
4. Cores de **módulo** (seção 5) e cores **semânticas** (seção 3) **não** mudam com o tema.
   Verde é sempre sucesso; vermelho é sempre risco — em todos os 8 temas.
5. O toggle claro/escuro fica no header, junto às bolinhas — **nunca** flutuando no rodapé
   da página.

---

## 3. Cores semânticas (fixas)

| Significado | Fundo (light) | Texto (light) | Sólido |
|---|---|---|---|
| Sucesso / Ativo / Pago | `#DCFCE7` | `#166534` | `#16A34A` |
| Atenção / Diligência | `#FEF3C7` | `#92400E` | `#F59E0B` |
| Risco / Erro / Vermelho | `#FEE2E2` | `#991B1B` | `#EF4444` |
| Informação / Ação | `#DBEAFE` | `#1E40AF` | `#2563EB` |
| Neutro / Rascunho | `#F1F5F9` | `#475569` | `#94A3B8` |

Em dark mode use as variantes translúcidas já definidas em `plena-tokens.css`.
Nunca invente um vermelho ou verde novo — use os tokens.

---

## 4. Anatomia do shell (obrigatória em toda tela autenticada)

Toda página autenticada é renderizada dentro do **mesmo** `<AppShell>`. Nenhuma tela
desenha o próprio header ou a própria sidebar.

```
┌────────────────┬──────────────────────────────────────────────────────────┐
│  LOGO PLENA    │  [☰] [Seletor de município]      TEMAS ●●●●●●●● ⛶ 🔔 Sair [AG ▾] │  ← header 72px
│  (bloco 120px) ├──────────────────────────────────────────────────────────┤
│                │  Módulo › Página                                          │  ← breadcrumb
│  ┌──────────┐  │  ┌──────┐                                                 │
│  │ Módulo A │  │  │ 🏛 │ Título da Página        [Ação ▾] [Ação secundária] │  ← page header
│  ├──────────┤  │  └──────┘ Subtítulo descritivo                            │
│  │ Módulo B │▼ │                                                            │
│  │  ├ Seção │  │  [ KPI ] [ KPI ] [ KPI ] [ KPI ] [ KPI ]                  │  ← faixa de KPIs
│  │  │  └ item│ │                                                            │
│  │  └ Seção │  │  ⚠ Banner de alerta                              Ver → │
│  ├──────────┤  │                                                            │
│  │ Módulo C │  │  Filtrar: (Todos)(A)(B)(C)                                │
│  └──────────┘  │  ┌──────────────────────────────────────────────────────┐ │
│                │  │  TABELA / CONTEÚDO                                    │ │
│  [CTA rodapé]  │  └──────────────────────────────────────────────────────┘ │
└────────────────┴──────────────────────────────────────────────────────┬────┘
                                                             (Plena I.A.) ◉   ← FAB
```

### 4.1 Sidebar

- Largura `288px` expandida / `80px` recolhida. Transição `300ms`.
- Botão de recolher: círculo de `24px` flutuando na borda direita, `top: 88px`.
- **Topo:** bloco do logotipo (seção 1).
- **Corpo:** lista de **módulos de produto**. Cada módulo é um cartão-pílula com:
  - ícone Lucide dentro de um quadrado arredondado translúcido (`rounded-lg`, `bg-white/15`);
  - **duas linhas de texto**: nome do módulo (Montserrat, semibold) e o *kicker* em caixa
    alta, `10px`, `tracking-widest`, opacidade ~70% — ex.: `PRODUTO · SAÚDE`,
    `PRODUTOS · PLENA NEXUS`, `INTERNO · PLENA INTELLIGENCE`, `PLATAFORMA`;
  - chevron à direita (`›` fechado, `⌄` aberto);
  - fundo em **gradiente da cor do módulo** (seção 5), `rounded-xl`.
- **Submenus:** o módulo ativo expande *inline* (accordion), nunca em flyout. Hierarquia
  de até 3 níveis: `Módulo → Seção → Item`. Itens de 2º/3º nível têm fundo neutro, ícone
  pequeno colorido em tile `rounded-md`, e o item corrente exibe o rótulo
  **`você está aqui`** à direita.
- Apenas **um** módulo expandido por vez.
- **Rodapé fixo:** CTA `Habilitar Meu Município Real` em gradiente violeta, largura total,
  sempre visível.
- Item ativo: gradiente `from-plena-from/10 to-transparent`, texto `plena-verde`,
  barra interna à esquerda `inset 2px 0 0 0 #00C19F`.

### 4.2 Header (`72px`, sticky, `backdrop-blur-xl`)

Da esquerda para a direita, nesta ordem:

1. Botão hamburger (recolher sidebar).
2. **Contexto de município** — um dos dois estados:
   - sem município: botão pílula `Selecionar município` (contorno mint/teal);
   - com município: brasão + `Município: <Nome> - UF ⌄` + botão `⇅ Trocar município`.
3. *(espaçador flexível)*
4. Label `TEMAS` + as 8 bolinhas.
5. Ícone de tela cheia (`⛶`).
6. Sino de notificações com badge numérico circular.
7. Botão `Sair` — **contorno/soft com ícone**, texto vermelho. Nunca um botão vermelho
   sólido e grande.
8. Chip de usuário: avatar circular com iniciais + gradiente, nome (semibold) sobre
   perfil em caixa alta `10px`, ponto verde de presença, chevron para o menu.

### 4.3 Conteúdo

- Fundo `--surface-app` (azulado bem claro), conteúdo centralizado, `max-width: 1400px`.
- **Breadcrumb** no topo, sempre: `Módulo › Página` (separador `›`, último item sem link).
- **Cabeçalho de página:** ícone em tile colorido + `H1` (Montserrat, ~30px, bold),
  subtítulo em `--text-muted`, e ações alinhadas à direita na mesma linha.
- Badge de ambiente (`DEMONSTRAÇÃO`, `EM BREVE`, `HOMOLOGAÇÃO`) ao lado do H1 quando aplicável.

### 4.4 FAB Plena I.A.

Botão circular fixo no canto inferior direito (`bottom: 24px; right: 24px`), com o ícone
do cérebro Plena e o rótulo `Plena I.A.` abaixo. Presente em **todas** as telas autenticadas.

---

## 5. Módulos de produto (nomes e cores canônicos)

Os nomes são **fixos** e sempre prefixados por `Plena`. Nunca renomear por cliente
(ex.: "Financeiro" → é `Plena Finanças`; "IA COSEMS" → é `Plena Agentes I.A.`).
O nome do cliente aparece no **contexto de município**, não no nome do produto.

| Módulo | Kicker | Gradiente | Ícone Lucide |
|---|---|---|---|
| Plena Gestor SUS | `PRODUTO · SAÚDE` | `#3B6EA5 → #2C5480` | `Landmark` |
| Plena Emendas | `PRODUTO · RECURSOS` | `#1B9E9E → #14807F` | `Link2` |
| Plena Projetos | `PRODUTO · CAPTAÇÃO` | `#D8552F → #B4401F` | `FolderKanban` |
| Plena Legis SUS | `PRODUTO · LEGISLAÇÃO` | `#C0951A → #96720F` | `Scale` |
| Plena Agentes I.A. | `PRODUTOS · PLENA NEXUS` | `#8B5CF6 → #6D3FD1` | `BrainCircuit` |
| Plena Finanças | `PRODUTO · GESTÃO FINANCEIRA` | `#1F8A55 → #14663D` | `Wallet` |
| Plena Comercial | `INTERNO · PLENA INTELLIGENCE` | `#E2603C → #C24427` | `Briefcase` |
| Governança e Plataforma | `PLATAFORMA` | `#334155 → #1E293B` | `ShieldCheck` |

---

## 6. Página inicial (`/inicio`) — layout normativo

1. Eyebrow centralizado: `PLATAFORMA PLENA`, caixa alta, `tracking-[0.2em]`, `--text-muted`.
2. `H1` centralizado: `Boas-vindas, <PrimeiroNome>!`
3. Linha de apoio centralizada, uma frase, `--text-muted`.
4. Seção `ATIVADAS NA SUA CONTA` + badge com a contagem; sublinha explicativa.
5. **Grade de cards de módulo em 3 colunas** (`lg:grid-cols-3`, `md:grid-cols-2`,
   `grid-cols-1`). **Nunca coluna única em desktop.**
6. Seção `AINDA NÃO CONTRATADAS` + contagem, com cards em estado `EM BREVE` / bloqueado.

### Card de módulo

```
┌─────────────────────────────────┐
│ ▓▓ faixa em gradiente do módulo │  ← ~96px: ícone em tile + badge ATIVO (topo dir.)
│ [🏛]                    (ATIVO) │
│ Plena Gestor SUS                │  ← título Montserrat, branco, DENTRO da faixa
├─────────────────────────────────┤
│ Descrição em 2–3 linhas.        │  ← corpo branco, --text-muted
│                                 │
│ Entrar →                        │  ← link em --theme-accent, semibold
└─────────────────────────────────┘
```

- O **título fica sobre a faixa em gradiente**, não no corpo branco.
- Badge de status no canto superior direito da faixa: `ATIVO` (verde), `EM BREVE` (cinza).
- Link final: `Entrar →` ou `Entrar e escolher o município →` quando o módulo exigir município.
- Hover: `translateY(-2px)` + `shadow-lg`. Sem `scale` que desloque o layout.

---

## 7. Componentes normativos

### 7.1 Card de KPI (faixa de indicadores)

Cartão branco, `rounded-xl`, borda `--border-subtle`, `shadow-sm`, padding `20px`:
ícone em tile colorido (`28px`), label em **caixa alta `11px` `tracking-wider`
`--text-muted`**, valor em número grande (`28–32px`, bold, Montserrat), e uma linha
de contexto opcional em `12px`. A cor do valor segue a semântica (pago = verde,
pendência = âmbar, risco = vermelho). Use `grid` de 4 a 6 colunas, nunca `flex-wrap` solto.

### 7.2 Banner de alerta

`rounded-xl`, borda de `1px` na cor semântica, fundo na variante clara, ícone à esquerda,
texto em `14px`, e **link de ação à direita** (`Ver emendas →`). Empilhe múltiplos banners
com `gap-3`. Nunca use `alert()` nem toast para regra de negócio persistente.

### 7.3 Chips de filtro

Linha iniciada pelo label `Filtrar:`. Chips `rounded-pill`, `px-4 py-1.5`, `12px` semibold.
Inativo: fundo `--surface-card`, borda `--border-subtle`, texto `--text-body`.
Ativo: fundo `--theme-accent`, texto branco.

### 7.4 Tabela

Container branco `rounded-xl` com `overflow-hidden` e `shadow-lg`.
`th`: caixa alta, `11px`, `tracking-wider`, bold, `--text-muted`, fundo `--surface-sunken`,
alinhado à esquerda (números à direita). `td`: `14px`, padding `16px`, borda inferior
`--border-subtle`. Zebra opcional. Hover na linha: `--theme-accent-soft`.
Coluna de ordenação exibe `↓`/`↑`. Última coluna = `AÇÕES`, com botão
`Detalhar →` em gradiente do tema.

### 7.5 Badges

- **Status** (`Paga`, `Aprovada`, `Ativo`): pílula, fundo semântico claro, texto escuro,
  `11px` semibold, capitalizado.
- **Risco** (`VERMELHO`, `AMARELO`, `VERDE`): pílula **sólida**, texto branco,
  **caixa alta**, `10px`, `tracking-wide`.

### 7.6 Botões

| Variante | Estilo |
|---|---|
| Primário | fundo `--theme-gradient`, texto branco, `rounded-lg`, `px-6 py-3`, semibold |
| Secundário | fundo transparente, borda `--border-strong`, texto `--text-body` |
| Perigo | texto/borda vermelhos (`soft`); sólido **apenas** para exclusão destrutiva confirmada |
| Link-ação | texto `--theme-accent` + `→`, sem fundo |

Todos: `cursor-pointer`, `transition 200ms`, foco visível (`ring-2 ring-theme`),
`active:scale-95`.

### 7.7 Formulários

Label acima do campo (`12px`, semibold, `--text-body`). Input `rounded-lg`, `px-4 py-3`,
borda `--border-subtle`, foco = borda `--theme-accent` + `ring-2` translúcido.
Texto de ajuda abaixo em `12px` `--text-muted`. Erro em vermelho abaixo, com ícone.
Campo bloqueado por regra de negócio exibe uma **explicação do motivo**, não apenas `disabled`.

---

## 8. Ícones

- **Biblioteca única: Lucide React.** Sem exceções.
- Tamanhos: `14` (inline), `16` (padrão), `18` (header), `20–24` (destaque).
- **Emoji nunca é ícone** — nem em menu, nem em botão, nem em card, nem em título.
  Emoji só é permitido dentro de texto redigido pelo usuário final.

---

## 9. Idioma e escrita

- Interface **100% em português do Brasil**, com acentuação correta.
- Títulos de página em *sentence case*; labels de apoio em CAIXA ALTA com `tracking`.
- Moeda: `R$ 1.234.567,89`. Datas: `dd/mm/aaaa`. Percentual: `12,5%`.
- Termos institucionais preservados: `SUS`, `PMS`, `PAS`, `RDQA`, `RAG`, `NFS-e`, `CNES`,
  `IBGE`, `TCE`, `SIOPS`, `FNS`, `InvestSUS`.
- Voz: autoritária, visionária, humana e acessível. Foco em resultado.

---

## 10. Responsividade

Validar em `375px`, `768px`, `1024px`, `1440px`.
- `<1024px`: sidebar vira drawer sobreposta com overlay; header mantém município + temas.
- `<768px`: grades de módulo e KPI colapsam para 1 coluna; tabelas ganham
  `overflow-x: auto` **no container**, nunca no `body`.
- **Nunca** scroll horizontal na página.

---

## 11. Acessibilidade

- Contraste mínimo **4.5:1** para texto, **3:1** para ícones e bordas.
- Foco de teclado visível em todo elemento interativo.
- `aria-label` em todo botão apenas com ícone (sino, tela cheia, hamburger, bolinhas de tema).
- Bolinhas de tema são `role="radiogroup"` navegáveis por teclado.
- `prefers-reduced-motion` respeitado (já coberto em `plena-tokens.css`).

---

## 12. Estados obrigatórios

Toda tela que carrega dados implementa os quatro:

1. **Carregando** — skeleton com a forma do conteúdo final (`animate-pulse`). Sem spinner
   de página inteira.
2. **Vazio** — ícone, frase explicativa e ação primária de saída.
3. **Erro** — mensagem em português dizendo o que falhou e o que fazer. Nunca stack trace.
4. **Sucesso** — o conteúdo.

---

## 13. Anti-padrões (rejeição automática em review)

- ❌ Fonte diferente de Montserrat/Roboto.
- ❌ Ausência do logotipo Plena na sidebar; inicial em círculo no lugar dele.
- ❌ Emoji usado como ícone.
- ❌ Cor fora dos tokens (hex solto no JSX/CSS).
- ❌ Renomear módulo Plena para o nome do cliente.
- ❌ Botão `Sair` vermelho sólido e grande no header.
- ❌ Toggle de tema claro/escuro flutuando no rodapé da página.
- ❌ **Barra de navegação inferior com abas de módulo** — não existe no padrão Plena;
  navegação de módulo é **exclusivamente** pela sidebar.
- ❌ Cards de módulo em coluna única no desktop.
- ❌ Tela autenticada sem breadcrumb.
- ❌ Tela autenticada sem o FAB Plena I.A.
- ❌ Header ou sidebar redesenhados dentro de uma página específica.
- ❌ Menos de 8 temas, ou temas que alteram cor de marca / semântica / módulo.
- ❌ Texto com contraste abaixo de 4.5:1.
- ❌ Transição instantânea (sempre 150–300ms).
- ❌ `MASTER.md` auto-gerado tratado como fonte de identidade.

---

## 14. Checklist de entrega

Antes de dizer que a tela está pronta:

- [ ] Montserrat nos títulos e Roboto no corpo, carregadas via `next/font`
- [ ] Logotipo Plena correto no topo da sidebar, trocando com light/dark
- [ ] `plena-tokens.css` importado; **zero** hex solto no código da tela
- [ ] Preset Tailwind Plena aplicado
- [ ] Os 8 temas presentes, na ordem, persistidos e sem flash na primeira pintura
- [ ] Light **e** dark validados nos 8 temas
- [ ] Sidebar com módulos nas cores canônicas, kickers, chevrons e submenu inline
- [ ] CTA `Habilitar Meu Município Real` fixo no rodapé da sidebar
- [ ] Header completo: hamburger, município, TEMAS, tela cheia, sino, Sair, chip de usuário
- [ ] Breadcrumb presente
- [ ] FAB Plena I.A. presente
- [ ] Ícones exclusivamente Lucide; nenhum emoji como ícone
- [ ] Grade de módulos em 3 colunas no desktop
- [ ] Estados de carregando / vazio / erro implementados
- [ ] Responsivo em 375 / 768 / 1024 / 1440, sem scroll horizontal
- [ ] Foco visível e `aria-label` nos botões de ícone
- [ ] Textos em pt-BR, moeda e datas no formato brasileiro
