import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
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

interface ClassDecisionResponse {
  player_prediction: number;
  items: {
    id: string;
    decision_number: number;
    actual_demand: number;
    algorithm_prediction: number;
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <Alert className="bg-blue-50">
        <AlertDescription className="text-lg">
          Phase 2 Complete! Let's analyze how you performed with the algorithm's assistance.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-slate-50 rounded-lg">
              <h3 className="text-sm font-medium text-slate-600 mb-2">Your Average Error</h3>
              <p className="text-3xl font-bold">{summaryStats.averageError.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-2">vs Algorithm: {summaryStats.algorithmAverageError.toLocaleString()}</p>
            </div>
            <div className="text-center p-6 bg-slate-50 rounded-lg">
              <h3 className="text-sm font-medium text-slate-600 mb-2">Average Deviation from Algorithm</h3>
              <p className="text-3xl font-bold">{summaryStats.averageDeviation.toLocaleString()}</p>
            </div>
            <div className="text-center p-6 bg-slate-50 rounded-lg">
              <h3 className="text-sm font-medium text-slate-600 mb-2">Num Beneficial Algorithm Adjustments</h3>
              <p className="text-3xl font-bold">{summaryStats.timesOutperformedAlgorithm} / {summaryStats.totalDecisions}</p>
            </div>
          </div>

          <div className="space-y-12">
            <div className="h-96">
              <h3 className="text-lg font-semibold mb-4">Algorithm Deviations Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={decisions} margin={{ top: 5, right: 30, bottom: 55, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="decision_number" 
                    label={{ value: 'Decision Number', position: 'bottom', offset: 35 }}
                    tick={{ dy: 15 }}
                  />
                  <YAxis label={{ value: 'Absolute Deviation', angle: -90, position: 'insideLeft', offset: -10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '25px', paddingBottom: '10px' }}/>
                  <Line type="monotone" dataKey="algorithm_deviation" stroke="#2563EB" name="Your Deviation" strokeWidth={2} />
                  <Line type="monotone" dataKey="algorithm_error" stroke="#DC2626" name="Algorithm Error" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96">
              <h3 className="text-lg font-semibold mb-4">Error vs Algorithm Deviation</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 55, left: 30 }}>
                  <CartesianGrid />
                  <XAxis 
                    dataKey="algorithm_deviation"
                    type="number"
                    name="Deviation from Algorithm"
                    label={{ value: 'Deviation from Algorithm', position: 'bottom', offset: 35 }}
                    tick={{ dy: 15 }}
                    domain={[0, 'maxData']}
                    interval={0}
                    tickCount={10}
                  />
                  <YAxis 
                    dataKey="error"
                    type="number"
                    name="Prediction Error"
                    label={{ value: 'Prediction Error', angle: -90, position: 'insideLeft', offset: -10 }}
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
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-16 flex justify-center">
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