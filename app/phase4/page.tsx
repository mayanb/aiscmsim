'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Phase4Intro from '../../components/phases/Phase4Intro';
import Phase4 from '../../components/phases/Phase4';
import { GAME_CONFIG } from '../../config';  // Adjust path as needed

export default function Phase4Page() {
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
    // Check if user has already seen the intro
    const hasSeenIntro = localStorage.getItem(`phase4Intro_${playerId}`);
    if (hasSeenIntro) {
        setShowIntro(false);
    }
    
  }, [sessionId, playerId, router]);

  if (!sessionId || !playerId) {
    return null;
  }

  const handleBeginPhase4 = () => {
    // Store that user has seen the intro
    localStorage.setItem(`phase4Intro_${playerId}`, 'true');
    setShowIntro(false);
  };

  return (
    <div className="container mx-auto py-8">
      {showIntro ? (
        <Phase4Intro
          sessionId={sessionId}
          playerId={playerId}
          onBeginPhase4={handleBeginPhase4}
        />
      ) : (
        <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Phase 4: Regime Shift Demand Predictions</h1>

        <div className="mb-6">
        <p>Welcome to your fourth and final task as a demand planner! In this phase, you&apos;ll make {GAME_CONFIG.PHASE_4_DECISIONS} demand predictions for various items.</p>
        <p>For each item, you&apos;ll see:</p>
        <ul className="list-disc ml-6 mt-2">
            <li>Last year&apos;s sales for the same month (used by the algorithm)</li>
            <li>The current month (used by the algorithm)</li>
            <li>The average temperature (used by the algorithm)</li>
            <li>The amount of online traffic - daily visits to the product&apos;s page (not given to the algorithm)</li>
            <li>The amount of money spent on advertising (not given to the algorithm)</li>
            {/* <li>The focus group&apos;s sentiment score (not given to the algorithm)</li> */}
            <li>Your company algorithm&apos;s demand forecast</li>
            <li>Your company algorithm&apos;s confidence score</li>
        </ul>
        <Phase4
          sessionId={sessionId}
          playerId={playerId}
        />
        </div></div>
      )}
    </div>
  );
}


