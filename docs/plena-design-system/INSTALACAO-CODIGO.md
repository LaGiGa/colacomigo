# Ligando o padrão ao código — guia de execução

> Copiar os arquivos **não muda a aparência de nada**. Este documento é o passo que
> falta: ligar os tokens ao Tailwind, instalar as fontes e migrar as cores antigas.
>
> Estado típico depois de só copiar os arquivos:
> tokens existem ✅ · ninguém os usa ❌ · tela continua idêntica.

---

## Passo 0 — Descobrir a versão do Tailwind

Tudo depende disso. Na raiz do repositório:

```powershell
Select-String package.json -Pattern '"tailwindcss"'
Get-ChildItem tailwind.config.* -ErrorAction SilentlyContinue
```

| Resultado | Versão | Siga |
|---|---|---|
| `"tailwindcss": "^4..."` **ou** não existe `tailwind.config.*` | **v4** | Passo 1-B |
| `"tailwindcss": "^3..."` **e** existe `tailwind.config.js/ts` | **v3** | Passo 1-A |

Outra pista rápida: abra o `globals.css`.
`@import "tailwindcss";` = v4. `@tailwind base;` = v3.

---

## Passo 1-A — Tailwind v3

**`tailwind.config.js`** — adicione o preset:

```js
module.exports = {
  presets: [require('./design-system/tailwind-plena-preset.js')],
  content: ['./src/**/*.{ts,tsx}'],   // mantenha o content que já existia
  // o resto da sua config continua aqui e sobrepõe o preset quando conflitar
};
```

**`src/app/globals.css`** — o `@import` tem que vir **antes** dos `@tailwind`:

```css
@import '../../design-system/plena-tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

> ⚠️ Erro comum: colocar o `@import` **depois** dos `@tailwind`. Em CSS, `@import`
> só é válido antes de qualquer outra regra — o PostCSS descarta silenciosamente e
> os tokens somem sem mensagem de erro.

Ignore `plena-theme-v4.css` — ele é só para v4.

---

## Passo 1-B — Tailwind v4

Não existe `tailwind.config.js`. O preset `.js` **não funciona** aqui — use a ponte CSS.

**`src/app/globals.css`** — os três imports, nesta ordem, no topo do arquivo:

```css
@import "tailwindcss";
@import "../../design-system/plena-tokens.css";
@import "../../design-system/plena-theme-v4.css";
```

Ajuste a profundidade do caminho:

| Onde está o globals.css | Caminho |
|---|---|
| `app/globals.css` | `../design-system/...` |
| `src/app/globals.css` | `../../design-system/...` |

O `plena-theme-v4.css` já traz `@custom-variant dark` — sem isso o v4 usa
`prefers-color-scheme` e o seu toggle de tema não funciona.

---

## Passo 2 — Fontes (Montserrat + Roboto)

É a divergência mais visível de todas. **`src/app/layout.tsx`:**

```tsx
import { Montserrat, Roboto } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${roboto.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              document.documentElement.setAttribute('data-theme',
                localStorage.getItem('plena-theme') || 'ciano');
              if (localStorage.getItem('plena-mode') === 'dark')
                document.documentElement.classList.add('dark');
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="font-sans bg-surface-app text-content-body">{children}</body>
    </html>
  );
}
```

O `<script>` inline aplica tema e dark mode **antes da primeira pintura**. Sem ele há
flash de tema errado a cada carregamento.

**Conferir se pegou:** abra a tela, F12 → Elements → `<body>` → Computed → `font-family`.
Tem que aparecer Roboto. Num `<h1>` com `font-display`, Montserrat.

---

## Passo 3 — Migrar o sistema de tokens antigo

Este é o trabalho de verdade. Enquanto os componentes lerem `--brand-blue`, nada muda.

**3.1 — Levantar o que existe:**

```powershell
# quais tokens antigos estão definidos
Select-String src\app\globals.css -Pattern '^\s*--[a-z-]+:' | ForEach-Object { $_.Line.Trim() }

# quantos arquivos usam cada um
Get-ChildItem src -Recurse -Include *.tsx,*.ts,*.css |
  Select-String -Pattern 'brand-blue|brand-green|--background|--foreground' |
  Group-Object Filename | Sort-Object Count -Descending
```

**3.2 — Montar a tabela de-para.** Preencha com os valores reais do seu projeto:

| Token antigo | Valor atual | Token Plena | Bate? |
|---|---|---|---|
| `--brand-blue` | `?` | `--plena-azul` `#041E42` | |
| `--brand-green` | `?` | `--plena-verde` `#00C19F` | |
| `--background` | `?` | `--surface-app` | |
| `--foreground` | `?` | `--text-strong` | |
| `--card` | `?` | `--surface-card` | |
| `--border` | `?` | `--border-subtle` | |

Onde o valor **já for igual**, é só trocar o nome. Onde **for diferente**, a troca muda
a aparência — é exatamente esse o ponto, mas revise tela por tela.

**3.3 — Ponte temporária (recomendado).** Em vez de trocar centenas de referências de
uma vez, aponte os tokens antigos para os novos no `globals.css`. Um arquivo, efeito
imediato, reversível:

```css
:root {
  --brand-blue:  var(--plena-azul);
  --brand-green: var(--plena-verde);
  --background:  var(--surface-app);
  --foreground:  var(--text-strong);
  --card:        var(--surface-card);
  --border:      var(--border-subtle);
}
```

A aparência corrige na hora. Depois vá trocando os nomes por módulo, sem pressa, e
remova a ponte quando a contagem do 3.1 chegar a zero.

**3.4 — Hex soltos no JSX:**

```powershell
Get-ChildItem src -Recurse -Include *.tsx |
  Select-String -Pattern '#[0-9a-fA-F]{6}' |
  Select-Object Filename, LineNumber, Line
```

Cada ocorrência vira `var(--plena-*)` ou uma classe do Tailwind.

---

## Passo 4 — Validar

```bash
npm run dev
```

| Sintoma | Causa provável |
|---|---|
| `Can't resolve '../../design-system/plena-tokens.css'` | profundidade do caminho errada (passo 1-B) |
| Compila mas nada mudou | `@import` depois dos `@tailwind` (v3), ou preset não ligado |
| Classe `bg-plena-azul` não existe | preset não ligado (v3) / `plena-theme-v4.css` não importado (v4) |
| Fonte continua a antiga | `variable` não aplicada no `<html>`, ou `font-sans` sobrescrito |
| Flash de tema errado ao carregar | falta o `<script>` inline no `<head>` |
| `bg-surface-card/50` não funciona | limitação conhecida do v4 (ver fim do `plena-theme-v4.css`) |

Depois rode o **Checklist de Entrega**, seção 14 do `PLENA-UI-STANDARD.md`.

---

## Ordem sugerida

1. Passo 0 — descobrir a versão *(1 min)*
2. Passo 1 — ligar tokens e preset *(5 min)*
3. Passo 2 — fontes *(5 min)* ← **maior ganho visual pelo menor esforço**
4. Passo 3.3 — ponte de tokens *(10 min)* ← **segundo maior ganho**
5. Passo 3.2 e 3.4 — migração real *(gradual, por módulo)*
6. Shell, temas e componentes conforme o `PLENA-UI-STANDARD.md`

Os passos 2 e 3.3 sozinhos já eliminam a maior parte da divergência visual.
