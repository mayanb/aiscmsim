import React, { useEffect, useState } from 'react';
import { calculateAlgorithmConfidence, SeededRandom } from '../lib/generateItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

// Color constants
const RED = "#DC2626";
const BLUE = "#2563EB";
const random = new SeededRandom(42);

interface GameFinishProps {
  sessionId: string;
  playerId: string;
}

interface PhasePerformance {
  phase: number;
  playerMAE: number;
  algorithmMAE?: number;
}

// Add these interfaces at the top of the file
interface BasePhaseData {
    last_year_sales: number;
    month: string;
    temperature: number;
    player_prediction: number | null;
    actual_demand: number;
  }
  
  interface Phase1Data extends BasePhaseData {}
  
  interface Phase2Data extends BasePhaseData {
    algorithm_prediction: number;
  }
  
  interface Phase3Data extends Phase2Data {
    focus_group_sentiment: number;
  }
  
  interface Phase4Data extends Phase2Data {
    advertising_spend: number;
    online_traffic: number;
    algorithm_confidence: number;
  }
  
  


const GameFinish: React.FC<GameFinishProps> = ({ sessionId, playerId }) => {    
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phasePerformance, setPhasePerformance] = useState<PhasePerformance[]>([]);
    // Then modify the allData state type and its usage
  const [allData, setAllData] = useState<{
        1: Phase1Data[];
        2: Phase2Data[];
        3: Phase3Data[];
        4: Phase4Data[];
      }>({} as any);
    

  useEffect(() => {
    const fetchAllPhaseData = async () => {
      try {
        // Fetch all items for all phases
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('session_id', sessionId)
          .order('phase, decision_number');

        if (itemsError) throw itemsError;

        // Fetch all player decisions
        const { data: decisions, error: decisionsError } = await supabase
          .from('decisions')
          .select('*')
          .eq('player_id', playerId);

        if (decisionsError) throw decisionsError;

        // Process data for each phase
        const phaseData: { 
            1: Phase1Data[]; 
            2: Phase2Data[]; 
            3: Phase3Data[]; 
            4: Phase4Data[]; 
          } = {
            1: [],
            2: [],
            3: [],
            4: []
          };
          
        const performance: PhasePerformance[] = [];

        for (let phase = 1; phase <= 4; phase++) {
          const phaseItems = items.filter(item => item.phase === phase);
        
            // In the data processing section, modify the type assertions:
            const processedData = phaseItems.map(item => {
                const decision = decisions.find(d => d.item_id === item.id);
                const baseData: BasePhaseData = {
                last_year_sales: item.last_year_sales,
                month: new Date(0, item.month - 1).toLocaleString('default', { month: 'long' }),
                temperature: item.temperature,
                player_prediction: decision?.player_prediction || null,
                actual_demand: item.actual_demand
                };
            
                if (phase === 1) {
                return baseData as Phase1Data;
                }
                
                if (phase === 2) {
                return {
                    ...baseData,
                    algorithm_prediction: item.algorithm_prediction
                } as Phase2Data;
                }
                
                if (phase === 3) {
                return {
                    ...baseData,
                    algorithm_prediction: item.algorithm_prediction,
                    focus_group_sentiment: item.social_sentiment
                } as Phase3Data;
                }
                
                // phase 4

                let algorithm_confidence = calculateAlgorithmConfidence(
                    random, item.online_traffic, item.advertising_spend, 4)
                item.algorithm_confidence = algorithm_confidence
                
                return {
                ...baseData,
                algorithm_prediction: item.algorithm_prediction,
                advertising_spend: item.advertising_spend,
                online_traffic: item.online_traffic,
                algorithm_confidence: item.algorithm_confidence
                } as Phase4Data;
            });
            if (phase === 1) {
                phaseData[1] = processedData as Phase1Data[];
              } else if (phase === 2) {
                phaseData[2] = processedData as Phase2Data[];
              } else if (phase === 3) {
                phaseData[3] = processedData as Phase3Data[];
              } else if (phase === 4) {
                phaseData[4] = processedData as Phase4Data[];
              }
    
          // Calculate MAE for the phase
          const errors = processedData
          .filter((d): d is BasePhaseData & { player_prediction: number } => 
            d.player_prediction !== null
          )
          .map(d => Math.abs(d.player_prediction - d.actual_demand));

          const phasePerf: PhasePerformance = {
            phase,
            playerMAE: errors.reduce((sum, err) => sum + err, 0) / errors.length
          };

          if (phase >= 2) {
            // Type assertion to tell TypeScript this is Phase2Data or higher
            const dataWithAlgorithm = processedData as (Phase2Data | Phase3Data | Phase4Data)[];
            const algoErrors = dataWithAlgorithm.map(d =>
              Math.abs(d.algorithm_prediction - d.actual_demand)
            );
            phasePerf.algorithmMAE = algoErrors.reduce((sum, err) => sum + err, 0) / algoErrors.length;
          }
        
          performance.push(phasePerf);
        }

        setAllData(phaseData);
        setPhasePerformance(performance);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError('Failed to load game data');
        setLoading(false);
      }
    };

    fetchAllPhaseData();
  }, [sessionId, playerId]);

  const handleDownloadData = () => {
    const wb = XLSX.utils.book_new();

    // Create sheets for each phase
    Object.entries(allData).forEach(([phase, data]) => {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, `Phase ${phase}`);
    });

    // Save the file
    XLSX.writeFile(wb, 'demand_forecasting_game_data.xlsx');
  };

  if (loading) {
    return <div className="text-center p-8">Loading game results...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Alert className="bg-blue-50">
        <AlertDescription className="text-lg">
          Congratulations on completing the Demand Forecasting Game! Let's review your performance across all phases.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Overall Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="grid grid-cols-4 gap-4">
              {phasePerformance.map((phase) => (
                <div key={phase.phase} className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Phase {phase.phase}</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Your MAE:</p>
                    <p className="text-2xl font-bold">{Math.round(phase.playerMAE).toLocaleString()}</p>
                    {phase.algorithmMAE && (
                      <>
                        <p className="text-sm text-slate-600">Algorithm MAE:</p>
                        <p className="text-2xl font-bold">{Math.round(phase.algorithmMAE).toLocaleString()}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="h-96">
              <h3 className="text-lg font-semibold mb-4">MAE Comparison Across Phases</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={phasePerformance}
                  margin={{ top: 5, right: 30, bottom: 55, left: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="phase"
                    label={{ value: 'Phase', position: 'bottom', offset: 35 }}
                  />
                  <YAxis label={{ value: 'Mean Absolute Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="playerMAE" 
                    name="Your MAE" 
                    stroke={BLUE} 
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="algorithmMAE" 
                    name="Algorithm MAE" 
                    stroke={RED} 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center mt-8">
              <Button 
                onClick={handleDownloadData}
                className="w-64"
              >
                Download All Phase Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameFinish;