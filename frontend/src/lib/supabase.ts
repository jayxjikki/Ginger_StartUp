// ═══════════════════════════════════════════════════════════
// GINGER — Supabase Client Initialization
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

let refreshPromise: Promise<string | null> | null = null;

const customFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const isAuthRequest = url.includes('/auth/v1/');

  const response = await fetch(input, init);

  // If response is 401 Unauthorized on non-auth endpoints (e.g. PostgREST REST API)
  if (response.status === 401 && !isAuthRequest) {
    let isJwtExpired = false;
    try {
      const clone = response.clone();
      const body = await clone.json();
      if (
        body?.code === 'PGRST303' ||
        (typeof body?.message === 'string' && /jwt expired/i.test(body.message)) ||
        (typeof body?.error === 'string' && /jwt expired/i.test(body.error))
      ) {
        isJwtExpired = true;
      }
    } catch {
      isJwtExpired = true;
    }

    if (isJwtExpired) {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error || !data?.session) {
              console.warn('Session refresh failed due to expired/revoked refresh token:', error?.message);
              await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
              if (typeof window !== 'undefined') {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                  const key = localStorage.key(i);
                  if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
                    localStorage.removeItem(key);
                  }
                }
                window.dispatchEvent(new CustomEvent('supabase:jwt-expired'));
              }
              return null;
            }
            return data.session.access_token;
          } catch {
            return null;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const newToken = await refreshPromise;
      if (newToken) {
        // Retry the original request with the fresh token
        const newInit: RequestInit = { ...init };
        const headers = new Headers(newInit.headers || (input instanceof Request ? input.headers : undefined));
        headers.set('Authorization', `Bearer ${newToken}`);
        newInit.headers = headers;
        return fetch(input, newInit);
      } else {
        // Refresh token failed. Fall back to anon key so public data (like campaigns) still loads!
        const newInit: RequestInit = { ...init };
        const headers = new Headers(newInit.headers || (input instanceof Request ? input.headers : undefined));
        headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
        headers.set('apikey', supabaseAnonKey);
        newInit.headers = headers;
        return fetch(input, newInit);
      }
    }
  }

  return response;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch,
  },
});

export default supabase;
