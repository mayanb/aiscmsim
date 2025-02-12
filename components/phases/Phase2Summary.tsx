import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter } from 'recharts';
import { supabase } from '../../lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface Phase2SummaryProps {
  sessionId: string;
  playerId: string;
}

interface PlayerDecisionResponse {
  player_prediction: number;
  items: {
    decision_number: number;
    actual_demand: number;
    algorithm_prediction: number;
    phase: number;
  };
}

interface DecisionData {
  decision_number: number;
  player_prediction: number;
  algorithm_prediction: number;
  actual_demand: number;
  error: number;
  algorithm_error: number;
  algorithm_deviation: number;
}

interface SummaryStats {
  totalDecisions: number;
  averageError: number;
  algorithmAverageError: number;
  averageDeviation: number;
  timesOutperformedAlgorithm: number;
}

const Phase2Summary: React.FC<Phase2SummaryProps> = ({ sessionId, playerId }) => {
const router = useRouter();
  const [decisions, setDecisions] = useState<DecisionData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhase2Data = async () => {
      try {
        // Fetch player's decisions
        const { data: playerDecisions, error: playerError } = await supabase
          .from('decisions')
          .select(`
            player_prediction,
            items!inner (
              decision_number,
              actual_demand,
              algorithm_prediction,
              phase
            )
          `)
          .eq('player_id', playerId)
          .eq('items.phase', 2)
          .order('created_at') as { 
            // 'items.decision_number', { ascending: true }) 
          
            data: PlayerDecisionResponse[] | null; 
            error: any; 
          };

        if (playerError) throw playerError;
        if (!playerDecisions) throw new Error('No decisions found');

        // Process player decisions
        const processedDecisions = playerDecisions.map(d => ({
          decision_number: d.items.decision_number,
          player_prediction: d.player_prediction,
          algorithm_prediction: d.items.algorithm_prediction,
          actual_demand: d.items.actual_demand,
          error: Math.abs(d.player_prediction - d.items.actual_demand),
          algorithm_error: Math.abs(d.items.algorithm_prediction - d.items.actual_demand),
          algorithm_deviation: Math.abs(d.player_prediction - d.items.algorithm_prediction)
        }));


        // Calculate summary statistics
        const stats: SummaryStats = {
          totalDecisions: processedDecisions.length,
          averageError: Math.round(
            processedDecisions.reduce((sum, d) => sum + d.error, 0) / processedDecisions.length
          ),
          algorithmAverageError: Math.round(
            processedDecisions.reduce((sum, d) => sum + d.algorithm_error, 0) / processedDecisions.length
          ),
          averageDeviation: Math.round(
            processedDecisions.reduce((sum, d) => sum + d.algorithm_deviation, 0) / processedDecisions.length
          ),
          timesOutperformedAlgorithm: processedDecisions.filter(d => d.error < d.algorithm_error).length
        };

        setDecisions(processedDecisions);
        setSummaryStats(stats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Phase 2 data:', error);
        setLoading(false);
      }
    };

    fetchPhase2Data();
  }, [sessionId, playerId]);

  if (loading) {
    return <div className="text-center p-8">Loading summary...</div>;
  }

  if (!summaryStats || decisions.length === 0) {
    return <div className="text-center p-8">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phase 2 Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Your Average Error</h3>
              <p className="text-2xl font-bold">{summaryStats.averageError.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">TrendAI&apos;s Average Error</h3>
              <p className="text-2xl font-bold">{summaryStats.algorithmAverageError.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Times You Improved on TrendAI</h3>
              <p className="text-2xl font-bold">{summaryStats.timesOutperformedAlgorithm} / {summaryStats.totalDecisions}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Demand Predictions Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={decisions} margin={{ top: 5, right: 20, bottom: 45, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="decision_number"
                    label={{ value: 'Decision Number', position: 'bottom' }}
                    tick={{ dy: 5 }}
                  />
                  <YAxis label={{ value: 'Demand', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Line type="monotone" dataKey="actual_demand" stroke="#4B5563" name="Actual Demand" strokeWidth={2} />
                  <Line type="monotone" dataKey="player_prediction" stroke="#2563EB" name="Your Prediction" strokeWidth={2} />
                  <Line type="monotone" dataKey="algorithm_prediction" stroke="#DC2626" name="TrendAI Prediction" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Prediction Errors Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={decisions} margin={{ top: 5, right: 20, bottom: 45, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="decision_number"
                    label={{ value: 'Decision Number', position: 'bottom' }}
                    tick={{ dy: 5 }}
                  />
                  <YAxis label={{ value: 'Absolute Error', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Line type="monotone" dataKey="error" stroke="#2563EB" name="Your Error" strokeWidth={2} />
                  <Line type="monotone" dataKey="algorithm_error" stroke="#DC2626" name="TrendAI Error" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Deviation from TrendAI Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={decisions} margin={{ top: 5, right: 20, bottom: 45, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="decision_number"
                    label={{ value: 'Decision Number', position: 'bottom' }}
                    tick={{ dy: 5 }}
                  />
                  <YAxis label={{ value: 'Absolute Deviation from TrendAI', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="algorithm_deviation" stroke="#2563EB" name="Your Deviation" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Error vs Deviation from TrendAI</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 55, left: 30 }}>
                  <CartesianGrid />
                  <XAxis 
                    dataKey="algorithm_deviation"
                    type="number"
                    name="Absolute Deviation from TrendAI"
                    label={{ value: 'Absolute Deviation from TrendAI', position: 'bottom', offset: 35 }}
                    tick={{ dy: 5 }}
                    domain={[0, 'maxData']}
                    interval={0}
                    tickCount={10}
                  />
                  <YAxis 
                    dataKey="error"
                    type="number"
                    name="Prediction Error"
                    label={{ value: 'Your Prediction Error', angle: -90, position: 'insideLeft', offset: -10 }}
                    domain={[0, 'maxData']}
                    tickCount={10}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value: any) => Math.round(value).toLocaleString()}
                    labelFormatter={(value: any) => `Deviation: ${Math.round(value).toLocaleString()}`}
                  />
                  <Scatter
                    data={decisions}
                    fill="#2563EB"
                    name="Decisions"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Card className="mt-16 bg-blue-50 border-blue-100">
            <CardHeader>
              <CardTitle className="text-lg">🤔 Reflection Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-800">
                Consider these questions as you reflect on your Phase 2 performance. Please copy them down to answer in your post-simulation reflection:
              </p>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🎯 Performance Analysis</h4>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>How does your MAE compare to what it would have been if you had just used TrendAI?</li>
                    <li>On average, how much did you adjust TrendAI&apos;s predictions?</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🤝 Trust & Reliance</h4>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>How did your trust in TrendAI evolve as you observed its performance over time?</li>
                    <li>After seeing TrendAI make a significant error, how did it affect your reliance on its predictions?</li>
                    <li>Were there specific situations or patterns where you learned to trust or doubt TrendAI more?</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📈 Adjustment Patterns</h4>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>How did your adjustment strategy change over time? Did you make larger or smaller adjustments?</li>
                    <li>What factors influenced how much you adjusted TrendAI&apos;s predictions?</li>
                    <li>Looking at the Error vs Deviation plot, what patterns do you notice about when your adjustments helped or hurt?</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-center">
            <Button 
              onClick={() => router.push('/phase3')} 
              className="w-48"
            >
              Continue to Phase 3
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase2Summary;