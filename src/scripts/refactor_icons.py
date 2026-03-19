import os
import re

src_dir = r'd:\Laercio\colacomigo\src'
icon_file = r'd:\Laercio\colacomigo\src\components\ui\icons.tsx'

# 1. Obter todos os nomes de ícones das exportações nomeadas
with open(icon_file, 'r', encoding='utf-8') as f:
    content = f.read()
    icon_names = re.findall(r'export const (\w+) =', content)

print(f"Encontrados {len(icon_names)} ícones nomeados.")

# 2. Varrer arquivos e substituir
def refactor_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '@/components/ui/icons' not in content:
        return False
    
    # Encontrar quais ícones são usados via 'Icons.Name'
    used_icons = []
    for name in icon_names:
        if f'Icons.{name}' in content:
            used_icons.append(name)
    
    if not used_icons and 'Icons' not in content:
        return False
        
    print(f"Refatorando {file_path} (Icons usados: {len(used_icons)})")
    
    # Substituir Icons.Name por Name
    new_content = content
    for name in used_icons:
        new_content = new_content.replace(f'Icons.{name}', name)
    
    # Substituir a importação
    if 'import { Icons } from' in new_content:
        import_str = f"import {{ {', '.join(sorted(list(set(used_icons))))} }} from"
        # Tratar caso de importação preexistente se houver (mas geralmente é só Icons)
        new_content = re.sub(r'import \{ Icons \} from [\'"]@/components/ui/icons[\'"]', f"{import_str} '@/components/ui/icons'", new_content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

# Executar em todo o src
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            refactor_file(os.path.join(root, file))

# 3. Remover o objeto Icons de icons.tsx para liberar espaço e forçar tree-shaking
# Só se não houver erro no processo
with open(icon_file, 'r', encoding='utf-8') as f:
    orig_icons = f.read()

# Remove do "export const Icons = {" até o final "}"
new_icons = re.sub(r'export const Icons = \{[\s\S]*\}\n*', '', orig_icons)
# Garante que não sobrou lixo
with open(icon_file, 'w', encoding='utf-8') as f:
    f.write(new_icons)

print("Refatoração de ícones concluída com sucesso!")
