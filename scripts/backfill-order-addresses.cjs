const { createClient } = require('@supabase/supabase-js')

const isExecute = process.argv.includes('--execute')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : 500

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!Number.isFinite(limit) || limit <= 0) {
  console.error('Invalid --limit value.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

function pickBestAddress(order, addresses) {
  if (!addresses || addresses.length === 0) return null
  const orderTs = new Date(order.created_at).getTime()

  const olderOrSame = addresses.find((addr) => new Date(addr.created_at).getTime() <= orderTs)
  if (olderOrSame) return olderOrSame

  return addresses[0]
}

async function main() {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, user_id, address_id, created_at, customer_name, customer_email')
    .is('address_id', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (ordersError) {
    throw ordersError
  }

  if (!orders || orders.length === 0) {
    console.log('No orders without address_id found.')
    return
  }

  const ordersWithUser = orders.filter((order) => Boolean(order.user_id))
  const ordersWithoutUser = orders.length - ordersWithUser.length
  const userIds = [...new Set(ordersWithUser.map((order) => order.user_id))]

  const { data: addresses, error: addrError } = await supabase
    .from('addresses')
    .select('id, user_id, street, number, neighborhood, city, state, zip_code, created_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })

  if (addrError) {
    throw addrError
  }

  const addressesByUser = new Map()
  for (const address of addresses || []) {
    const list = addressesByUser.get(address.user_id) || []
    list.push(address)
    addressesByUser.set(address.user_id, list)
  }

  const candidates = []
  const unresolved = []

  for (const order of ordersWithUser) {
    const options = addressesByUser.get(order.user_id) || []
    const chosen = pickBestAddress(order, options)
    if (!chosen) {
      unresolved.push(order)
      continue
    }

    candidates.push({
      orderId: order.id,
      userId: order.user_id,
      addressId: chosen.id,
      orderCreatedAt: order.created_at,
      addressCreatedAt: chosen.created_at,
      preview: `${chosen.street}, ${chosen.number} - ${chosen.city}/${chosen.state} (${chosen.zip_code})`,
    })
  }

  console.log(`Mode: ${isExecute ? 'EXECUTE' : 'DRY-RUN'}`)
  console.log(`Scanned orders (without address): ${orders.length}`)
  console.log(`Candidates to link: ${candidates.length}`)
  console.log(`Unresolved (user has no address): ${unresolved.length}`)
  console.log(`Unresolved (order without user_id): ${ordersWithoutUser}`)

  if (candidates.length > 0) {
    console.log('\nSample candidates:')
    candidates.slice(0, 20).forEach((item) => {
      console.log(`- order ${item.orderId.slice(0, 8)} -> address ${item.addressId.slice(0, 8)} | ${item.preview}`)
    })
  }

  if (!isExecute || candidates.length === 0) {
    console.log('\nDry-run finished. Re-run with --execute to persist changes.')
    return
  }

  let updated = 0
  for (const item of candidates) {
    const { error } = await supabase
      .from('orders')
      .update({ address_id: item.addressId })
      .eq('id', item.orderId)

    if (!error) updated += 1
    else console.error(`Failed to update order ${item.orderId}:`, error.message)
  }

  console.log(`\nBackfill complete. Updated orders: ${updated}/${candidates.length}`)
}

main().catch((error) => {
  console.error('Backfill failed:', error)
  process.exit(1)
})
