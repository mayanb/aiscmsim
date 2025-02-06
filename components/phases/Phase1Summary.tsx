'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

interface Phase1SummaryProps {
  sessionId: string;
  playerId: string;
}

interface ProcessedDataPoint {
  decision: number;
  actualDemand: number;
  playerPrediction: number;
  playerError: number;
}

interface Metrics {
  playerMAE: number;
  totalDecisions: number;
  bestDecision: number;
  worstDecision: number;
}

interface SummaryData {
  processedData: ProcessedDataPoint[];
  metrics: Metrics;
}

const Phase1Summary: React.FC<Phase1SummaryProps> = ({ sessionId, playerId }) => {
  const router = useRouter();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        // Fetch all Phase 1 items and decisions
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('phase', 1)
          .eq('session_id', sessionId)
          .order('decision_number');

        if (itemsError || !items) throw itemsError || new Error('No items found');

        const { data: decisions, error: decisionsError } = await supabase
          .from('decisions')
          .select('*')
          .eq('player_id', playerId)
          .order('created_at');

        if (decisionsError || !decisions) throw decisionsError || new Error('No decisions found');


        // Process data for visualization
        const processedData: ProcessedDataPoint[] = items.map(item => {
          const playerDecision = decisions.find(d => d.item_id === item.id);
          
          const playerPrediction = playerDecision?.player_prediction || 0;
          
          return {
            decision: item.decision_number,
            actualDemand: item.actual_demand,
            playerPrediction,
            playerError: Math.abs(playerPrediction - item.actual_demand),
          };
        });

        // Calculate overall metrics
        const metrics: Metrics = {
          playerMAE: processedData.reduce((sum, d) => sum + d.playerError, 0) / processedData.length,
          totalDecisions: processedData.length,
          bestDecision: Math.min(...processedData.map(d => d.playerError)),
          worstDecision: Math.max(...processedData.map(d => d.playerError))
        };

        setSummaryData({ processedData, metrics });
      } catch (error) {
        console.error('Error fetching summary data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [sessionId, playerId]);

  if (loading) {
    return <div className="text-center p-8">Loading summary...</div>;
  }

  if (!summaryData) {
    return <div className="text-center p-8">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phase 1 Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Your Mean Absolute Error</h3>
              <p className="text-2xl font-bold">{Math.round(summaryData.metrics.playerMAE).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Total Decisions</h3>
              <p className="text-2xl font-bold">{summaryData.metrics.totalDecisions}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Demand Predictions vs Actual</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summaryData.processedData} margin={{ top: 5, right: 20, bottom: 45, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decision" label={{ value: 'Decision Number', position: 'bottom' }} tick={{ dy: 5 }} />
                  <YAxis label={{ value: 'Demand', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Line type="monotone" dataKey="actualDemand" stroke="#4B5563" name="Actual Demand" strokeWidth={2} />
                  <Line type="monotone" dataKey="playerPrediction" stroke="#2563EB" name="Your Prediction" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Prediction Errors Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summaryData.processedData} margin={{ top: 5, right: 20, bottom: 45, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decision" label={{ value: 'Decision Number', position: 'bottom' }} tick={{ dy: 5 }} />
                  <YAxis label={{ value: 'Absolute Error', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="playerError" stroke="#DC2626" name="Your Error" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Card className="mt-8 bg-blue-50 border-blue-100">
            <CardHeader>
              <CardTitle className="text-lg">🤔 Reflection Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-800">
                Consider these questions as you reflect on your Phase 1 performance. Please copy them down to answer in your post-simulation reflection:
              </p>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🎯 Algorithm Performance</h4>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>How well did your algorithm perform overall? What was its MAE? Were you satisfied with its accuracy?</li>
                    <li>In what situations did your algorithm perform particularly well or poorly?</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📊 Patterns & Biases</h4>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>Did you notice any systematic bias in your algorithm predictions (consistently too high or too low)?</li>
                    <li>How did your algorithm respond to different months or temperature ranges?</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🔄 Future Improvements</h4>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>What adjustments could you make to your algorithm to improve its performance?</li>
                    <li>Which features (historical sales, month, temperature) seemed most important for accurate predictions?</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-center">
            <Button 
              onClick={() => router.push('/phase2')} 
              className="w-48"
            >
              Continue to Phase 2
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase1Summary;
