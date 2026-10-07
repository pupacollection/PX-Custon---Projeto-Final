// PX CUSTOM — Supabase Integration Client & Storage Facade
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseStorageConfig } from './supabaseStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface SupabaseConfigState {
  isConfigured: boolean;
  url: string | null;
  hasAnonKey: boolean;
}

export const getSupabaseConfig = (): SupabaseConfigState => {
  const url = import.meta.env.VITE_SUPABASE_URL || null;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || null;

  return {
    isConfigured: Boolean(url && anonKey),
    url,
    hasAnonKey: Boolean(anonKey),
  };
};

/**
 * Instância oficial do cliente Supabase para o Frontend do PX CUSTOM.
 * Utiliza estritamente a chave anônima (VITE_SUPABASE_ANON_KEY).
 * NUNCA utilize service_role, secrets ou tokens administrativos no client-side.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

// Informational helper for PX CONTROL admin settings
export const SUPABASE_STATUS = {
  configured: Boolean(supabaseUrl && supabaseAnonKey),
  message: Boolean(supabaseUrl && supabaseAnonKey)
    ? 'Supabase Conectado (Armazenamento permanente e Auth ativado)'
    : 'Modo de demonstração: Supabase Storage não conectado. Imagens salvas localmente nesta sessão.',
};

export * from './supabaseStorage';

