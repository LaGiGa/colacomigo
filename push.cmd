@echo off
chcp 65001 > nul
title Cola Comigo - Git Push
color 0A

:start
cls
echo ============================================
echo   PUSH PARA GITHUB - COLACOMIGO
echo ============================================
echo.

cd /d "d:\Laercio\colacomigo"

echo [1/5] Verificando status...
git status --short
echo.

echo [2/5] Adicionando arquivos...
git add next.config.ts "src/app/layout.tsx" "src/app/(store)/layout.tsx" "src/components/store/StoreDynamicComponents.tsx"
if errorlevel 1 goto error

echo [3/5] Criando commit...
git commit -m "refactor: move Toaster from RootLayout to StoreLayout client component"
if errorlevel 1 goto error

echo [4/5] Fazendo push...
git push -u origin main
if errorlevel 1 goto error

echo.
cls
color 0B
echo ============================================
echo   ✓ SUCESSO!
echo ============================================
echo.
echo Mudanças enviadas para GitHub!
echo Deploy automático iniciado no Cloudflare Pages
echo.
echo Commit: https://github.com/LaGiGa/colacomigo/commits/main
echo.
pause
goto end

:error
color 0C
echo.
echo ERRO! Verifique a saída acima
echo.
pause
goto end

:end
