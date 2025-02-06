'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Phase3Intro from '../../components/phases/Phase3Intro';
import Phase3 from '../../components/phases/Phase3';
import { GAME_CONFIG } from '../../config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="container mx-auto py-8 max-w-7xl">
      {showIntro ? (
        <Phase3Intro
          sessionId={sessionId}
          playerId={playerId}
          onBeginPhase3={handleBeginPhase3}
        />
      ) : (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center text-blue-800">Phase 3: Your Secret Weapon</h1>
          
          <Alert className="bg-blue-50">
            <AlertDescription className="text-lg">
              Time to make {GAME_CONFIG.PHASE_3_DECISIONS} predictions with both TrendAI&apos;s help and your focus group insights. 
              Remember - you have information that TrendAI doesn&apos;t!
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold mb-2">📊 For Each Product, You&apos;ll See:</h3>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>Historical Sales:</strong> Last year&apos;s average monthly sales for this product line</li>
                  <li><strong>Seasonality:</strong> The current month we&apos;re forecasting for</li>
                  <li><strong>Weather Impact:</strong> Average temperature for the current month</li>
                  <li><strong>TrendAI Forecast:</strong> TrendAI&apos;s demand prediction</li>
                  <li className="text-blue-800 font-semibold">
                    <strong>Focus Group Score:</strong> Customer sentiment rating (-10 to +10) 
                    <span className="text-blue-600 italic ml-2">- Information only you have!</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Phase3
                sessionId={sessionId}
                playerId={playerId}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}