'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Phase2Intro from '../../components/phases/Phase2Intro';
import Phase2 from '../../components/phases/Phase2';

export default function Phase2Page() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
  
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

  const handleBeginPhase2 = () => {
    setShowIntro(false);
  };

  return (
    <div className="container mx-auto py-8">
      {showIntro ? (
        <Phase2Intro
          sessionId={sessionId}
          playerId={playerId}
          onBeginPhase2={handleBeginPhase2}
        />
      ) : (
        <Phase2
          sessionId={sessionId}
          playerId={playerId}
        />
      )}
    </div>
  );
}