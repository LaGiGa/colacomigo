#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { createClient } = require('@supabase/supabase-js')

function parseArgs(argv) {
  const args = {
    dryRun: true,
    limit: 0,
    maxSide: 1600,
    quality: 80,
    minBytes: 450 * 1024,
    onlyBucket: '',
  }

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--execute') args.dryRun = false
    else if (a === '--dry-run') args.dryRun = true
    else if (a.startsWith('--limit=')) args.limit = Number(a.split('=')[1] || 0)
    else if (a.startsWith('--max-side=')) args.maxSide = Number(a.split('=')[1] || 1600)
    else if (a.startsWith('--quality=')) args.quality = Number(a.split('=')[1] || 80)
    else if (a.startsWith('--min-bytes=')) args.minBytes = Number(a.split('=')[1] || args.minBytes)
    else if (a.startsWith('--bucket=')) args.onlyBucket = a.split('=')[1] || ''
  }
  return args
}

function readEnvFile(envPath) {
  const raw = fs.readFileSync(envPath, 'utf8')
  const env = {}
  raw.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith('#')) return
    const idx = line.indexOf('=')
    if (idx <= 0) return
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    env[key] = value
  })
  return env
}

function parseStorageInfo(url) {
  try {
    const u = new URL(url)
    const marker = '/storage/v1/object/public/'
    const idx = u.pathname.indexOf(marker)
    if (idx < 0) return null
    const rest = u.pathname.slice(idx + marker.length)
    const slash = rest.indexOf('/')
    if (slash < 0) return null
    return {
      bucket: rest.slice(0, slash),
      objectPath: rest.slice(slash + 1),
    }
  } catch {
    return null
  }
}

async function main() {
  const args = parseArgs(process.argv)
  const root = process.cwd()
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local não encontrado')
  }

  const env = readEnvFile(envPath)
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local')
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Iniciando migração de imagens existentes')
  console.log(`Modo: ${args.dryRun ? 'DRY RUN (sem update no banco)' : 'EXECUTE (atualiza URL no banco)'}`)
  console.log(`Parâmetros: maxSide=${args.maxSide}, quality=${args.quality}, minBytes=${args.minBytes}, limit=${args.limit || 'sem limite'}`)

  let query = supabase
    .from('product_images')
    .select('id, product_id, url, is_primary')
    .order('id', { ascending: true })

  if (args.limit > 0) query = query.limit(args.limit)

  const { data: rows, error } = await query
  if (error) throw error
  if (!rows || rows.length === 0) {
    console.log('Nenhuma imagem encontrada em product_images.')
    return
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportDir = path.join(root, 'docs', 'reports')
  fs.mkdirSync(reportDir, { recursive: true })
  const reportPath = path.join(reportDir, `image-migration-${stamp}.json`)

  const report = {
    startedAt: new Date().toISOString(),
    args,
    totals: {
      found: rows.length,
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      bytesBefore: 0,
      bytesAfter: 0,
    },
    items: [],
  }

  for (const row of rows) {
    const item = {
      id: row.id,
      product_id: row.product_id,
      original_url: row.url,
      new_url: null,
      status: 'pending',
      reason: '',
      original_bytes: 0,
      optimized_bytes: 0,
    }

    try {
      if (!row.url) {
        item.status = 'skipped'
        item.reason = 'URL vazia'
        report.totals.skipped++
        report.items.push(item)
        continue
      }

      const storageInfo = parseStorageInfo(row.url)
      if (!storageInfo) {
        item.status = 'skipped'
        item.reason = 'URL não é Supabase storage public'
        report.totals.skipped++
        report.items.push(item)
        continue
      }

      if (args.onlyBucket && storageInfo.bucket !== args.onlyBucket) {
        item.status = 'skipped'
        item.reason = `bucket diferente (${storageInfo.bucket})`
        report.totals.skipped++
        report.items.push(item)
        continue
      }

      const imageResp = await fetch(row.url)
      if (!imageResp.ok) {
        item.status = 'error'
        item.reason = `download falhou (${imageResp.status})`
        report.totals.errors++
        report.items.push(item)
        continue
      }

      const originalBuffer = Buffer.from(await imageResp.arrayBuffer())
      item.original_bytes = originalBuffer.length
      report.totals.bytesBefore += originalBuffer.length

      if (originalBuffer.length < args.minBytes) {
        item.status = 'skipped'
        item.reason = `abaixo do minBytes (${originalBuffer.length})`
        report.totals.skipped++
        report.items.push(item)
        continue
      }

      const optimizedBuffer = await sharp(originalBuffer, { failOn: 'none' })
        .rotate()
        .resize({
          width: args.maxSide,
          height: args.maxSide,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: args.quality })
        .toBuffer()

      item.optimized_bytes = optimizedBuffer.length
      report.totals.bytesAfter += optimizedBuffer.length
      report.totals.processed++

      const outPath = `products-optimized/${row.product_id || 'unknown'}/${row.id}-${stamp}.webp`
      const newPublicUrl = `${supabaseUrl}/storage/v1/object/public/${storageInfo.bucket}/${outPath}`
      item.new_url = newPublicUrl

      if (args.dryRun) {
        item.status = 'dry-run'
        item.reason = 'simulação'
        report.items.push(item)
        continue
      }

      const { error: uploadError } = await supabase.storage
        .from(storageInfo.bucket)
        .upload(outPath, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: false,
        })

      if (uploadError) {
        item.status = 'error'
        item.reason = `upload falhou: ${uploadError.message}`
        report.totals.errors++
        report.items.push(item)
        continue
      }

      const { error: updateError } = await supabase
        .from('product_images')
        .update({ url: newPublicUrl })
        .eq('id', row.id)

      if (updateError) {
        item.status = 'error'
        item.reason = `update DB falhou: ${updateError.message}`
        report.totals.errors++
        report.items.push(item)
        continue
      }

      item.status = 'updated'
      item.reason = 'ok'
      report.totals.updated++
      report.items.push(item)
    } catch (e) {
      item.status = 'error'
      item.reason = e instanceof Error ? e.message : String(e)
      report.totals.errors++
      report.items.push(item)
    }
  }

  report.finishedAt = new Date().toISOString()
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')

  const savings = report.totals.bytesBefore > 0
    ? ((1 - report.totals.bytesAfter / report.totals.bytesBefore) * 100).toFixed(2)
    : '0.00'

  console.log('---')
  console.log(`Relatório salvo em: ${reportPath}`)
  console.log(`Total imagens encontradas: ${report.totals.found}`)
  console.log(`Processadas (grandes): ${report.totals.processed}`)
  console.log(`Atualizadas: ${report.totals.updated}`)
  console.log(`Ignoradas: ${report.totals.skipped}`)
  console.log(`Erros: ${report.totals.errors}`)
  console.log(`Bytes antes: ${report.totals.bytesBefore}`)
  console.log(`Bytes depois: ${report.totals.bytesAfter}`)
  console.log(`Economia estimada: ${savings}%`)
}

main().catch((err) => {
  console.error('Falha na migração:', err)
  process.exit(1)
})
