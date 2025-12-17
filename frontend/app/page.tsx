'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const token = document.cookie.includes('onthego_token');
    const session = localStorage.getItem('onthego_session');

    if (user || token || session) {
      router.replace('/dashboard');
    } else {
      router.replace('/landing');
    }
  }, [user, router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#0a0a0c'
    }}>
      <div style={{ color: 'white' }}>Loading...</div>
    </div>
  );
}
