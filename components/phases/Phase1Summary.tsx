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
  classAverage: number;
  playerError: number;
  classError: number;
}

interface Metrics {
  playerMAE: number;
  classMAE: number;
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

        // Get class average predictions for each item
        const { data: allDecisions, error: allDecisionsError } = await supabase
          .from('decisions')
          .select('item_id, player_prediction');

        if (allDecisionsError || !allDecisions) throw allDecisionsError || new Error('No class decisions found');

        // Process data for visualization
        const processedData: ProcessedDataPoint[] = items.map(item => {
          const playerDecision = decisions.find(d => d.item_id === item.id);
          const itemDecisions = allDecisions.filter(d => d.item_id === item.id);
          const classAvg = itemDecisions.length > 0 
            ? itemDecisions.reduce((sum, d) => sum + d.player_prediction, 0) / itemDecisions.length
            : 0;
          
          const playerPrediction = playerDecision?.player_prediction || 0;
          
          return {
            decision: item.decision_number,
            actualDemand: item.actual_demand,
            playerPrediction,
            classAverage: classAvg,
            playerError: Math.abs(playerPrediction - item.actual_demand),
            classError: Math.abs(classAvg - item.actual_demand)
          };
        });

        // Calculate overall metrics
        const metrics: Metrics = {
          playerMAE: processedData.reduce((sum, d) => sum + d.playerError, 0) / processedData.length,
          classMAE: processedData.reduce((sum, d) => sum + d.classError, 0) / processedData.length,
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
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Your Average Error</h3>
              <p className="text-2xl font-bold">{Math.round(summaryData.metrics.playerMAE).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <h3 className="text-sm font-medium text-slate-600">Class Average Error</h3>
              <p className="text-2xl font-bold">{Math.round(summaryData.metrics.classMAE).toLocaleString()}</p>
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
                  <XAxis dataKey="decision" label={{ value: 'Decision Number', position: 'bottom' }} tick={{ dy: 10 }} />
                  <YAxis label={{ value: 'Demand', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Line type="monotone" dataKey="actualDemand" stroke="#4B5563" name="Actual Demand" strokeWidth={2} />
                  <Line type="monotone" dataKey="playerPrediction" stroke="#2563EB" name="Your Prediction" strokeWidth={2} />
                  <Line type="monotone" dataKey="classAverage" stroke="#9CA3AF" name="Class Average" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Prediction Errors Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summaryData.processedData} margin={{ top: 5, right: 20, bottom: 45, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decision" label={{ value: 'Decision Number', position: 'bottom' }} tick={{ dy: 10 }} />
                  <YAxis label={{ value: 'Absolute Error', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Line type="monotone" dataKey="playerError" stroke="#2563EB" name="Your Error" strokeWidth={2} />
                  <Line type="monotone" dataKey="classError" stroke="#9CA3AF" name="Class Error" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-16 flex justify-center">
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