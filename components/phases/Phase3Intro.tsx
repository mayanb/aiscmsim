import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '../../lib/supabase';
import { GAME_CONFIG } from '../../config';  // Adjust path as needed

interface Phase3IntroProps {
  sessionId: string;
  playerId: string;
  onBeginPhase3: () => void;
}

interface Phase2Decision {
  decision_number: number;
  month: number;
  last_year_sales: number;
  temperature: number;
  sentiment_score: number;
  actual_demand: number;
  player_prediction: number;
  algorithm_prediction: number;
  player_error: number;
  algorithm_error: number;
}

const Phase3Intro: React.FC<Phase3IntroProps> = ({ sessionId, playerId, onBeginPhase3 }) => {
  const [phase2Data, setPhase2Data] = useState<Phase2Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhase2Data = async () => {
      try {
        // Fetch all Phase 2 items
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('phase', 2)
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
            sentiment_score: item.social_sentiment,
            actual_demand: item.actual_demand,
            player_prediction: playerDecision?.player_prediction || 0,
            algorithm_prediction: item.algorithm_prediction,
            player_error: Math.abs((playerDecision?.player_prediction || 0) - item.actual_demand),
            algorithm_error: Math.abs(item.algorithm_prediction - item.actual_demand)
          };
        });

        setPhase2Data(processedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Phase 2 data:', err);
        setError('Failed to load Phase 2 data');
        setLoading(false);
      }
    };

    fetchPhase2Data();
  }, [sessionId, playerId]);

  const calculateAverageError = (errors: number[]) => {
    return Math.round(errors.reduce((sum, err) => sum + err, 0) / errors.length);
  };

  if (loading) {
    return <div className="text-center p-8">Loading Phase 2 results...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  const algorithmMAE = calculateAverageError(phase2Data.map(d => d.algorithm_error));
  const playerMAE = calculateAverageError(phase2Data.map(d => d.player_error));
  const algorithmBetterCount = phase2Data.filter(d => d.algorithm_error < d.player_error).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Alert className="bg-blue-50">
        <AlertDescription className="text-lg space-y-4">
          <p>
            Welcome to Phase 3! This time, you'll be able to observe some additional private information 
            that the company's algorithm does not have access to.
          </p>
          <p>
            You&apos;ve started polling focus groups on how much they like each product. From them, you calculate 
            your own sentiment score (from -10 to 10) based on how much the focus group likes the product.
          </p>
          <p>
            You&apos;ve shown the focus groups the products that you just made forecasts for and obtained their 
            sentiment scores for those products. Look at the data below and see how the focus group's 
            sentiment score might be helpful in making your own demand predictions or in adjusting the 
            algorithm&apos;s demand predictions.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Phase 2 Performance Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Your Average Error</h3>
              <p className="text-2xl font-bold">{playerMAE.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Algorithm Average Error</h3>
              <p className="text-2xl font-bold">{algorithmMAE.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Algorithm Performed Better In</h3>
              <p className="text-2xl font-bold">{algorithmBetterCount} / {GAME_CONFIG.PHASE_2_DECISIONS} decisions</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Phase 2 Results with Focus Group Sentiment</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Decision</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Last Year Sales</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead className="font-bold">Focus Group Sentiment</TableHead>
                      <TableHead>Algorithm Prediction</TableHead>
                      <TableHead>Your Prediction</TableHead>
                      <TableHead>Actual Demand</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phase2Data.map((decision) => (
                      <TableRow key={decision.decision_number}>
                        <TableCell>{decision.decision_number}</TableCell>
                        <TableCell>
                          {new Date(0, decision.month - 1).toLocaleString('default', { month: 'long' })}
                        </TableCell>
                        <TableCell>{Math.round(decision.last_year_sales).toLocaleString()}</TableCell>
                        <TableCell>{Math.round(decision.temperature)}°F</TableCell>
                        <TableCell className="font-bold">
                          {Math.round(decision.sentiment_score)}
                        </TableCell>
                        <TableCell>{Math.round(decision.algorithm_prediction).toLocaleString()}</TableCell>
                        <TableCell>{Math.round(decision.player_prediction).toLocaleString()}</TableCell>
                        <TableCell>{Math.round(decision.actual_demand).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="h-96">
              <h3 className="text-lg font-semibold mb-4">Sentiment Score vs Algorithm&apos;s Prediction Error</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, right: 20, bottom: 45, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="sentiment_score"
                    type="number"
                    domain={[-10, 10]}
                    label={{ value: 'Focus Group Sentiment Score', position: 'bottom', offset: 25 }}
                    tick={{ dy: 10 }}
                  />
                  <YAxis 
                    label={{ value: 'Algorithm Error', angle: -90, position: 'insideLeft', offset: -10 }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm">Sentiment: {data.sentiment_score}</p>
                            <p className="text-sm">Error: {Math.round(data.algorithm_error).toLocaleString()}</p>
                            <p className="text-sm">Algorithm Prediction: {Math.round(data.algorithm_prediction).toLocaleString()}</p>
                            <p className="text-sm">Actual Demand: {Math.round(data.actual_demand).toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    data={phase2Data.sort((a, b) => a.sentiment_score - b.sentiment_score)}
                    dataKey="algorithm_error"
                    fill="#DC2626"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <Button 
              onClick={onBeginPhase3} 
              className="w-48"
            >
              Begin Phase 3
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase3Intro;