import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '../../lib/supabase';
import { GAME_CONFIG } from '../../config';

interface Phase2IntroProps {
  sessionId: string;
  playerId: string;
  onBeginPhase2: () => void;
}

interface Phase1Decision {
  decision_number: number;
  month: number;
  last_year_sales: number;
  temperature: number;
  actual_demand: number;
  player_prediction: number;
  algorithm_prediction: number;
  player_error: number;
  algorithm_error: number;
}

const Phase2Intro: React.FC<Phase2IntroProps> = ({ sessionId, playerId, onBeginPhase2 }) => {
  const [phase1Data, setPhase1Data] = useState<Phase1Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhase1Data = async () => {
      try {
        // Fetch all Phase 1 items
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('phase', 1)
          .eq('session_id', sessionId)
          .order('decision_number');

        if (itemsError || !items) throw itemsError || new Error('No items found');

        // Fetch player's decisions
        const { data: decisions, error: decisionsError } = await supabase
          .from('decisions')
          .select('*')
          .eq('player_id', playerId);

        if (decisionsError || !decisions) throw decisionsError || new Error('No decisions found');

        // Process and combine the data
        const processedData = items.map(item => {
          const playerDecision = decisions.find(d => d.item_id === item.id);

          return {
            decision_number: item.decision_number,
            month: item.month,
            last_year_sales: item.last_year_sales,
            temperature: item.temperature,
            actual_demand: item.actual_demand,
            player_prediction: playerDecision?.player_prediction || 0,
            algorithm_prediction: item.algorithm_prediction,
            player_error: Math.abs((playerDecision?.player_prediction || 0) - item.actual_demand),
            algorithm_error: Math.abs(item.algorithm_prediction - item.actual_demand)
          };
        });

        setPhase1Data(processedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Phase 1 data:', err);
        setError('Failed to load Phase 1 data');
        setLoading(false);
      }
    };

    fetchPhase1Data();
  }, [sessionId, playerId]);

  const calculateAverageError = (errors: number[]) => {
    return Math.round(errors.reduce((sum, err) => sum + err, 0) / errors.length);
  };

  if (loading) {
    return <div className="text-center p-8">Loading Phase 1 results...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  const algorithmMAE = calculateAverageError(phase1Data.map(d => d.algorithm_error));
  const playerMAE = calculateAverageError(phase1Data.map(d => d.player_error));
  const algorithmBetterCount = phase1Data.filter(d => d.algorithm_error < d.player_error).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-blue-800">Phase 2: Meet Your New AI Assistant</h1>

      <Alert className="bg-blue-50">
        <AlertDescription className="text-lg space-y-4">
          <p>
            While you&apos;ve been working on your forecasts, TRENDY THREADS INC.&apos;s data science team has been busy! 
            Over the past year, they&apos;ve been developing their own AI system called TrendAI, training it on thousands of 
            historical product launches and sales patterns.
          </p>
          <p>
            Impressed by your performance in Phase 1, management has decided to give you early access to TrendAI. 
            They believe combining your expertise with TrendAI&apos;s capabilities could lead to even better demand predictions.
          </p>
        </AlertDescription>
      </Alert>

      <div className="bg-purple-50 p-4 rounded-lg my-4">
        <h3 className="text-md font-semibold mb-2">🔍 What to Watch For in Phase 2:</h3>
        <p className="mb-2">As you analyze the results and prepare for Phase 2, consider:</p>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>AI Performance:</strong> How do TrendAI&apos;s predictions compare to your AI&apos;s?</li>
          <li><strong>Pattern Recognition:</strong> Are there specific months or temperature ranges where one AI consistently outperforms the other?</li>
          <li><strong>Decision Strategy:</strong> How will you decide when to trust TrendAI vs. your own AI&apos;s predictions?</li>
          <li><strong>Collaboration Potential:</strong> Can you identify ways to combine the strengths of both AIs for better predictions?</li>
        </ul>
        <p className="mt-4 text-sm italic">Keep these questions in mind as you review the performance data below - they&apos;ll help guide your strategy in Phase 2!</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your AI vs TrendAI: Phase 1 Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Your AI&apos;s MAE</h3>
              <p className="text-2xl font-bold">{playerMAE.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">TrendAI&apos;s MAE</h3>
              <p className="text-2xl font-bold">{algorithmMAE.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">TrendAI Outperformed In</h3>
              <p className="text-2xl font-bold">{algorithmBetterCount} / {GAME_CONFIG.PHASE_1_DECISIONS} decisions</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="text-md font-semibold mb-2">🤝 Working Together in Phase 2:</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>You&apos;ll see TrendAI&apos;s prediction for each product</li>
              <li>You can use or adjust TrendAI&apos;s prediction based on your judgment</li>
              <li>You&apos;ll make {GAME_CONFIG.PHASE_2_DECISIONS} decisions with TrendAI&apos;s help</li>
            </ul>
          </div>

          <div className="space-y-8">
            <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Demand Predictions Comparison</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={phase1Data} margin={{ top: 5, right: 20, bottom: 45, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="decision_number" 
                    label={{ value: 'Decision Number', position: 'bottom', offset: 0, dy: 2 }}
                    tick={{ dy: 10 }}
                  />
                  <YAxis label={{ value: 'Demand', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Line type="monotone" dataKey="actual_demand" stroke="#4B5563" name="Actual Demand" strokeWidth={2} />
                  <Line type="monotone" dataKey="player_prediction" stroke="#2563EB" name="Your AI" strokeWidth={2} />
                  <Line type="monotone" dataKey="algorithm_prediction" stroke="#DC2626" name="TrendAI" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Prediction Errors Comparison</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={phase1Data} margin={{ top: 5, right: 20, bottom: 45, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="decision_number" 
                    label={{ value: 'Decision Number', position: 'bottom', offset: 0, dy: 2 }}
                    tick={{ dy: 10 }}
                  />
                  <YAxis label={{ value: 'Absolute Error', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Line type="monotone" dataKey="player_error" stroke="#2563EB" name="Your AI Error" strokeWidth={2} />
                  <Line type="monotone" dataKey="algorithm_error" stroke="#DC2626" name="TrendAI Error" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Detailed Phase 1 Results</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Decision</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Last Year&apos;s Sales</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>TrendAI Prediction</TableHead>
                      <TableHead>Your AI Prediction</TableHead>
                      <TableHead>Actual Demand</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phase1Data.map((decision) => (
                      <TableRow key={decision.decision_number}>
                        <TableCell>{decision.decision_number}</TableCell>
                        <TableCell>
                          {new Date(0, decision.month - 1).toLocaleString('default', { month: 'long' })}
                        </TableCell>
                        <TableCell>{Math.round(decision.last_year_sales).toLocaleString()}</TableCell>
                        <TableCell>{Math.round(decision.temperature)}°F</TableCell>
                        <TableCell>{Math.round(decision.algorithm_prediction).toLocaleString()}</TableCell>
                        <TableCell>{Math.round(decision.player_prediction).toLocaleString()}</TableCell>
                        <TableCell>{Math.round(decision.actual_demand).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>



          <div className="mt-8 flex justify-center">
            <Button 
              onClick={onBeginPhase2} 
              className="w-48"
            >
              Begin Phase 2
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase2Intro;