import React, { useState, useEffect } from 'react';
import { calculateAlgorithmConfidence, SeededRandom } from '../../lib/generateItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';
import Phase4Summary from './Phase4Summary';
import { GAME_CONFIG } from '../../config';

// Color constants
const RED = "#DC2626";
const BLUE = "#2563EB";

interface Phase4Props {
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
  online_traffic: number;
  advertising_spend: number;
  algorithm_confidence: number;
}

interface FeedbackData {
  actualDemand: number;
  prediction: number;
  algorithmPrediction: number;
  error: number;
  algorithmError: number;
  algorithmDeviation: number;
  algorithmConfidence: number;
  onlineTraffic: number;
  advertisingSpend: number;
}

interface PerformanceData {
  decision: number;
  playerError: number;
  algorithmError: number;
  algorithmDeviation: number;
  algorithmConfidence: number;
  onlineTraffic: number;
  advertisingSpend: number;
}
const random = new SeededRandom(42);

const Phase4: React.FC<Phase4Props> = ({ sessionId, playerId }) => {
  const [currentDecision, setCurrentDecision] = useState<number>(1);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [prediction, setPrediction] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPhase4Complete, setIsPhase4Complete] = useState<boolean>(false);
  const [allItems, setAllItems] = useState<Item[]>([]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="text-sm mb-1">Decision {label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {Math.round(entry.value).toLocaleString()}
              {entry.payload.algorithmConfidence && entry.dataKey === 'algorithmError' && 
                ` (${Math.round(entry.payload.algorithmConfidence)}% confidence)`}
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
        .eq('phase', 4)
        .eq('decision_number', decision)
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;

      let algorithm_confidence = calculateAlgorithmConfidence(
        random, data.online_traffic, data.advertising_spend, 4)
        data.algorithm_confidence = algorithm_confidence

      setCurrentItem(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching item:', err);
      setLoading(false);
    }
  };

  const saveProgress = async (decision: number) => {
    try {
      await supabase
        .from('player_progress')
        .upsert({
          player_id: playerId,
          phase: 4,
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
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('phase', 4)
          .eq('session_id', sessionId)
          .order('decision_number');

        if (itemsError) throw itemsError;
        setAllItems(items || []);

        const { data: progress, error: progressError } = await supabase
          .from('player_progress')
          .select('*')
          .eq('player_id', playerId)
          .eq('phase', 4)
          .single();

        if (progressError && progressError.code !== 'PGRST116') throw progressError;

        if (progress) {
          const savedDecision = progress.current_decision || 1;
          if (savedDecision > GAME_CONFIG.PHASE_4_DECISIONS) {
            setIsPhase4Complete(true);
          } else {
            setCurrentDecision(savedDecision);
            const currentItem = items?.find(item => item.decision_number === savedDecision);
            let algorithm_confidence = calculateAlgorithmConfidence(
                random, currentItem.online_traffic, currentItem.advertising_spend, 4)
            currentItem.algorithm_confidence = algorithm_confidence
            

            setCurrentItem(currentItem || null);
            if (progress.performance_history) {
              setPerformanceHistory(progress.performance_history);
            }
          }
        } else {
          const firstItem = items?.find(item => item.decision_number === 1);
          let algorithm_confidence = calculateAlgorithmConfidence(
            random, firstItem.online_traffic, firstItem.advertising_spend, 4)
            firstItem.algorithm_confidence = algorithm_confidence

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

      let algorithm_confidence = calculateAlgorithmConfidence(
                random, currentItem.online_traffic, currentItem.advertising_spend, 4)


      const feedback = {
        actualDemand: currentItem.actual_demand,
        prediction: Number(prediction),
        algorithmPrediction: currentItem.algorithm_prediction,
        error: Math.abs(Number(prediction) - currentItem.actual_demand),
        algorithmError: Math.abs(currentItem.algorithm_prediction - currentItem.actual_demand),
        algorithmDeviation: Math.abs(Number(prediction) - currentItem.algorithm_prediction),
        algorithmConfidence: algorithm_confidence,
        onlineTraffic: currentItem.online_traffic,
        advertisingSpend: currentItem.advertising_spend
      };
      setFeedback(feedback);

      const newHistoryPoint: PerformanceData = {
        decision: currentDecision,
        playerError: feedback.error,
        algorithmError: feedback.algorithmError,
        algorithmDeviation: feedback.algorithmDeviation,
        algorithmConfidence: feedback.algorithmConfidence,
        onlineTraffic: feedback.onlineTraffic,
        advertisingSpend: feedback.advertisingSpend
      };
      setPerformanceHistory([...performanceHistory, newHistoryPoint]);

    } catch (err) {
      console.error('Error submitting prediction:', err);
    }
  };

  const handleNext = async () => {
    if (!feedback) return;

    const nextDecision = currentDecision + 1;
    if (nextDecision <= GAME_CONFIG.PHASE_4_DECISIONS) {
      setCurrentDecision(nextDecision);
      const nextItem = allItems.find(item => item.decision_number === nextDecision);
      
      if (nextItem) {
        let algorithm_confidence = calculateAlgorithmConfidence(
          random, nextItem.online_traffic, nextItem.advertising_spend, 4);
        nextItem.algorithm_confidence = algorithm_confidence;
      }

      setCurrentItem(nextItem || null);
      setFeedback(null);
      setPrediction('');
      await saveProgress(nextDecision);
    } else {
      setIsPhase4Complete(true);
      await saveProgress(nextDecision);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (isPhase4Complete) {
    return (
      <Phase4Summary
        sessionId={sessionId}
        playerId={playerId}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Decision {currentDecision} of {GAME_CONFIG.PHASE_4_DECISIONS}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Last Year&apos;s Sales</h3>
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
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Online Traffic</h3>
              <p className="text-2xl font-bold">{Math.round(currentItem?.online_traffic || 0).toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Ad Spend</h3>
              <p className="text-2xl font-bold">${Math.round(currentItem?.advertising_spend || 0)}</p>
            </div>
          </div>

          <div className="mt-6 p-6 bg-blue-50 rounded-lg">
            <div className="text-center">
              <h3 className="font-semibold text-blue-800 mb-2">Algorithm&apos;s Prediction</h3>
              <p className="text-4xl font-bold text-blue-900 mb-2">
                {Math.round(currentItem?.algorithm_prediction || 0).toLocaleString()}
              </p>
              <p className="text-lg text-blue-700">
                Confidence: {Math.round(currentItem?.algorithm_confidence || 0)}%
              </p>
            </div>
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
                    <h3 className="font-semibold text-slate-600 mb-2">Algorithm&apos;s Prediction</h3>
                    <p className="text-3xl font-bold">{Math.round(feedback.algorithmPrediction).toLocaleString()}</p>
                    <p className="text-sm text-slate-500 mt-2">Error: {Math.round(feedback.algorithmError).toLocaleString()}</p>
                    <p className="text-sm text-blue-600 mt-1">Confidence: {Math.round(feedback.algorithmConfidence)}%</p>
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
                {/* Prediction Errors Over Time */}
                <div className="h-96 mb-16">
                    <h3 className="text-lg font-semibold mb-4">Prediction Errors Over Time</h3>
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...performanceHistory].sort((a, b) => a.decision - b.decision)} margin={{ top: 5, right: 30, bottom: 55, left: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                        dataKey="decision" 
                        label={{ value: 'Decision Number', position: 'bottom', offset: 35 }}
                        tick={{ dy: 20 }}
                        />
                        <YAxis label={{ value: 'Absolute Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '25px', paddingBottom: '10px', marginBottom: '14px' }}/>
                        <Line type="monotone" dataKey="playerError" stroke={BLUE} name="Your Error" strokeWidth={2} />
                        <Line type="monotone" dataKey="algorithmError" stroke={RED} name="Algorithm Error" strokeWidth={2} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Algorithm Deviation Over Time */}
                <div className="h-96 mb-16">
                    <h3 className="text-lg font-semibold mb-4">Algorithm Deviation Over Time</h3>
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...performanceHistory].sort((a, b) => a.decision - b.decision)} margin={{ top: 5, right: 30, bottom: 55, left: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                        dataKey="decision" 
                        label={{ value: 'Decision Number', position: 'bottom', offset: 35 }}
                        tick={{ dy: 20 }}
                        />
                        <YAxis label={{ value: 'Absolute Deviation from Algo.', angle: -90, position: 'insideLeft', offset: -10, dy: 110 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="algorithmDeviation" stroke={BLUE} name="Your Deviation" strokeWidth={2} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Algorithm Confidence vs Deviation */}
                <div className="h-96 mb-16">
                    <h3 className="text-lg font-semibold mb-4">Algorithm Confidence vs Your Deviation</h3>
                    <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                        dataKey="algorithmConfidence" 
                        type="number"
                        domain={[0, 100]}
                        label={{ value: 'Algorithm Confidence (%)', position: 'bottom', offset: 20 }}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        />
                        <YAxis 
                        dataKey="algorithmDeviation"
                        label={{ value: 'Your Deviation from Algorithm', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }}
                        />
                        <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="text-sm">Confidence: {data.algorithmConfidence}%</p>
                                <p className="text-sm">Your Deviation: {Math.round(data.algorithmDeviation).toLocaleString()}</p>
                                <p className="text-sm">Decision: {data.decision}</p>
                                </div>
                            );
                            }
                            return null;
                        }}
                        />
                        <Scatter 
                        data={performanceHistory}
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
                        dataKey="onlineTraffic" 
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        label={{ value: 'Daily Online Traffic', position: 'bottom', offset: 20 }}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                        />
                        <YAxis 
                        dataKey="advertisingSpend"
                        label={{ value: 'Advertising Spend ($)', angle: -90, position: 'insideLeft', offset: -10, dy: 50 }}
                        />
                        <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="text-sm">Traffic: {data.onlineTraffic?.toLocaleString()}</p>
                                <p className="text-sm">Ad Spend: ${data.advertisingSpend}</p>
                                <p className="text-sm">Algorithm Error: {Math.round(data.algorithmError).toLocaleString()}</p>
                                <p className="text-sm">Algorithm Confidence: {data.algorithmConfidence}%</p>
                                <p className="text-sm">Decision: {data.decision}</p>
                                </div>
                            );
                            }
                            return null;
                        }}
                        />
                        {performanceHistory.map((entry, index) => {
                        const maxError = Math.max(...performanceHistory.map(d => d.algorithmError));
                        const ratio = entry.algorithmError / maxError;
                        
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
                </div>

                <div className="mt-16 flex justify-center">
                <Button 
                    onClick={handleNext}
                    className="w-48"
                >
                    {currentDecision < GAME_CONFIG.PHASE_4_DECISIONS ? 'Next Decision' : 'Complete Phase'}
                </Button>
                </div>
            </CardContent>
            </Card>
        </>
        )}
      </div>
  );
};

export default Phase4;      