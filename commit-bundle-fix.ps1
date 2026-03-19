#!/usr/bin/env pwsh
# Commit and push bundle size fixes

Set-Location "d:\Laercio\colacomigo"

# Remove extra files
Remove-Item "analyze-bundle.js", "git-commit-push.py", ".vscode\tasks.json" -ErrorAction SilentlyContinue
git restore ".vscode\tasks.json"

# Stage the main bundle fix changes
git add next.config.ts
git add "src/app/layout.tsx"
git add "src/app/(store)/layout.tsx"
git add "src/components/store/StoreDynamicComponents.tsx"

# Commit
$commit_msg = @"
refactor: move Toaster from RootLayout to StoreLayout client component

- Remove Toaster from global root server component to avoid bundling sonner in all Pages Functions
- Add Toaster as dynamically imported component in StoreDynamicComponents
- Add Toaster only to StoreLayout where it's needed (user-facing store pages)
- Remove 'sonner' from optimizePackageImports
- Remove optimizeCss: true flag
- Expected impact: Reduce bundle size by 1-2 MiB by removing global UI library imports

Combined with previous lazy-loading optimizations, cumulative reduction expected: ~2 MiB
"@

git commit -m $commit_msg

# Push to GitHub (triggers automatic Cloudflare deploy)
git push

Write-Host "✓ Changes pushed successfully"
