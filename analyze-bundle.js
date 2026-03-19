#!/usr/bin/env node
/**
 * Bundle Size Analyzer para OpenNext + Cloudflare
 * Analisa quais módulos/dependências estão contribuindo mais para o tamanho
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OPEN_NEXT_DIR = '.open-next/functions';

function getDirectorySize(dir) {
    if (!fs.existsSync(dir)) return 0;
    
    let size = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            size += getDirectorySize(fullPath);
        } else {
            size += fs.statSync(fullPath).size;
        }
    }
    
    return size;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

console.log('\n📊 BUNDLE SIZE ANALYSIS\n');
console.log('=' .repeat(80));

// Analisar cada função
if (fs.existsSync(OPEN_NEXT_DIR)) {
    const functions = fs.readdirSync(OPEN_NEXT_DIR);
    const functionSizes = [];
    
    for (const func of functions) {
        const funcPath = path.join(OPEN_NEXT_DIR, func);
        if (fs.statSync(funcPath).isFile()) {
            const size = fs.statSync(funcPath).size;
            functionSizes.push({
                name: func,
                size: size,
                sizeMB: (size / (1024 * 1024)).toFixed(2)
            });
        }
    }
    
    // Ordenar por tamanho
    functionSizes.sort((a, b) => b.size - a.size);
    
    console.log('\n🔴 TOP 15 LARGEST FILES:\n');
    functionSizes.slice(0, 15).forEach((f, i) => {
        const bar = '█'.repeat(Math.ceil(f.sizeMB / 2));
        console.log(`${(i+1).toString().padStart(2)}. ${f.name.padEnd(70)} ${bar} ${f.sizeMB} MB`);
    });
    
    const totalSize = functionSizes.reduce((sum, f) => sum + f.size, 0);
    const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📦 TOTAL BUNDLE SIZE: ${totalMB} MB\n`);
    
    if (totalMB > 25) {
        console.log(`⚠️  OVER LIMIT by ${(totalMB - 25).toFixed(2)} MB\n`);
        console.log('🔧 RECOMMENDATIONS:\n');
        
        // Análise de padrões
        const radixCount = functionSizes.filter(f => f.name.includes('admin') || f.name.includes('categorias')).length;
        const apiCount = functionSizes.filter(f => f.name.includes('api')).length;
        
        console.log(`   - Admin functions: ${radixCount} files (likely include Radix UI)\n`);
        console.log(`   - API functions: ${apiCount} files (check for unnecessary UI imports)\n`);
        console.log('   Suggestions:');
        console.log('   1. Remove UI components from API routes');
        console.log('   2. Use dynamic imports for admin components');
        console.log('   3. Consider splitting into multiple workers');
        console.log('   4. Externalize heavy dependencies (radix-ui, zod from server)');
    }
} else {
    console.log('❌ .open-next directory not found. Run "npm run pages:build" first.\n');
}

console.log('='.repeat(80) + '\n');
