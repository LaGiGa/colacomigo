import subprocess
import sys
import os

try:
    os.chdir(r'd:\Laercio\colacomigo')
    
    # Add files
    subprocess.run(['git', 'add', 'next.config.ts', 'src/app/layout.tsx', 
                   'src/app/(store)/layout.tsx', 'src/components/store/StoreDynamicComponents.tsx'], 
                   check=True)
    print("✓ Arquivos adicionados")
    
    # Commit
    subprocess.run(['git', 'commit', '-m', 
                   'refactor: move Toaster from RootLayout to StoreLayout - remove sonner from global bundle'],
                   check=True)
    print("✓ Commit criado")
    
    # Push
    result = subprocess.run(['git', 'push'], capture_output=True, text=True)
    if result.returncode == 0:
        print("✓ Push enviado com sucesso!")
        print("\n🚀 Deploy automático iniciado no Cloudflare Pages")
    else:
        print(f"Erro no push: {result.stderr}")
        sys.exit(1)
        
except Exception as e:
    print(f"Erro: {e}")
    sys.exit(1)
