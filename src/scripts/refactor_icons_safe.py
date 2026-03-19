import os
import re

src_dir = r'd:\Laercio\colacomigo\src'
icon_file = r'd:\Laercio\colacomigo\src\components\ui\icons.tsx'

# 1. Coletar nomes dos ícones
try:
    with open(icon_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        icon_names = re.findall(r'export const (\w+) =', content)
except Exception as e:
    print(f"Erro ao ler icons.tsx: {e}")
    icon_names = []

print(f"Encontrados {len(icon_names)} ícones.")

def refactor_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        if '@/components/ui/icons' not in content:
            return
            
        new_content = content
        used_icons = []
        
        # Casos: Icons.Name -> Name
        for name in icon_names:
            if f'Icons.{name}' in new_content:
                used_icons.append(name)
                new_content = new_content.replace(f'Icons.{name}', name)
        
        # Se for { Icons } ou * as Icons
        # Substitui: import { Icons } from ... -> import { X, Y, Z } from ...
        if 'import { Icons }' in new_content:
            if used_icons:
                import_stmt = f"import {{ {', '.join(sorted(list(set(used_icons))))} }}"
                new_content = re.sub(r'import \{ Icons \} from [\'"]@/components/ui/icons[\'"]', f"{import_stmt} '@/components/ui/icons'", new_content)
            else:
                # Se não usou nenhum ícone, remove a importação
                new_content = re.sub(r'import \{ Icons \} from [\'"]@/components/ui/icons[\'"]\n*', '', new_content)
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Refatorado: {os.path.basename(file_path)}")
            
    except Exception as e:
        print(f"⚠️ Erro em {file_path}: {e}")

# 2. Executar
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            refactor_file(os.path.join(root, file))

# 3. Limpar icons.tsx (Remove o objeto pesado no final)
try:
    with open(icon_file, 'r', encoding='utf-8', errors='ignore') as f:
        orig = f.read()
    new_icons = re.sub(r'export const Icons = \{[\s\S]*\}', '', orig)
    with open(icon_file, 'w', encoding='utf-8') as f:
        f.write(new_icons.strip() + '\n')
    print("🧹 Objeto Icons removido de icons.tsx")
except Exception as e:
    print(f"Erro final em icons.tsx: {e}")

print("Encerrado.")
