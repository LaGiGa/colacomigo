@echo off
cd /d d:\Laercio\colacomigo

echo Verificando status...
git status

echo.
echo Adicionando mudanças...
git add next.config.ts src/app/layout.tsx "src/app/(store)/layout.tsx" "src/components/store/StoreDynamicComponents.tsx"

echo.
echo Criando commit...
git commit -m "refactor: move Toaster from RootLayout to StoreLayout client component"

echo.
echo Fazendo push...
git push -u origin main

echo.
echo Deploy iniciado!
pause
