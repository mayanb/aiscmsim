import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GAME_CONFIG } from '../../config';

interface Phase1IntroProps {
  onBeginPhase1: () => void;
}

const Phase1Intro: React.FC<Phase1IntroProps> = ({ onBeginPhase1 }) => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Alert className="bg-blue-50">
        <AlertDescription className="text-lg">
          Welcome to your first task as a demand planner! You&apos;ll be making predictions about product demand based on historical data and other factors.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Your Role as a Demand Planner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Task Overview</h3>
            <p>In Phase 1, you will make {GAME_CONFIG.PHASE_1_DECISIONS} demand predictions for various items.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Available Information</h3>
            <p>For each decision, you&apos;ll receive:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Last year&apos;s sales for the same month</li>
              <li>The current month</li>
              <li>The average temperature</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Your Goal</h3>
            <p>Your objective is to predict the demand as accurately as possible. After each phase, you&apos;ll be able to see:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>How close your predictions were to the actual demand</li>
              <li>Your average prediction error</li>
              <li>Detailed performance analysis</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Tips for Success</h3>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Consider how seasonal factors might affect demand</li>
              <li>Think about the relationship between temperature and sales</li>
              <li>Look for patterns in the historical data</li>
            </ul>
          </div>

          <div className="mt-16 flex justify-center">
            <Button 
              onClick={onBeginPhase1} 
              className="w-48"
            >
              Begin Phase 1
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase1Intro;