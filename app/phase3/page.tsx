'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Phase3Intro from '../../components/phases/Phase3Intro';
import Phase3 from '../../components/phases/Phase3';
import { GAME_CONFIG } from '../../config';

export default function Phase3Page() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
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
      return;
    }

    const hasSeenIntro = localStorage.getItem(`phase3Intro_${pid}`);
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, [router]);

  const handleBeginPhase3 = () => {
    if (playerId) {
      localStorage.setItem(`phase3Intro_${playerId}`, 'true');
      setShowIntro(false);
    }
  };

  if (!sessionId || !playerId) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      {showIntro ? (
        <Phase3Intro
          sessionId={sessionId}
          playerId={playerId}
          onBeginPhase3={handleBeginPhase3}
        />
      ) : (
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold mb-6">Phase 3: Private Information Demand Predictions</h1>

          <div className="mb-6">
            <p>Welcome to your third task as a demand planner! In this phase, you&apos;ll make {GAME_CONFIG.PHASE_3_DECISIONS} demand predictions for various items.</p>
            <p>For each item, you&apos;ll see:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Last year&apos;s sales for the same month (used by the algorithm)</li>
              <li>The current month (used by the algorithm)</li>
              <li>The average temperature (used by the algorithm)</li>
              <li>The focus group&apos;s sentiment score (not given to the algorithm)</li>
              <li>Your company algorithm&apos;s demand forecast</li>
            </ul>
            <Phase3
              sessionId={sessionId}
              playerId={playerId}
            />
          </div>
        </div>
      )}
    </div>
  );
}