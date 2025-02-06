'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Phase2Intro from '../../components/phases/Phase2Intro';
import Phase2 from '../../components/phases/Phase2';
import { GAME_CONFIG } from '../../config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

export default function Phase2Page() {
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

    const hasSeenIntro = localStorage.getItem(`phase2Intro_${pid}`);
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, [router]);

  const handleBeginPhase2 = () => {
    if (playerId) {
      localStorage.setItem(`phase2Intro_${playerId}`, 'true');
      setShowIntro(false);
    }
  };

  if (!sessionId || !playerId) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {showIntro ? (
        <Phase2Intro
          sessionId={sessionId}
          playerId={playerId}
          onBeginPhase2={handleBeginPhase2}
        />
      ) : (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center text-blue-800">Phase 2: Meet Your New AI Assistant</h1>
          
          <Alert className="bg-blue-50">
            <AlertDescription className="text-lg">
              Time to make {GAME_CONFIG.PHASE_2_DECISIONS} predictions with TrendAI&apos;s help. For each product, 
              you&apos;ll see TrendAI&apos;s forecast alongside the market data.
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
                  <li><strong>AI Forecast:</strong> TrendAI&apos;s demand prediction</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Phase2
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