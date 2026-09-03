#!/usr/bin/env node
/**
 * purge_rogue_admins.cjs
 * Expurgo imediato das contas invasoras identificadas na auditoria forense.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ ERRO: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const ROGUE_USER_IDS = [
    '06895619-f66a-4810-9e33-fc1daf20cc11', // ricardoreal.dev@gmail.com
    'e7e9cd65-81b1-4d1f-943d-0a5e1175a81e', // novyiok799@gmail.com
    '5da7534a-b94d-433c-9381-b9c5e57e459d', // gabriel.r.c.f1205@gmail.com
];

const LEGIT_ADMIN_EMAIL = 'colacomigoshop@gmail.com';

async function run() {
    console.log('🚨 Iniciando operação de expurgo de contas invasoras...\n');

    // 1. Purgar cada conta invasora do Auth e de Profiles
    for (const id of ROGUE_USER_IDS) {
        console.log(`🔍 Processando invasor ID: ${id}...`);
        
        // Deletar da tabela profiles
        const { error: profileErr } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);
        if (profileErr) {
            console.warn(`  ⚠ Falha ao remover profile ${id}:`, profileErr.message);
        } else {
            console.log(`  ✓ Perfil ${id} removido da tabela profiles.`);
        }

        // Deletar do Supabase Auth (remove sessões, refresh tokens e credenciais)
        const { error: authErr } = await supabase.auth.admin.deleteUser(id);
        if (authErr) {
            console.warn(`  ⚠ Falha ao deletar auth user ${id}:`, authErr.message);
        } else {
            console.log(`  ✓ Usuário ${id} deletado permanentemente do Supabase Auth.`);
        }
    }

    // 2. Assegurar que qualquer outro profile com role='admin' que não seja o legítimo seja rebaixado
    console.log('\n🔒 Verificando todos os perfis restantes com role="admin"...');
    const { data: adminProfiles, error: listErr } = await supabase
        .from('profiles')
        .select('id, role, is_admin');

    if (listErr) {
        console.error('❌ Erro ao listar perfis:', listErr);
    } else {
        for (const p of adminProfiles) {
            const { data: userData } = await supabase.auth.admin.getUserById(p.id);
            const email = userData?.user?.email?.toLowerCase();

            if (email === LEGIT_ADMIN_EMAIL) {
                // Assegura que o admin legítimo tem role='admin' e is_admin=true
                await supabase
                    .from('profiles')
                    .update({ role: 'admin', is_admin: true })
                    .eq('id', p.id);
                console.log(`  👑 Admin legítimo confirmado: ${email} (ID: ${p.id})`);
            } else if (p.role === 'admin' || p.is_admin === true) {
                // Rebaixar qualquer conta desconhecida que tenha conseguido admin
                console.warn(`  🚨 REBAIXANDO CONTA NÃO AUTORIZADA: ${email || p.id}`);
                await supabase
                    .from('profiles')
                    .update({ role: 'customer', is_admin: false })
                    .eq('id', p.id);
            }
        }
    }

    console.log('\n✅ Operação de expurgo e saneamento concluída com sucesso!');
}

run().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
