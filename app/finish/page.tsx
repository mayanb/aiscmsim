'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GameFinish from '../../components/GameFinish';

export default function FinishPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const sid = getCookie('sessionId');
    const pid = getCookie('playerId');

    setSessionId(sid || null);
    setPlayerId(pid || null);

    if (!sid || !pid) {
      router.push('/login');
    }
  }, [router]);

  if (!sessionId || !playerId) {
    return null;
  }

  return (
    <div>
      <GameFinish
        sessionId={sessionId}
        playerId={playerId}
      />
    </div>
  );
}