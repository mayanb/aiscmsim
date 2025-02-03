import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

interface Phase3SummaryProps {
  sessionId: string;
  playerId: string;
}

interface DecisionData {
  decision_number: number;
  month: number;
  last_year_sales: number;
  temperature: number;
  social_sentiment: number;
  actual_demand: number;
  player_prediction: number;
  algorithm_prediction: number;
  player_error: number;
  algorithm_error: number;
  algorithm_deviation: number;
}

const Phase3Summary: React.FC<Phase3SummaryProps> = ({ sessionId, playerId }) => {
  const router = useRouter();
  const [decisions, setDecisions] = useState<DecisionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhase3Data = async () => {
      try {
        // Fetch all Phase 3 items
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('phase', 3)
          .eq('session_id', sessionId)
          .order('decision_number');

        if (itemsError || !items) throw itemsError || new Error('No items found');

        // Fetch player's decisions
        const { data: playerDecisions, error: decisionsError } = await supabase
          .from('decisions')
          .select('*')
          .eq('player_id', playerId);

        if (decisionsError || !playerDecisions) throw decisionsError || new Error('No decisions found');

        // Process and combine the data
        const processedData = items.map(item => {
          const playerDecision = playerDecisions.find(d => d.item_id === item.id);
          const player_prediction = playerDecision?.player_prediction || 0;

          return {
            decision_number: item.decision_number,
            month: item.month,
            last_year_sales: item.last_year_sales,
            temperature: item.temperature,
            social_sentiment: item.social_sentiment,
            actual_demand: item.actual_demand,
            player_prediction,
            algorithm_prediction: item.algorithm_prediction,
            player_error: Math.abs(player_prediction - item.actual_demand),
            algorithm_error: Math.abs(item.algorithm_prediction - item.actual_demand),
            algorithm_deviation: Math.abs(player_prediction - item.algorithm_prediction)
          };
        });

        setDecisions(processedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Phase 3 data:', err);
        setError('Failed to load Phase 3 data');
        setLoading(false);
      }
    };

    fetchPhase3Data();
  }, [sessionId, playerId]);

  const calculateAverageError = (errors: number[]) => {
    return Math.round(errors.reduce((sum, err) => sum + err, 0) / errors.length);
  };

  if (loading) {
    return <div className="text-center p-8">Loading Phase 3 results...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  const playerMAE = calculateAverageError(decisions.map(d => d.player_error));
  const algorithmMAE = calculateAverageError(decisions.map(d => d.algorithm_error));
  const algorithmBetterCount = decisions.filter(d => d.algorithm_error < d.player_error).length;
  const averageDeviation = calculateAverageError(decisions.map(d => d.algorithm_deviation));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Alert className="bg-blue-50">
        <AlertDescription className="text-lg">
          Phase 3 Complete! Let's analyze how you performed using both the algorithm's predictions and the focus group sentiment data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-8">
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
              <p className="text-2xl font-bold">{algorithmBetterCount} / 20 decisions</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Average Deviation from Algorithm</h3>
              <p className="text-2xl font-bold">{averageDeviation.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-12">
            <div className="h-96 mb-16">
              <h3 className="text-lg font-semibold mb-4">Prediction Errors Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={[...decisions].sort((a, b) => a.decision_number - b.decision_number)} 
                  margin={{ top: 5, right: 30, bottom: 55, left: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="decision_number" 
                    label={{ value: 'Decision Number', position: 'bottom', offset: 35 }}
                    tick={{ dy: 20 }}
                  />
                  <YAxis label={{ value: 'Absolute Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="player_error" stroke="#2563EB" name="Your Error" strokeWidth={2} />
                  <Line type="monotone" dataKey="algorithm_error" stroke="#DC2626" name="Algorithm Error" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 mb-16">
              <h3 className="text-lg font-semibold mb-4">Algorithm Deviation Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={[...decisions].sort((a, b) => a.decision_number - b.decision_number)} 
                  margin={{ top: 5, right: 30, bottom: 55, left: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="decision_number" 
                    label={{ value: 'Decision Number', position: 'bottom', offset: 35 }}
                    tick={{ dy: 20 }}
                  />
                  <YAxis label={{ value: 'Deviation from Algorithm', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="algorithm_deviation" stroke="#2563EB" name="Your Deviation" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 mb-28">
              <h3 className="text-lg font-semibold mb-4">Sentiment Score vs Algorithm Absolute Error</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 55, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="social_sentiment"
                    type="number"
                    domain={[-10, 10]}
                    name="Sentiment Score"
                    label={{ value: 'Sentiment Score', position: 'bottom', offset: 35 }}
                  />
                  <YAxis 
                    type="number"
                    domain={[0, 'auto']}
                    label={{ value: 'Algorithm Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm">Sentiment: {data.social_sentiment.toFixed(1)}</p>
                            <p className="text-sm">Algorithm Absolute Error: {Math.round(data.algorithm_error).toLocaleString()}</p>
                            <p className="text-sm">Decision: {data.decision_number}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="Algorithm Error"
                    data={decisions.sort((a, b) => a.social_sentiment - b.social_sentiment)}
                    fill="#DC2626"
                    dataKey="algorithm_error"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>


            <div className="h-96 mb-28">
              <h3 className="text-lg font-semibold mb-4">Sentiment Score vs Algorithm Absolute Deviation</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 55, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="social_sentiment"
                    type="number"
                    domain={[-10, 10]}
                    name="Sentiment Score"
                    label={{ value: 'Sentiment Score', position: 'bottom', offset: 35 }}
                  />
                  <YAxis 
                    type="number"
                    domain={[0, 'auto']}
                    label={{ value: 'Absolute Deviation from Algorithm', angle: -90, position: 'insideLeft', offset: -10, dy: 80 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm">Sentiment: {data.social_sentiment.toFixed(1)}</p>
                            <p className="text-sm">Your Deviation: {Math.round(data.algorithm_deviation).toLocaleString()}</p>
                            <p className="text-sm">Decision: {data.decision_number}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="Algorithm Deviation"
                    data={decisions.sort((a, b) => a.social_sentiment - b.social_sentiment)}
                    fill="#2563EB"
                    dataKey="algorithm_deviation"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>


            <div className="h-96 mb-28">
              <h3 className="text-lg font-semibold mb-4">Sentiment Score vs Algorithm Raw Error</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 55, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="social_sentiment"
                    type="number"
                    domain={[-10, 10]}
                    name="Sentiment Score"
                    label={{ value: 'Sentiment Score', position: 'bottom', offset: 35 }}
                  />
                  <YAxis 
                    type="number"
                    domain={[0, 'auto']}
                    label={{ value: 'Algorithm Raw Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm">Sentiment: {data.social_sentiment}</p>
                            <p className="text-sm">
                          {data.prediction_difference > 0 ? 'Algorithm Over-predicted by: ' : 'Algorithm Under-predicted by: '}
                          {Math.abs(Math.round(data.prediction_difference)).toLocaleString()}
                        </p>                            <p className="text-sm">Decision: {data.decision_number}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                        name="Algorithm Error"
                        data={decisions
                        .map(d => ({
                            ...d,
                            prediction_difference: d.algorithm_prediction - d.actual_demand // can be positive (over-prediction) or negative (under-prediction)
                        }))
                        .sort((a, b) => a.social_sentiment - b.social_sentiment)
                        }
                        fill="#DC2626"
                        dataKey="prediction_difference"
                    />
                </ScatterChart>
              </ResponsiveContainer>
            </div>



            <div className="h-96 mb-28">
              <h3 className="text-lg font-semibold mb-4">Sentiment Score vs Algorithm Raw Deviation</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 55, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="social_sentiment"
                    type="number"
                    domain={[-10, 10]}
                    name="Sentiment Score"
                    label={{ value: 'Sentiment Score', position: 'bottom', offset: 35 }}
                  />
                  <YAxis
                    type="number"
                    domain={['auto', 'auto']}  // Allow negative values
                    label={{ value: 'Raw Deviation from Algorithm', angle: -90, position: 'insideLeft', offset: -10, dy: 80 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const rawDeviation = data.player_prediction - data.algorithm_prediction;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm">Sentiment: {data.social_sentiment.toFixed(1)}</p>
                            <p className="text-sm">
                              {rawDeviation > 0 ? 'Adjusted algorithm up by: ' : 'Adjusted algorithm down by: '}
                              {Math.abs(Math.round(rawDeviation)).toLocaleString()}
                            </p>
                            <p className="text-sm">Decision: {data.decision_number}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    name="Algorithm Deviation"
                    data={decisions
                      .map(d => ({
                        ...d,
                        raw_deviation: d.player_prediction - d.algorithm_prediction
                      }))
                      .sort((a, b) => a.social_sentiment - b.social_sentiment)
                    }
                    fill="#2563EB"
                    dataKey="raw_deviation"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Detailed Results</h3>
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
                    {decisions.map((decision) => (
                      <TableRow key={decision.decision_number}>
                        <TableCell>{decision.decision_number}</TableCell>
                        <TableCell>
                          {new Date(0, decision.month - 1).toLocaleString('default', { month: 'long' })}
                        </TableCell>
                        <TableCell>{Math.round(decision.last_year_sales).toLocaleString()}</TableCell>
                        <TableCell>{Math.round(decision.temperature)}°F</TableCell>
                        <TableCell className="font-bold">
                          {decision.social_sentiment.toFixed(1)}
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
          </div>

          <div className="mt-16 flex justify-center">
            <Button 
                onClick={() => router.push('/phase4')} 
                className="w-48"
            >
                Continue to Phase 4
            </Button>
        </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default Phase3Summary;