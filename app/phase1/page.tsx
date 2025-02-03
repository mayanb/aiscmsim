'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Phase1 from '../../components/phases/Phase1';
import { GAME_CONFIG } from '../../config';  // Adjust path as needed


export default function Phase1Page() {
  const router = useRouter();
  
  // Get cookies
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const sessionId = getCookie('sessionId');
  const playerId = getCookie('playerId');

  if (!sessionId || !playerId) {
    router.push('/login');
    return null;
  }

  const handlePhaseComplete = () => {
    router.push('/phase2');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Phase 1: Initial Demand Predictions</h1>
      
      <div className="mb-6">
        <p>Welcome to your first task as a demand planner! In this phase, you'll make {GAME_CONFIG.PHASE_1_DECISIONS} demand predictions for various items.</p>
        <p>For each item, you'll see:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Last year's sales for the same month</li>
          <li>The current month</li>
          <li>The average temperature</li>
        </ul>
      </div>

      <Phase1 
        sessionId={sessionId}
        playerId={playerId}
      />
    </div>
  );
}