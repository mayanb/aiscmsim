
  'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';
import Phase2Summary from './Phase2Summary';

interface Phase2Props {
  sessionId: string;
  playerId: string;
}

interface Item {
  id: string;
  phase: number;
  decision_number: number;
  last_year_sales: number;
  month: number;
  temperature: number;
  actual_demand: number;
  algorithm_prediction: number;
}

interface FeedbackData {
  actualDemand: number;
  prediction: number;
  algorithmPrediction: number;
  error: number;
  algorithmError: number;
  algorithmDeviation: number;
}

interface PerformanceData {
  decision: number;
  playerError: number;
  algorithmError: number;
  algorithmDeviation: number;
}

const Phase2: React.FC<Phase2Props> = ({ sessionId, playerId }) => {
  const [currentDecision, setCurrentDecision] = useState<number>(1);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [prediction, setPrediction] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPhase2Complete, setIsPhase2Complete] = useState<boolean>(false);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allDecisions, setAllDecisions] = useState<any[]>([]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="text-sm mb-1">Decision {label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {Math.round(entry.value).toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const fetchCurrentItem = async (decision: number) => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('phase', 2)
        .eq('decision_number', decision)
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;
      setCurrentItem(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching item:', err);
      setLoading(false);
    }
  };


  // Save progress
const saveProgress = async (decision: number) => {
    try {
      await supabase
        .from('player_progress')
        .upsert({
          player_id: playerId,
          phase: 2,
          current_decision: decision,
          performance_history: performanceHistory
        }, {
          onConflict: 'player_id,phase'
        });
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };


  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch all Phase 2 items
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('phase', 2)
          .eq('session_id', sessionId)
          .order('decision_number');

        if (itemsError) throw itemsError;
        setAllItems(items || []);

        // Load progress including performance history
        const { data: progress, error: progressError } = await supabase
          .from('player_progress')
          .select('*')
          .eq('player_id', playerId)
          .eq('phase', 2)
          .single();

        if (progressError && progressError.code !== 'PGRST116') throw progressError;

        if (progress) {
          const savedDecision = progress.current_decision || 1;
          if (savedDecision > 15) {
            setIsPhase2Complete(true);
          } else {
            setCurrentDecision(savedDecision);
            const currentItem = items?.find(item => item.decision_number === savedDecision);
            setCurrentItem(currentItem || null);
            // Set the performance history from saved progress
            if (progress.performance_history) {
              setPerformanceHistory(progress.performance_history);
            }
          }
        } else {
          const firstItem = items?.find(item => item.decision_number === 1);
          setCurrentItem(firstItem || null);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [sessionId, playerId]);



  const handleSubmit = async () => {
    if (!prediction || !currentItem) return;
    
    try {
      await supabase
        .from('decisions')
        .insert({
          player_id: playerId,
          item_id: currentItem.id,
          player_prediction: Number(prediction)
        });

        // Update all decisions list
      setAllDecisions([...allDecisions, {
        player_id: playerId,
        item_id: currentItem.id,
        player_prediction: Number(prediction)
      }]);

      const algorithmDeviation = Math.abs(Number(prediction) - currentItem.algorithm_prediction);

      const feedback = {
        actualDemand: currentItem.actual_demand,
        prediction: Number(prediction),
        algorithmPrediction: currentItem.algorithm_prediction,
        error: Math.abs(Number(prediction) - currentItem.actual_demand),
        algorithmError: Math.abs(currentItem.algorithm_prediction - currentItem.actual_demand),
        algorithmDeviation
      };
      setFeedback(feedback);

      // Update performance history
      const newHistoryPoint: PerformanceData = {
        decision: currentDecision,
        playerError: feedback.error,
        algorithmError: feedback.algorithmError,
        algorithmDeviation,
      };
      setPerformanceHistory([...performanceHistory, newHistoryPoint]);

    } catch (err) {
      console.error('Error submitting prediction:', err);
    }
  };

  const handleNext = async () => {
    if (!feedback) return;

    const nextDecision = currentDecision + 1;
    if (nextDecision <= 15) {
      setCurrentDecision(nextDecision);
      const nextItem = allItems.find(item => item.decision_number === nextDecision);
      setCurrentItem(nextItem || null);
      setFeedback(null);
      setPrediction('');
      await saveProgress(nextDecision);
    } else {
      setIsPhase2Complete(true);
      await saveProgress(nextDecision);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (isPhase2Complete) {
    return (
      <Phase2Summary
        sessionId={sessionId}
        playerId={playerId}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Decision {currentDecision} of 15</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Last Year's Sales</h3>
              <p className="text-2xl font-bold">{Math.round(currentItem?.last_year_sales || 0).toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Month</h3>
              <p className="text-2xl font-bold">
                {new Date(0, currentItem?.month ? currentItem.month - 1 : 0).toLocaleString('default', { month: 'long' })}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Temperature</h3>
              <p className="text-2xl font-bold">{Math.round(currentItem?.temperature || 0)}°F</p>
            </div>
          </div>

          <div className="mt-6 p-6 bg-blue-50 rounded-lg text-center">
            <h3 className="font-semibold text-blue-800 mb-2">Algorithm's Prediction</h3>
            <p className="text-4xl font-bold text-blue-900">
              {Math.round(currentItem?.algorithm_prediction || 0).toLocaleString()}
            </p>
          </div>

          {!feedback && (
            <div className="mt-6">
              <label className="block mb-2 font-medium">Your Final Prediction:</label>
              <div className="flex space-x-4">
                <Input
                  type="number"
                  value={prediction}
                  onChange={(e) => setPrediction(e.target.value)}
                  placeholder="Enter your prediction"
                  className="flex-1 text-lg"
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={!prediction}
                  className="w-32"
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {feedback && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Decision Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-600 mb-2">Your Prediction</h3>
                  <p className="text-3xl font-bold">{Math.round(feedback.prediction).toLocaleString()}</p>
                  <p className="text-sm text-slate-500 mt-2">Error: {Math.round(feedback.error).toLocaleString()}</p>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-600 mb-2">Algorithm's Prediction</h3>
                  <p className="text-3xl font-bold">{Math.round(feedback.algorithmPrediction).toLocaleString()}</p>
                  <p className="text-sm text-slate-500 mt-2">Error: {Math.round(feedback.algorithmError).toLocaleString()}</p>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-600 mb-2">Actual Demand</h3>
                  <p className="text-3xl font-bold">{Math.round(feedback.actualDemand).toLocaleString()}</p>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-600 mb-2">Algorithm Deviation</h3>
                  <p className="text-3xl font-bold">{Math.round(feedback.algorithmDeviation).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-8 mt-8">
                <div className="h-96 mb-16">
                  <h3 className="text-lg font-semibold mb-4">Prediction Errors Over Time</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceHistory} margin={{ top: 5, right: 30, bottom: 55, left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="decision" 
                        label={{ value: 'Decision Number', position: 'bottom', offset: 35 }}
                        tick={{ dy: 15 }}
                      />
                      <YAxis label={{ value: 'Absolute Error', angle: -90, position: 'insideLeft', offset: -10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '25px', paddingBottom: '10px' }}/>
                      <Line type="monotone" dataKey="playerError" stroke="#2563EB" name="Your Error" strokeWidth={2} />
                      <Line type="monotone" dataKey="algorithmError" stroke="#DC2626" name="Algorithm Error" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-96 mb-16">
                  <h3 className="text-lg font-semibold mb-4">Algorithm Deviation Over Time</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceHistory} margin={{ top: 5, right: 30, bottom: 55, left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="decision" 
                        label={{ value: 'Decision Number', position: 'bottom', offset: 35 }}
                        tick={{ dy: 15 }}
                      />
                      <YAxis label={{ value: 'Deviation from Algorithm', angle: -90, position: 'insideLeft', offset: -10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '25px', paddingBottom: '10px' }}/>
                      <Line type="monotone" dataKey="algorithmDeviation" stroke="#2563EB" name="Your Deviation" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-16 flex justify-center">
                <Button 
                  onClick={handleNext}
                  className="w-48"
                >
                  {currentDecision < 15 ? 'Next Decision' : 'Complete Phase'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Phase2;