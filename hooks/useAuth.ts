import { useEffect, useState } from 'react';

export function useAuth() {
  const [accountId, setAccountId] = useState<string>('iaclub-default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Integrar com autenticação real (Supabase Auth, etc)
    // Por enquanto, usa um accountId padrão para IA Club
    const id = localStorage.getItem('accountId') || 'iaclub-default';
    setAccountId(id);
    setLoading(false);
  }, []);

  return {
    accountId,
    loading,
  };
}
