# Pacote de Padronização de Frontend — Plena Intelligence

Este pacote existe para resolver um problema concreto: **telas criadas em chats/ferramentas
diferentes saem com cores, fontes, logotipo e menus divergentes.**

## Por que isso acontece

Cada sessão de IA (Claude Code, Cursor, ChatGPT, v0…) **começa do zero** e enxerga
**apenas o repositório ao qual está conectada**. Não existe memória compartilhada entre
chats: o que foi combinado em uma conversa não chega à seguinte.

Quando o repositório não contém a identidade Plena de forma legível por máquina, o modelo
faz a única coisa que pode: **inventa um design plausível**. Daí saem Inter no lugar de
Montserrat, verde `#22C55E` no lugar de `#00C19F`, inicial em círculo no lugar do logotipo.

**A correção não é repetir instruções em cada chat — é colocar a identidade dentro do
repositório**, onde toda ferramenta a encontra automaticamente.

---

## Conteúdo do pacote

| Arquivo | O que é | Onde vai |
|---|---|---|
| `PLENA-UI-STANDARD.md` | Norma de UI: shell, temas, componentes, anti-padrões, checklist | `design-system/` na raiz do repo |
| `plena-tokens.css` | Tokens CSS canônicos (cores, espaços, raios, temas, módulos) | `design-system/`, importado no `globals.css` |
| `tailwind-plena-preset.js` | Preset do Tailwind com os tokens | `design-system/`, referenciado no `tailwind.config.js` |
| `CLAUDE.md.template` | Arquivo que faz a IA reconhecer o projeto | raiz do repo, renomeado para `CLAUDE.md` |
| `PROMPT-INICIAL.md` | Texto para colar em ferramentas que não leem o repo | uso manual |
| `COMPARATIVO-TELAS.md` | Auditoria da tela divergente × referência | histórico |

---

## Instalação em um repositório Plena (uma vez por projeto)

```bash
# 1) copiar o pacote
mkdir -p design-system
cp PLENA-UI-STANDARD.md plena-tokens.css tailwind-plena-preset.js design-system/

# 2) arquivo de reconhecimento na raiz
cp CLAUDE.md.template CLAUDE.md   # depois edite os campos <...>

# 3) logotipos oficiais
cp "Plena_Intelligence_LOGO - 1.png" "Plena_Intelligence_LOGO - 4.png" public/

# 4) remover a fonte de conflito, se existir
rm -rf design-system/plena-intelligence/MASTER.md
```

**5) `app/globals.css`** — importar os tokens **antes** de qualquer estilo local:

```css
@import '../design-system/plena-tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

**6) `tailwind.config.js`:**

```js
module.exports = {
  presets: [require('./design-system/tailwind-plena-preset.js')],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
};
```

**7) `app/layout.tsx`** — fontes oficiais:

```tsx
import { Montserrat, Roboto } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
});
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${roboto.variable}`}>
      <head>
        {/* aplica tema e dark mode ANTES da primeira pintura (evita flash) */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('plena-theme') || 'ciano';
              document.documentElement.setAttribute('data-theme', t);
              if (localStorage.getItem('plena-mode') === 'dark') {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="font-sans bg-surface-app text-content-body">{children}</body>
    </html>
  );
}
```

---

## Uso no dia a dia

### Claude Code / Cursor (leem o repositório)

Basta ter o `CLAUDE.md` na raiz — é lido automaticamente. Para reforçar em uma tarefa
específica:

> "Antes de mexer na UI, leia `design-system/PLENA-UI-STANDARD.md` e confirme o que
> entendeu. Ao terminar, rode o Checklist de Entrega da seção 14."

### ChatGPT / v0 / Lovable / chat novo sem repo

Cole o conteúdo de `PROMPT-INICIAL.md` na **primeira** mensagem e anexe
`PLENA-UI-STANDARD.md` + `plena-tokens.css` + `tailwind-plena-preset.js`.

### Ao revisar uma tela pronta

> "Audite esta tela contra `design-system/PLENA-UI-STANDARD.md`. Liste cada divergência
> com severidade (🔴 marca / 🟠 padrão / 🟡 fino) e proponha a correção."

---

## Manutenção

- `PLENA-UI-STANDARD.md` tem **uma única versão canônica**. Ao alterá-la, propague o
  arquivo para todos os repositórios Plena no mesmo dia.
- Novo módulo de produto ⇒ adicionar linha na tabela da seção 5 do padrão **e** as
  variáveis `--mod-*` em `plena-tokens.css`, na mesma alteração.
- Nunca crie um "design system" paralelo por projeto. Se um projeto precisa de algo que o
  padrão não cobre, **o padrão é estendido**, não contornado.

---

## Melhoria recomendada (próximo passo)

Publicar este pacote como repositório próprio (ex.: `plena-cmd/plena-design-system`) e
consumi-lo via submódulo git ou pacote npm privado. Assim a atualização deixa de ser
cópia manual e passa a ser `npm update`. Enquanto isso não existe, a cópia manual acima
já resolve o problema de divergência.
