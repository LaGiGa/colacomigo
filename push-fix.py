#!/usr/bin/env python3
import subprocess
import sys
import os

os.chdir('d:/Laercio/colacomigo')

try:
    print("Adding files...")
    subprocess.run(['git', 'add', '.'], check=True)
    print("✓ Files added")
    
    print("Committing...")
    subprocess.run(['git', 'commit', '-m', 'fix: move runtime exports to top of files'], check=True)
    print("✓ Commit created")
    
    print("Pushing...")
    subprocess.run(['git', 'push'], check=True)
    print("✓ Push complete")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
