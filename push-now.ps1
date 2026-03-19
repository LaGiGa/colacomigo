#!/usr/bin/env pwsh

# Script para fazer push das mudanças bundle-fix

Write-Host "🚀 Iniciando processo de push..." -ForegroundColor Green
Write-Host ""

$ErrorActionPreference = "Stop"

try {
    # Navegar para o diretório
    Push-Location "d:\Laercio\colacomigo"
    
    # Ver status
    Write-Host "📋 Status atual:" -ForegroundColor Cyan
    git status --short
    
    Write-Host ""
    Write-Host "➕ Adicionando arquivos modificados..." -ForegroundColor Yellow
    git add next.config.ts
    git add "src/app/layout.tsx"
    git add "src/app/(store)/layout.tsx"
    git add "src/components/store/StoreDynamicComponents.tsx"
    
    Write-Host "✅ Arquivos adicionados!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "💾 Criando commit..." -ForegroundColor Yellow
    git commit -m "refactor: move Toaster from RootLayout to StoreLayout client component

- Remove Toaster from global root server component
- Add Toaster to StoreLayout as dynamic import only
- Remove 'sonner' from optimizePackageImports
- Expected bundle reduction: 1-2 MiB"
    
    Write-Host "✅ Commit criado!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🔼 Fazendo push para GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    Write-Host ""
    Write-Host "✅✅✅ SUCESSO! Mudanças enviadas para GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Deploy automático iniciado no Cloudflare Pages!" -ForegroundColor Cyan
    Write-Host "   Verifique em: https://github.com/LaGiGa/colacomigo/commits/main" -ForegroundColor White
    
    Pop-Location
}
catch {
    Write-Host "❌ Erro durante o push:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Pop-Location
    exit 1
}
