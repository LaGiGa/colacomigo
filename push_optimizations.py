import subprocess
import os

repo_path = r'd:\Laercio\colacomigo'
os.chdir(repo_path)

def run(cmd):
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.stdout: print(result.stdout)
    if result.stderr: print(result.stderr)
    return result.returncode

run(['git', 'add', '.'])
run(['git', 'commit', '-m', "fix: optimize bundle size for Cloudflare by refactoring icons and removing lucide-react"])
run(['git', 'push'])
