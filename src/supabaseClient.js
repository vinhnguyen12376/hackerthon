import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgfcsfippojavbysvurn.supabase.co';
const supabaseAnonKey = 'sb_publishable_aoKop1vGMk_yCzh6wOHnfg_KsEz3Lm6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
