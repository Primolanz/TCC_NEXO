const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const legacyKey = process.env.SUPABASE_KEY;
const legacyKeyRole = (() => {
  try {
    const payload = legacyKey?.split('.')[1];
    return payload ? JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role : null;
  } catch {
    return null;
  }
})();
const supabaseKey = serviceRoleKey || (legacyKeyRole === 'service_role' ? legacyKey : null);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou uma SUPABASE_KEY legada com role service_role) devem estar configuradas para operações administrativas.');
}

module.exports = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
