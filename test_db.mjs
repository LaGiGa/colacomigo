import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const sql = `
  CREATE TABLE IF NOT EXISTS store_settings (
    id smallint PRIMARY KEY DEFAULT 1,
    announcements jsonb NOT NULL DEFAULT '[]',
    recent_purchaser_names jsonb NOT NULL DEFAULT '[]',
    updated_at timestamptz DEFAULT now()
  );

  INSERT INTO store_settings (id, announcements, recent_purchaser_names)
  VALUES (
    1,
    '["🔥 PARCELAMOS EM ATÉ 12X SEM JUROS NO CARTÃO", "📦 ENTREGA VIA PAC E SEDEX PARA TODO O BRASIL", "🏪 RETIRE NA LOJA EM PALMAS-TO SEM CUSTO ADICIONAL", "🛵 ENTREGA EM PALMAS-TO POR APENAS R$15,00", "💬 ATENDIMENTO VIA WHATSAPP: (63) 99131-2913", "💳 PIX COM 5% DE DESCONTO EM TODOS OS PRODUTOS"]'::jsonb,
    '["João S.", "Maria C.", "Pedro H.", "Ana Clara", "Lucas M.", "Bruna F.", "Rafael G.", "Fernanda T.", "Diego V.", "Camila P."]'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

  ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Settings are viewable by everyone" ON store_settings;

  CREATE POLICY "Settings are viewable by everyone" 
  ON store_settings FOR SELECT 
  USING (true);

  `;
    const { error } = await supabase.rpc('exec_sql', { sql });
    console.log('Error?', error);
}

check();
