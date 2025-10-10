// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshAccessStatus, accessStatus } = useAuth();

  useEffect(() => {
    (async () => {
      // Tukar code → session (wajib untuk PKCE)
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        console.error('exchangeCodeForSession error', error);
        navigate('/login', { replace: true });
        return;
      }

      // Ambil akses dari server
      await refreshAccessStatus();

      // Tentukan ke mana redirect
      const params = new URLSearchParams(location.search);
      const slugFromQuery = params.get('tenant');
      const fallbackSlug = slugFromQuery
        || accessStatus?.memberships?.[0]?.tenant_slug
        || 'kopipendekar';

      // Super admin boleh ke sadmin (opsional)
      // if (accessStatus?.is_super_admin) return nav('/sadmin/dashboard', { replace: true });

      navigate(`/${fallbackSlug}/admin/dashboard`, { replace: true });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div style={{padding:16}}>Signing you in…</div>;
}
