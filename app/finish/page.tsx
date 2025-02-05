'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import GameFinish from '../../components/GameFinish';

export default function FinishPage() {
    const router = useRouter();
    
    // Get cookies
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };
  
    const sessionId = getCookie('sessionId');
    const playerId = getCookie('playerId');
  
    useEffect(() => {
      if (!sessionId || !playerId) {
        router.push('/login');
      }
      
    }, [sessionId, playerId, router]);
  
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