import React, { useEffect, useState } from 'react';
import { calculateAlgorithmConfidence, SeededRandom } from '../../lib/generateItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { GAME_CONFIG } from '../../config';

// Color constants
const RED = "#DC2626";
const BLUE = "#2563EB";

interface Phase4SummaryProps {
  sessionId: string;
  playerId: string;
}

interface DecisionData {
  decision_number: number;
  month: number;
  last_year_sales: number;
  temperature: number;
  online_traffic: number;
  advertising_spend: number;
  actual_demand: number;
  player_prediction: number;
  algorithm_prediction: number;
  algorithm_confidence: number;
  player_error: number;
  algorithm_error: number;
  algorithm_deviation: number;
}

const random = new SeededRandom(42);

const Phase4Summary: React.FC<Phase4SummaryProps> = ({ sessionId, playerId }) => {
  const router = useRouter();
  const [decisions, setDecisions] = useState<DecisionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatLargeNumber = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  useEffect(() => {
    const fetchPhase4Data = async () => {
      try {
        // Fetch all Phase 4 items
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('phase', 4)
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

          const algorithm_confidence = calculateAlgorithmConfidence(
                    random, item.online_traffic, item.advertising_spend, 4)
          

          return {
            decision_number: item.decision_number,
            month: item.month,
            last_year_sales: item.last_year_sales,
            temperature: item.temperature,
            online_traffic: item.online_traffic,
            advertising_spend: item.advertising_spend,
            actual_demand: item.actual_demand,
            player_prediction,
            algorithm_prediction: item.algorithm_prediction,
            algorithm_confidence: algorithm_confidence,
            player_error: Math.abs(player_prediction - item.actual_demand),
            algorithm_error: Math.abs(item.algorithm_prediction - item.actual_demand),
            algorithm_deviation: Math.abs(player_prediction - item.algorithm_prediction)
          };
        });

        setDecisions(processedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Phase 4 data:', err);
        setError('Failed to load Phase 4 data');
        setLoading(false);
      }
    };

    fetchPhase4Data();
  }, [sessionId, playerId]);

  const calculateAverageError = (errors: number[]) => {
    return Math.round(errors.reduce((sum, err) => sum + err, 0) / errors.length);
  };

  if (loading) {
    return <div className="text-center p-8">Loading Phase 4 results...</div>;
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
          Phase 4 Complete! Let&apos;s analyze how you performed with the algorithm&apos;s predictions and confidence scores in the context of our digital transformation.
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
              <p className="text-2xl font-bold">{algorithmBetterCount} / {GAME_CONFIG.PHASE_4_DECISIONS} decisions</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Average Deviation from Algorithm</h3>
              <p className="text-2xl font-bold">{averageDeviation.toLocaleString()}</p>
            </div>
          </div>

          {/* <div className="space-y-12"> */}
            {/* Prediction Errors Over Time */}
            <div className="h-96 mb-16">
              <h3 className="text-lg font-semibold mb-4">Prediction Errors Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...decisions].sort((a, b) => a.decision_number - b.decision_number)} 
                  margin={{ top: 5, right: 30, bottom: 55, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="decision_number" 
                    label={{ value: 'Decision Number', position: 'bottom', offset: 35 }}
                    tick={{ dy: 5 }}
                  />
                  <YAxis label={{ value: 'Absolute Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="text-sm mb-1">Decision {payload[0].payload.decision_number}</p>
                          {payload.map((entry: any) => (
                            <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {Math.round(entry.value).toLocaleString()}
                              {entry.name === "Algorithm Error" && 
                                ` (${Math.round(payload[0].payload.algorithm_confidence)}% confidence)`}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Line type="monotone" dataKey="player_error" stroke={BLUE} name="Your Error" strokeWidth={2} />
                  <Line type="monotone" dataKey="algorithm_error" stroke={RED} name="Algorithm Error" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Algorithm Confidence vs Error */}
            <div className="h-96 mb-16">
              <h3 className="text-lg font-semibold mb-4">Algorithm Confidence vs Error</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="algorithm_confidence" 
                    type="number"
                    domain={[0, 100]}
                    label={{ value: 'Algorithm Confidence (%)', position: 'bottom', offset: 20 }}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />
                  <YAxis 
                    dataKey="algorithm_error"
                    label={{ value: 'Algorithm Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }}
                    tickFormatter={formatLargeNumber}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm">Confidence: {data.algorithm_confidence}%</p>
                            <p className="text-sm">Algorithm Error: {Math.round(data.algorithm_error).toLocaleString()}</p>
                            <p className="text-sm">Decision: {data.decision_number}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    data={decisions}
                    fill={RED}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Algorithm Confidence vs Your Deviation */}
            <div className="h-96 mb-16">
              <h3 className="text-lg font-semibold mb-4">Algorithm Confidence vs Your Deviation</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="algorithm_confidence" 
                    type="number"
                    domain={[0, 100]}
                    label={{ value: 'Algorithm Confidence (%)', position: 'bottom', offset: 20 }}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />
                  <YAxis 
                    dataKey="algorithm_deviation"
                    label={{ value: 'Your Deviation from Algorithm', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm">Confidence: {data.algorithm_confidence}%</p>
                            <p className="text-sm">Your Deviation: {Math.round(data.algorithm_deviation).toLocaleString()}</p>
                            <p className="text-sm">Decision: {data.decision_number}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    data={decisions}
                    fill={BLUE}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Combined Effects Graph */}
            <div className="h-96 mb-16">
            <h3 className="text-lg font-semibold mb-4">Combined Effects on Algorithm Error</h3>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="online_traffic" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    label={{ value: 'Daily Online Traffic', position: 'bottom', offset: 20 }}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                />
                <YAxis 
                    dataKey="advertising_spend"
                    label={{ value: 'Advertising Spend ($)', angle: -90, position: 'insideLeft', offset: -10, dy: 50 }}
                />
                <Tooltip
                    content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm">Traffic: {data.online_traffic?.toLocaleString()}</p>
                            <p className="text-sm">Ad Spend: ${data.advertising_spend}</p>
                            <p className="text-sm">Algorithm Error: {Math.round(data.algorithm_error).toLocaleString()}</p>
                            <p className="text-sm">Algorithm Confidence: {data.algorithm_confidence}%</p>
                            <p className="text-sm">Decision: {data.decision_number}</p>
                        </div>
                        );
                    }
                    return null;
                    }}
                />
                {decisions.map((entry, index) => {
                    const maxError = Math.max(...decisions.map(d => d.algorithm_error));
                    const ratio = entry.algorithm_error / maxError;
                    
                    // Interpolate between blue and red based on error
                    const color = `rgb(
                    ${Math.round(220 * ratio + 37 * (1 - ratio))},
                    ${Math.round(38 * ratio + 99 * (1 - ratio))},
                    ${Math.round(38 * ratio + 235 * (1 - ratio))}
                    )`;
                    
                    return (
                    <Scatter
                        key={index}
                        data={[entry]}
                        fill={color}
                    />
                    );
                })}
                </ScatterChart>
            </ResponsiveContainer>
            </div>

          <div className="mt-16 flex justify-center">
            <Button 
                onClick={() => router.push('/finish')} 
                className="w-48"
            >
                Finish Game
            </Button>
        </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default Phase4Summary;