'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import Phase1Summary from '../phases/Phase1Summary';

interface Phase1Props {
  sessionId: string;
  playerId: string;
  onPhaseComplete: () => void;
}

interface Item {
  id: string;
  phase: number;
  decision_number: number;
  last_year_sales: number;
  month: number;
  temperature: number;
  actual_demand: number;
}

interface FeedbackData {
  actualDemand: number;
  prediction: number;
  error: number;
  percentError: number;
  classAverageError: number;
}

interface PerformanceData {
  decision: number;
  error: number;
  classAverage: number;
}

const Phase1: React.FC<Phase1Props> = ({ 
    sessionId, 
    playerId,
    onPhaseComplete 
  }) => {
    const [currentDecision, setCurrentDecision] = useState<number>(1);
    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [prediction, setPrediction] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isPhase1Complete, setIsPhase1Complete] = useState(false);

    // Fetch current item for the decision
    const fetchCurrentItem = async (decision: number) => {
        try {
          const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('phase', 1)
            .eq('decision_number', decision)
            .eq('session_id', sessionId)
            .single();
      
          if (error) throw error;
          
          setCurrentItem(data);
        } catch (err) {
          console.error('Error fetching current item:', err);
          setError('Failed to load decision item');
        }
      };
  
    // Load saved progress
    useEffect(() => {
      const loadProgress = async () => {
        try {
          // First, load progress
          const { data: progress } = await supabase
            .from('player_progress')
            .select('*')
            .eq('player_id', playerId)
            .eq('phase', 1)
            .single();
  
          if (progress) {
            const savedDecision = progress.current_decision || 1;
            setCurrentDecision(savedDecision);
            setPerformanceHistory(progress.performance_history || []);
            
            // Then fetch the current item
            await fetchCurrentItem(savedDecision);
          } else {
            // If no progress, start with first decision
            await fetchCurrentItem(1);
          }
        } catch (err) {
          console.error('Error loading progress:', err);
          // Fetch first item if no progress found
          await fetchCurrentItem(1);
        } finally {
          // Always set loading to false after attempting to load data
          setLoading(false);
        }
      };
      
      loadProgress();
    }, [playerId]);
  
    // Save progress
    const saveProgress = async (decision: number, history: PerformanceData[]) => {
      try {
        await supabase
          .from('player_progress')
          .upsert({
            player_id: playerId,
            phase: 1,
            current_decision: decision,
            performance_history: history
          }, {
            onConflict: 'player_id,phase'
          });
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    };
  
    // Modified handleSubmit
    const handleSubmit = async () => {
      if (!prediction || !currentItem) return;
      
      try {
        const response = await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            itemId: currentItem.id,
            prediction: Number(prediction)
          })
        });
        
        const data = await response.json();
        
        const absoluteError = Math.abs(currentItem.actual_demand - Number(prediction));
        const percentError = (absoluteError / currentItem.actual_demand) * 100;
        
        const updatedHistory = [...performanceHistory, {
          decision: currentDecision,
          error: absoluteError,
          classAverage: data.classAverageError * currentItem.actual_demand / 100
        }];
  
        setPerformanceHistory(updatedHistory);
        await saveProgress(currentDecision, updatedHistory);
  
        setFeedback({
          actualDemand: currentItem.actual_demand,
          prediction: Number(prediction),
          error: absoluteError,
          percentError,
          classAverageError: data.classAverageError
        });
  
        setPrediction('');
      } catch (err) {
        setError('Failed to submit prediction');
      }
    };
  
    // Modified handleNext
    const handleNext = async () => {
      if (currentDecision < 10) {
        const nextDecision = currentDecision + 1;
        setCurrentDecision(nextDecision);
        setFeedback(null);
        
        // Fetch next item
        await fetchCurrentItem(nextDecision);
        
        await saveProgress(nextDecision, performanceHistory);
      } else {
        onPhaseComplete();
      }
    };
  
    // Calculate MAE
  const calculateMAE = (data: PerformanceData[]) => {
    if (data.length === 0) return { yourMAE: 0, classMAE: 0 };
    
    const totalYourError = data.reduce((sum, d) => sum + d.error, 0);
    const totalClassError = data.reduce((sum, d) => sum + d.classAverage, 0);
    
    return {
      yourMAE: totalYourError / data.length,
      classMAE: totalClassError / data.length
    };
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="text-sm mb-1">Decision {label}</p>
          <p className="text-sm text-blue-600">
            Your Error: {Math.round(payload[0].value).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Class Error: {Math.round(payload[1].value).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const handlePhaseComplete = () => {
    // This method will be called when all 10 decisions are completed
    setIsPhase1Complete(true);
  };

  const handleContinueToPhase2 = () => {
    // Logic to move to Phase 2 or update parent component's state
    // For example, you might emit an event or call a method passed as a prop
    // to advance to the next phase of the simulation
  };

  
// Existing render logic with minor modifications
if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border-2">
        <CardHeader className="bg-slate-50">
          <CardTitle>Decision {currentDecision} of 10</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Last Year's Sales</h3>
              <p className="text-2xl font-bold">{Math.round(currentItem?.last_year_sales || 0).toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Month</h3>
              <p className="text-2xl font-bold">{new Date(0, currentItem?.month ? currentItem.month - 1 : 0).toLocaleString('default', { month: 'long' })}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Temperature</h3>
              <p className="text-2xl font-bold">{Math.round(currentItem?.temperature || 0)}°F</p>
            </div>
          </div>
        </CardContent>
        {!feedback && (  // Only show the prediction input if there's no feedback
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <div className="w-full">
              <label className="block mb-2 font-medium">Your Demand Prediction:</label>
              <div className="flex space-x-4">
                <Input
                  type="number"
                  value={prediction}
                  onChange={(e) => setPrediction(e.target.value)}
                  placeholder="Enter predicted demand"
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
          </CardFooter>
        )}
      </Card>

      {feedback && (
        <Card>
          <CardHeader className="bg-slate-50">
            <CardTitle>Decision Feedback</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-600 mb-1">Your Prediction</h3>
                <p className="text-2xl font-bold">{Math.round(feedback.prediction).toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-600 mb-1">Actual Demand</h3>
                <p className="text-2xl font-bold">{Math.round(feedback.actualDemand).toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-600 mb-1">Your Error</h3>
                <p className="text-2xl font-bold">{Math.round(feedback.error).toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-600 mb-1">Class Average Error</h3>
                <p className="text-2xl font-bold">{Math.round(feedback.classAverageError * feedback.actualDemand / 100).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={handleNext} 
                className="w-48"
              >
                {currentDecision < 10 ? 'Next Decision' : 'Complete Phase'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

{performanceHistory.length > 0 && (
        <Card>
          <CardHeader className="bg-slate-50">
            <CardTitle>Your Performance History</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-600 mb-1">Your Overall MAE</h3>
                <p className="text-2xl font-bold">
                  {Math.round(calculateMAE(performanceHistory).yourMAE).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-600 mb-1">Class Overall MAE</h3>
                <p className="text-2xl font-bold">
                  {Math.round(calculateMAE(performanceHistory).classMAE).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="h-80 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceHistory} margin={{ top: 5, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="decision"
                    label={{ value: 'Decision Number', position: 'bottom', offset: 20 }}
                  />
                  <YAxis 
                    label={{ value: 'Absolute Error', angle: -90, position: 'insideLeft', offset: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="error" 
                    stroke="#2563eb" 
                    name="Your Error" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="classAverage" 
                    stroke="#9ca3af" 
                    name="Class Average" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Phase1;