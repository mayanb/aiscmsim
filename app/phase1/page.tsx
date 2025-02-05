'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { GAME_CONFIG } from '../../config';

const Phase1Intro = dynamic(() => import('../../components/phases/Phase1Intro'), { ssr: false });
const Phase1 = dynamic(() => import('../../components/phases/Phase1'), { ssr: false });

export default function Phase1Page() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  useEffect(() => {
    // Move cookie logic into useEffect
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
      return;
    }

    // Check if user has already seen the intro
    const hasSeenIntro = localStorage.getItem(`phase1Intro_${pid}`);
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, [router]);

  const handleBeginPhase1 = () => {
    if (playerId) {
      localStorage.setItem(`phase1Intro_${playerId}`, 'true');
      setShowIntro(false);
    }
  };

  if (!sessionId || !playerId) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      {showIntro ? (
        <Phase1Intro
          onBeginPhase1={handleBeginPhase1}
        />
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-6">Phase 1: Initial Demand Predictions</h1>
          
          <div className="mb-6">
            <p>Make your predictions for {GAME_CONFIG.PHASE_1_DECISIONS} different items.</p>
            <p>For each item, you will see:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Last year&apos;s sales for the same month</li>
              <li>The current month</li>
              <li>The average temperature</li>
            </ul>
          </div>

          <Phase1 
            sessionId={sessionId}
            playerId={playerId}
          />
        </div>
      )}
    </div>
  );
}