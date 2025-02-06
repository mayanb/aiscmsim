'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { GAME_CONFIG } from '../../config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div className="container mx-auto py-8 max-w-7xl">
      {showIntro ? (
        <Phase1Intro
          onBeginPhase1={handleBeginPhase1}
        />
      ) : (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-center text-blue-800">Phase 1: Testing Your AI</h1>
          
          <Alert className="bg-blue-50">
            <AlertDescription className="text-lg">
              Time to make {GAME_CONFIG.PHASE_1_DECISIONS} predictions using your AI model to help TRENDY THREADS INC. forecast product demand.
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
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Phase1 
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