<#
    Diagnostico-PlenaDesignSystem.ps1

    Roda na RAIZ do repositorio (onde esta o package.json) e reporta o que
    falta para o padrao Plena estar realmente ligado ao codigo.
    Nao altera nada - so le e reporta.

    USO:
        powershell -ExecutionPolicy Bypass -File .\Diagnostico-PlenaDesignSystem.ps1
#>
param([string]$Raiz = ".")

$ErrorActionPreference = 'SilentlyContinue'
Set-Location -LiteralPath $Raiz
$raiz = (Get-Location).Path

function Item($ok, $texto, $detalhe) {
    $marca = if ($ok) { "[ OK   ]" } else { "[FALTA ]" }
    $cor   = if ($ok) { "Green" } else { "Red" }
    Write-Host "$marca $texto" -ForegroundColor $cor
    if ($detalhe) { Write-Host "         $detalhe" -ForegroundColor DarkGray }
}

Write-Host "`n=== Diagnostico Plena Design System ===" -ForegroundColor Cyan
Write-Host "Repositorio: $raiz`n" -ForegroundColor Gray

# --- e mesmo a raiz de um projeto Node? ---
if (-not (Test-Path package.json)) {
    Write-Host "package.json nao encontrado." -ForegroundColor Red
    Write-Host "Esta pasta nao e a raiz de um projeto - o padrao nao sera lido aqui.`n" -ForegroundColor Red
    return
}

# --- 1. arquivos do pacote ---
Write-Host "1. ARQUIVOS DO PACOTE" -ForegroundColor Yellow
$esperados = @(
    'CLAUDE.md',
    'design-system\PLENA-UI-STANDARD.md',
    'design-system\plena-tokens.css',
    'design-system\tailwind-plena-preset.js',
    'design-system\INSTALACAO-CODIGO.md',
    'design-system\PROMPT-INICIAL.md',
    'design-system\COMPARATIVO-TELAS.md',
    'design-system\README.md'
)
foreach ($f in $esperados) { Item (Test-Path -LiteralPath $f) $f $null }

# --- 2. versao do tailwind ---
Write-Host "`n2. TAILWIND" -ForegroundColor Yellow
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$tw  = $pkg.dependencies.tailwindcss
if (-not $tw) { $tw = $pkg.devDependencies.tailwindcss }
$cfg = Get-ChildItem tailwind.config.* | Select-Object -First 1

$v4 = ($tw -match '^\D*4') -or (-not $cfg)
$versao = if ($v4) { "v4 (CSS-first)" } else { "v3 (tailwind.config)" }
Write-Host "         versao detectada: $versao   [package.json: $tw]" -ForegroundColor Cyan

if ($v4) {
    Item (Test-Path 'design-system\plena-theme-v4.css') "ponte v4 presente (plena-theme-v4.css)" `
         "no v4 o preset .js nao funciona - a ponte CSS e obrigatoria"
} else {
    $ligado = $cfg -and (Select-String -LiteralPath $cfg.FullName -Pattern 'tailwind-plena-preset' -Quiet)
    Item $ligado "preset ligado no $($cfg.Name)" `
         "sem isto as classes plena-azul / font-display nao existem"
}

# --- 3. globals.css ---
Write-Host "`n3. GLOBALS.CSS" -ForegroundColor Yellow
$g = @('src\app\globals.css','app\globals.css','src\styles\globals.css') |
     Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $g) {
    Item $false "globals.css nao encontrado" "procurei em src\app, app e src\styles"
} else {
    Write-Host "         arquivo: $g" -ForegroundColor DarkGray
    $linhas = Get-Content $g
    $impTok = $linhas | Select-String 'plena-tokens\.css' | Select-Object -First 1
    Item ($null -ne $impTok) "importa plena-tokens.css" $null

    if ($impTok) {
        # o @import precisa vir antes de qualquer regra que nao seja @import/@charset/@layer
        $nImport = $impTok.LineNumber
        $primeiraRegra = ($linhas | Select-String -Pattern '^\s*(@tailwind|[.#:*a-zA-Z\[])' |
                          Where-Object { $_.Line -notmatch '^\s*@(import|charset|layer|custom-variant|plugin)' } |
                          Select-Object -First 1)
        if ($primeiraRegra -and $primeiraRegra.LineNumber -lt $nImport) {
            Item $false "posicao do @import" `
                 "@import na linha $nImport vem DEPOIS de regra na linha $($primeiraRegra.LineNumber) - o PostCSS descarta"
        } else {
            Item $true "posicao do @import (antes de qualquer regra)" $null
        }

        # conferir profundidade do caminho relativo
        $caminho = ([regex]::Match($impTok.Line, '["'']([^"'']*plena-tokens\.css)["'']')).Groups[1].Value
        if ($caminho) {
            $resolvido = Join-Path (Split-Path (Join-Path $raiz $g) -Parent) $caminho
            Item (Test-Path -LiteralPath $resolvido) "caminho do @import resolve" $caminho
        }
    }
    if ($v4) {
        Item ($null -ne ($linhas | Select-String 'plena-theme-v4\.css')) "importa plena-theme-v4.css" $null
    }
}

# --- 4. fontes ---
Write-Host "`n4. FONTES" -ForegroundColor Yellow
$lay = @('src\app\layout.tsx','app\layout.tsx') | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $lay) {
    Item $false "layout.tsx nao encontrado" $null
} else {
    $c = Get-Content $lay -Raw
    Item ($c -match 'Montserrat') "Montserrat importada" $null
    Item ($c -match 'Roboto')     "Roboto importada" $null
    Item ($c -match 'font-montserrat|font-display') "variavel de fonte aplicada no <html>" $null
    Item ($c -match "localStorage.*plena-theme|data-theme") "script inline de tema no <head>" `
         "sem isto ha flash de tema errado ao carregar"
}

# --- 5. sistema de tokens antigo ---
Write-Host "`n5. MIGRACAO DE TOKENS" -ForegroundColor Yellow
$fontes = Get-ChildItem src -Recurse -Include *.tsx,*.ts,*.css -ErrorAction SilentlyContinue
$antigos = $fontes | Select-String -Pattern 'brand-blue|brand-green|--background\b|--foreground\b'
$hex     = $fontes | Where-Object { $_.Extension -eq '.tsx' } | Select-String -Pattern '#[0-9a-fA-F]{6}'

Item ($antigos.Count -eq 0) "nenhuma referencia ao sistema de tokens antigo" `
     "$($antigos.Count) ocorrencia(s) de brand-blue/--background em $(($antigos | Group-Object Filename).Count) arquivo(s)"
Item ($hex.Count -eq 0) "nenhum hex solto em .tsx" `
     "$($hex.Count) ocorrencia(s) - devem virar var(--plena-*) ou classe Tailwind"

if ($antigos.Count -gt 0) {
    Write-Host "`n         arquivos com mais ocorrencias:" -ForegroundColor DarkGray
    $antigos | Group-Object Filename | Sort-Object Count -Descending | Select-Object -First 5 |
        ForEach-Object { Write-Host ("           {0,3}x  {1}" -f $_.Count, $_.Name) -ForegroundColor DarkGray }
}

# --- 6. documento revogado ---
Write-Host "`n6. CONFLITOS" -ForegroundColor Yellow
$master = 'design-system\plena-intelligence\MASTER.md'
if (Test-Path $master) {
    Item $false "MASTER.md revogado ainda presente" "APAGUE - identidade errada (Fira Code / #22C55E)"
} else {
    Item $true "nenhum MASTER.md conflitante" $null
}

Write-Host "`n--- Proximo passo: design-system\INSTALACAO-CODIGO.md ---`n" -ForegroundColor Cyan
