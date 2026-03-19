#!/usr/bin/env python3
import subprocess
import os
os.chdir('d:\\Laercio\\colacomigo')

# Step 1: Add files
print("📝 Adicionando arquivos...")
subprocess.run(['git', 'add', 'next.config.ts', 'src/app/layout.tsx', 'src/app/(store)/layout.tsx', 'src/components/store/StoreDynamicComponents.tsx'], capture_output=True)

# Step 2: Commit
print("💾 Criando commit...")
result = subprocess.run(['git', 'commit', '-m', 'refactor: move Toaster from RootLayout to StoreLayout client component'], capture_output=True, text=True)
print(result.stdout)
if result.returncode != 0:
    print(f"⚠️ Git commit: {result.stderr}")

# Step 3: Push
print("🚀 Fazendo push para GitHub...")
result = subprocess.run(['git', 'push', '-v'], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print(result.stderr)

if result.returncode == 0:
    print("\n✅ Push enviado com sucesso!")
else:
    print(f"\n❌ Erro no push: {result.returncode}")
