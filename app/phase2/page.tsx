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
    // Check if user has already seen the intro
    const hasSeenIntro = localStorage.getItem(`phase2Intro_${playerId}`);
    if (hasSeenIntro) {
        setShowIntro(false);
    }
    
  }, [sessionId, playerId, router]);

  if (!sessionId || !playerId) {
    return null;
  }

  const handleBeginPhase2 = () => {
    // Store that user has seen the intro
    localStorage.setItem(`phase2Intro_${playerId}`, 'true');
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
        <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Phase 2: Algorithm-Based Demand Predictions</h1>

        <div className="mb-6">
        <p>Welcome to your second task as a demand planner! In this phase, you'll make 15 demand predictions for various items.</p>
        <p>For each item, you'll see:</p>
        <ul className="list-disc ml-6 mt-2">
            <li>Last year's sales for the same month</li>
            <li>The current month</li>
            <li>The average temperature</li>
            <li>Your company algorithm's demand forecast</li>
        </ul>
        <Phase2
          sessionId={sessionId}
          playerId={playerId}
        />
        </div></div>
      )}
    </div>
  );
}


