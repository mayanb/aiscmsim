import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '../../lib/supabase';
import { GAME_CONFIG } from '../../config';  // Adjust path as needed

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
      <Alert className="bg-blue-50">
        <AlertDescription className="text-lg">
          Welcome to Phase 2! Your company has developed an AI algorithm to assist with demand forecasting.
          Let&apos;s examine how it would have performed on your Phase 1 decisions.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
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
              <p className="text-2xl font-bold">{algorithmBetterCount} / {GAME_CONFIG.PHASE_1_DECISIONS} decisions</p>
            </div>
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
                  <Line type="monotone" dataKey="player_prediction" stroke="#2563EB" name="Your Prediction" strokeWidth={2} />
                  <Line type="monotone" dataKey="algorithm_prediction" stroke="#DC2626" name="Algorithm Prediction" strokeWidth={2} />
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
                  <Line type="monotone" dataKey="player_error" stroke="#2563EB" name="Your Error" strokeWidth={2} />
                  <Line type="monotone" dataKey="algorithm_error" stroke="#DC2626" name="Algorithm Error" strokeWidth={2} />
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
                      <TableHead>Last Year Sales</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>Algorithm Prediction</TableHead>
                      <TableHead>Your Prediction</TableHead>
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

          <div className="mt-16 flex justify-center">
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