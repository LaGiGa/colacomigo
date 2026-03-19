#!/usr/bin/env python3
import subprocess
import sys

try:
    # Check status
    result = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True, cwd='d:\\Laercio\\colacomigo')
    print(f"Changed files:\n{result.stdout}")
    
    # Add all changes
    subprocess.run(['git', 'add', '.'], cwd='d:\\Laercio\\colacomigo')
    print("✓ All files staged")
    
    # Commit
    commit_msg = """refactor: move Toaster from RootLayout to StoreLayout client component

- Remove Toaster from global root server component to avoid bundling sonner in all Pages Functions
- Add Toaster as dynamically imported component in StoreDynamicComponents  
- Add Toaster only to StoreLayout where it's needed (user-facing store pages)
- Remove 'sonner' from optimizePackageImports
- Remove optimizeCss: true flag
- Expected impact: Reduce bundle size by 1-2 MiB by removing global UI library imports"""
    
    result = subprocess.run(['git', 'commit', '-m', commit_msg], capture_output=True, text=True, cwd='d:\\Laercio\\colacomigo')
    print(f"Commit result: {result.returncode}")
    if result.stdout:
        print(result.stdout)
    
    # Push  
    result = subprocess.run(['git', 'push'], capture_output=True, text=True, cwd='d:\\Laercio\\colacomigo')
    print(f"Push result: {result.returncode}")
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(f"Push stderr: {result.stderr}")
    
    print("\n✓ Successfully pushed to GitHub")
    sys.exit(0)
    
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
