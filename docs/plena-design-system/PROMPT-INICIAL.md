# Prompt inicial — colar na PRIMEIRA mensagem de qualquer chat/ferramenta

> Use quando a ferramenta **não** lê o repositório automaticamente
> (chat novo do Claude, ChatGPT, v0, Lovable, Cursor sem contexto, Copilot Chat…).
> Anexe também os arquivos `PLENA-UI-STANDARD.md`, `plena-tokens.css`
> e `tailwind-plena-preset.js`.

---

## Versão longa (recomendada)

```
Este trabalho pertence à PLATAFORMA PLENA (Plena Intelligence — plenaintelligence.ai).
Estou anexando o arquivo PLENA-UI-STANDARD.md, que é a NORMA OBRIGATÓRIA de frontend
da plataforma, junto com plena-tokens.css e tailwind-plena-preset.js.

Antes de escrever qualquer linha de UI:
1. Leia PLENA-UI-STANDARD.md por inteiro.
2. Confirme para mim, em 5 linhas, o que entendeu sobre: fontes, cores de marca,
   sistema de 8 temas, anatomia do shell e anti-padrões.
3. Só então comece a implementar.

Regras que não admitem exceção:
- Fontes: Montserrat (títulos) + Roboto (corpo). Nunca Inter, Geist, Fira ou Poppins.
- Marca: azul #041E42, verde #00C19F, gradiente #00AFEC → #01EFA1.
- Logotipo Plena no topo da sidebar em toda tela autenticada. Nunca inicial em
  círculo, nunca emoji, nunca logo do cliente no lugar da marca.
- 8 temas de acento no header (label "TEMAS" + 8 bolinhas), na ordem definida no
  padrão, independentes do toggle claro/escuro.
- Shell único: sidebar de módulos com submenu inline + header de 72px com seletor
  de município + breadcrumb + botão flutuante "Plena I.A.".
- Ícones somente Lucide React. Emoji NUNCA é ícone.
- Nomes de módulo fixos e prefixados por "Plena" — não renomear para o cliente.
- Sem barra de navegação inferior com abas de módulo.
- Cards de módulo em grade de 3 colunas no desktop.
- Nenhum hex solto no código: use exclusivamente os tokens de plena-tokens.css.
- Interface 100% em português do Brasil.

Ao terminar, rode o "Checklist de Entrega" (seção 14 do padrão) e me responda
item a item, marcando o que ficou pendente.
```

---

## Versão curta (lembrete no meio de um chat já em andamento)

```
Lembrete: siga o PLENA-UI-STANDARD.md que anexei.
Montserrat + Roboto; #041E42 / #00C19F / gradiente #00AFEC→#01EFA1; logotipo Plena
na sidebar; 8 temas no header separados do dark mode; shell único com sidebar de
módulos + header 72px + breadcrumb + FAB Plena I.A.; ícones só Lucide, emoji nunca
como ícone; nomes de módulo prefixados por "Plena"; sem bottom nav; nenhum hex solto.
Antes de responder, confirme que releu o padrão.
```
