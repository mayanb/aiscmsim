'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { GAME_CONFIG } from '../../config';

// Use dynamic imports with no SSR to avoid hydration issues
const Phase1Intro = dynamic(() => import('../../components/phases/Phase1Intro'), { ssr: false });
const Phase1 = dynamic(() => import('../../components/phases/Phase1'), { ssr: false });

export default function Phase1Page() {
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
      return;
    }
    // Check if user has already seen the intro
    const hasSeenIntro = localStorage.getItem(`phase1Intro_${playerId}`);
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, [sessionId, playerId, router]);

  if (!sessionId || !playerId) {
    return null;
  }

  const handleBeginPhase1 = () => {
    // Store that user has seen the intro
    localStorage.setItem(`phase1Intro_${playerId}`, 'true');
    setShowIntro(false);
  };

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