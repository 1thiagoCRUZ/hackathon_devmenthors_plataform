import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws'; 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.warn('Atenção: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env');
}

export const supabase = createClient(supabaseUrl || 'https://dummy.supabase.co', supabaseKey || 'dummy', {
  auth: { persistSession: false },
  realtime: {
    transport: WebSocket
  }
});