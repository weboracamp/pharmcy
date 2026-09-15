import { createClient } from '@supabase/supabase-js';

// Environment variables provided via Vite (import.meta.env)
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    supabaseUrl.startsWith('https://')
  );
};

// Initialized Supabase client instance (or null if unconfigured)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export interface TableCheckResult {
  table: string;
  exists: boolean;
  rlsEnabled: boolean;
  status: number;
  message?: string;
}

/**
 * Utility to verify connection and check which tables exist in the Supabase project
 */
export async function checkTablesStatus(): Promise<{
  connected: boolean;
  tables: TableCheckResult[];
}> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    return { connected: false, tables: [] };
  }

  const schemaTables = [
    'branches',
    'profiles',
    'categories',
    'products',
    'orders',
    'order_items',
    'prescriptions',
    'shifts',
    'sales',
    'stock_logs',
    'notifications_log',
    'stock_transfers'
  ];

  const results: TableCheckResult[] = [];

  for (const table of schemaTables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
        method: 'GET',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`
        }
      });

      if (response.status === 200) {
        // Table exists and query succeeded under RLS
        results.push({
          table,
          exists: true,
          rlsEnabled: true,
          status: 200
        });
      } else if (response.status === 401 || response.status === 403) {
        // Table exists and RLS explicitly blocked access
        results.push({
          table,
          exists: true,
          rlsEnabled: true,
          status: response.status
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        results.push({
          table,
          exists: false,
          rlsEnabled: false,
          status: response.status,
          message: (errorData as { message?: string }).message || 'Table not found in schema cache'
        });
      }
    } catch (err: unknown) {
      results.push({
        table,
        exists: false,
        rlsEnabled: false,
        status: 0,
        message: err instanceof Error ? err.message : 'Network error'
      });
    }
  }

  const anyExists = results.some(r => r.exists);
  return { connected: anyExists, tables: results };
}
