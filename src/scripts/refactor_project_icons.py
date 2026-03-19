import os
import re

def refactor_icons():
    src_dir = r"d:\Laercio\colacomigo\src"
    icons_path = r"@/components/ui/icons"
    
    # Regex to find usages like Icons.Search or Icons.ShoppingBag
    usage_pattern = re.compile(r'Icons\.([a-zA-Z0-9]+)')
    # Regex to find the import statement
    import_pattern = re.compile(r'import\s+\{\s*Icons\s*\}\s+from\s+[\'"]' + re.escape(icons_path) + r'[\'"]')

    processed_count = 0

    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check if file imports Icons from the specific path
                if import_pattern.search(content):
                    print(f"Processing: {path}")
                    
                    # Find all used icons
                    used_icons = set(usage_pattern.findall(content))
                    
                    # Replace Usages
                    new_content = usage_pattern.sub(r'\1', content)
                    
                    # Update Import
                    if used_icons:
                        icons_list = ", ".join(sorted(list(used_icons)))
                        new_import = f"import {{ {icons_list} }} from '{icons_path}'"
                        new_content = import_pattern.sub(new_import, new_content)
                    else:
                        # If Icons was imported but not used (or no Icons. found), remove the import line
                        new_content = import_pattern.sub("", new_content)
                    
                    # Remove double newlines if any were created by removing imports
                    new_content = new_content.replace('\n\n\n', '\n\n')
                    
                    if content != new_content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        processed_count += 1
                        print(f"  Updated!")

    print(f"Total files updated: {processed_count}")

if __name__ == "__main__":
    refactor_icons()
