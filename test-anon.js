
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);
async function test() {
  const { data, error } = await supabase.from('categories').select('*');
  console.log(data, error);
}
test();
