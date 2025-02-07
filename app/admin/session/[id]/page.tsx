'use client'

import { useState, useEffect, use } from 'react';
import { supabase } from '../../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { calculateAlgorithmConfidence, SeededRandom } from '../../../../lib/generateItems';

const random = new SeededRandom(42);

interface Decision {
    player_id: string | number;  // Added number since we see IDs are numbers
    player_prediction: number;
    items: {
      phase: number;
      actual_demand: number;
      session_id: number;
    };  // Single object, not array
    players: {
      id: number;
      name: string;
    };  // Single object, not array
  }

  // Type for all possible phase-related keys
  type PhaseKey = 'phase1_total' | 'phase2_total' | 'phase3_total' | 'phase4_total' |
                  'phase1_count' | 'phase2_count' | 'phase3_count' | 'phase4_count' |
                  'phase1_mae' | 'phase2_mae' | 'phase3_mae' | 'phase4_mae';
  
  interface PlayerSummary {
    player_id: number;
    name: string;
    phase1_mae: number;
    phase2_mae: number;
    phase3_mae: number;
    phase4_mae: number;
    phase1_count: number;
    phase2_count: number;
    phase3_count: number;
    phase4_count: number;
    phase1_total: number;
    phase2_total: number;
    phase3_total: number;
    phase4_total: number;
  }
  
  interface PlayerMAEAccumulator {
    [key: number]: PlayerSummary;  // Change from string to number
  }
  

interface PhaseData {
  decision_number: number;
  actual_demand: number;
  class_average: number;
  best_student: number;
  worst_student: number;
  algorithm_prediction?: number;
}

type Props = {
    params: Promise<{id: string}>
};

export default function SessionSummaryPage(props: Props) {
  const params = use(props.params);
  const sessionId = Number(params.id);
  const [sessionName, setSessionName] = useState<string>('')
  const [playerSummaries, setPlayerSummaries] = useState<PlayerSummary[]>([])
  const [selectedPhase, setSelectedPhase] = useState<string>('1')
  const [phaseData, setPhaseData] = useState<PhaseData[]>([])
  const [sortField, setSortField] = useState<keyof PlayerSummary>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(true)


  // Single useEffect for initial data load
  useEffect(() => {
      const initializeData = async () => {
      await fetchSessionData();
      await fetchPhaseData(selectedPhase);
      };

      initializeData();
  }, [params.id]); // Depend on params.id directly

  // Phase change effect
  useEffect(() => {
      fetchPhaseData(selectedPhase);
  }, [selectedPhase]);


  const fetchSessionData = async () => {
      try {
        // Fetch session name
        const { data: session } = await supabase
          .from('sessions')
          .select('name')
          .eq('id', sessionId)
          .single();
    
        if (session) {
          setSessionName(session.name)
        }
    
      // Get MAEs by phase for each player
      const { data } = await supabase
      .from('decisions')
      .select(`
        player_id,
        player_prediction,
        items!inner (
          phase,
          actual_demand,
          session_id
        ),
        players!inner (
          id,
          name
        )
      `)
      .eq('items.session_id', sessionId) as unknown as { data: Decision[] };
    
            
      console.log('Data:', data);

        if (!data) return;
    
        const playerSummaries = data.reduce<PlayerMAEAccumulator>((acc, decision) => {
          const playerId = typeof decision.player_id === 'string' 
              ? parseInt(decision.player_id) 
              : decision.player_id;
              
          if (!acc[playerId]) {
            acc[playerId] = {
              player_id: playerId,
              name: decision.players.name, 
              phase1_mae: 0,
              phase2_mae: 0,
              phase3_mae: 0,
              phase4_mae: 0,
              phase1_count: 0,
              phase2_count: 0,
              phase3_count: 0,
              phase4_count: 0,
              phase1_total: 0,
              phase2_total: 0,
              phase3_total: 0,
              phase4_total: 0,
            };
          }
    
          const phase = decision.items.phase; // Access phase directly from items object
          const error = Math.abs(decision.player_prediction - decision.items.actual_demand);
          
          const totalKey = `phase${phase}_total` as PhaseKey;
          const countKey = `phase${phase}_count` as PhaseKey;
          const maeKey = `phase${phase}_mae` as PhaseKey;
    
          acc[playerId][totalKey] += error;
          acc[playerId][countKey] += 1;
          acc[playerId][maeKey] = acc[playerId][totalKey] / acc[playerId][countKey];
    
          return acc;
        }, {});
    
        setPlayerSummaries(Object.values(playerSummaries));
        setLoading(false);
    
      } catch (error) {
        console.error('Error fetching session data:', error)
        setLoading(false)
      }
    }

  const fetchPhaseData = async (phase: string) => {
      try {
        // Fetch all decisions for this phase
        const { data: decisions } = await supabase
          .from('decisions')
          .select(`
            *,
            items!inner(
              phase,
              decision_number,
              actual_demand,
              algorithm_prediction
            )
          `)
          .eq('items.session_id', sessionId)
          .eq('items.phase', phase)

        if (!decisions) return

        // Process data for visualization
        const processedData: { [key: number]: PhaseData } = {}

        decisions.forEach(decision => {
          const decisionNumber = decision.items.decision_number
          if (!processedData[decisionNumber]) {
            processedData[decisionNumber] = {
              decision_number: decisionNumber,
              actual_demand: decision.items.actual_demand,
              class_average: 0,
              best_student: 0,
              worst_student: 0, 
              algorithm_prediction: decision.items.algorithm_prediction
            }
          }

          // Update class average
          const currentCount = processedData[decisionNumber].class_average === 0 ? 0 : 1
          processedData[decisionNumber].class_average = 
            (processedData[decisionNumber].class_average * currentCount + decision.player_prediction) / (currentCount + 1)
        })

        // Find best student
        const playerErrors: { [key: string]: number } = {}
        decisions.forEach(decision => {
          const error = Math.abs(decision.player_prediction - decision.items.actual_demand)
          if (!playerErrors[decision.player_id]) {
            playerErrors[decision.player_id] = error
          } else {
            playerErrors[decision.player_id] += error
          }
        })

        const sortedPlayerErrors = Object.entries(playerErrors).sort(([, a], [, b]) => a - b)
        const bestStudent = sortedPlayerErrors[0][0]
        const worstStudent = sortedPlayerErrors[sortedPlayerErrors.length - 1][0]


        // Add best student's predictions
        decisions
          .filter(d => d.player_id === bestStudent)
          .forEach(d => {
            processedData[d.items.decision_number].best_student = d.player_prediction
          })

          // Add worst student's predictions
          decisions
          .filter(d => d.player_id === worstStudent)
          .forEach(d => {
              processedData[d.items.decision_number].worst_student = d.player_prediction
          })
      

        setPhaseData(Object.values(processedData).sort((a, b) => a.decision_number - b.decision_number))
      } catch (error) {
        console.error('Error fetching phase data:', error)
      }
    }

  const handleSort = (field: keyof PlayerSummary) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedSummaries = [...playerSummaries].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortField] > b[sortField] ? 1 : -1
    } else {
      return a[sortField] < b[sortField] ? 1 : -1
    }
  })

  if (loading) {
    return <div>Loading...</div>
  }

  const handleDownloadData = async () => {
    try {
      // Fetch all items for this session
      const { data: items } = await supabase
        .from('items')
        .select('*')
        .eq('session_id', sessionId)
        .order('phase, decision_number');

      if (!items) return;

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Process data for each phase
      for (let phase = 1; phase <= 4; phase++) {
        const phaseItems = items
          .filter(item => item.phase === phase)
          .map(item => {
            const baseData = {
              'Last Year Demand': item.last_year_sales,
              'Month': new Date(0, item.month - 1).toLocaleString('default', { month: 'long' }),
              'Temperature': item.temperature,
              'Actual Demand': item.actual_demand,
            };

            if (phase >= 2) {
              Object.assign(baseData, {
                'TrendAI Prediction': item.algorithm_prediction,
              });
            }

            if (phase == 3) {
              Object.assign(baseData, {
                'Focus Group Sentiment': item.social_sentiment,
              });
            }

            if (phase === 4) {
              Object.assign(baseData, {
                'TrendAI Confidence': calculateAlgorithmConfidence(
                    random, item.online_traffic, item.advertising_spend, 4), 
                'Advertising Spend': item.advertising_spend,
                'Online Traffic': item.online_traffic,
              });
            }

            return baseData;
          });

        // Create worksheet for the phase
        const ws = XLSX.utils.json_to_sheet(phaseItems);
        XLSX.utils.book_append_sheet(wb, ws, `Phase ${phase}`);
      }

      // Save the file
      XLSX.writeFile(wb, `${sessionName}_data.xlsx`);
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading session data...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-800">{sessionName}</h1>
        <Button 
          onClick={handleDownloadData}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Download Session Data
        </Button>
      </div>

      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle>Player Performance Summary</CardTitle>
          <CardDescription>
            Mean Absolute Error (MAE) across all phases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-slate-50">
                  Player Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead onClick={() => handleSort('phase1_mae')} className="cursor-pointer hover:bg-slate-50">
                  Phase 1 MAE {sortField === 'phase1_mae' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead onClick={() => handleSort('phase2_mae')} className="cursor-pointer hover:bg-slate-50">
                  Phase 2 MAE {sortField === 'phase2_mae' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead onClick={() => handleSort('phase3_mae')} className="cursor-pointer hover:bg-slate-50">
                  Phase 3 MAE {sortField === 'phase3_mae' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead onClick={() => handleSort('phase4_mae')} className="cursor-pointer hover:bg-slate-50">
                  Phase 4 MAE {sortField === 'phase4_mae' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSummaries.map((player) => (
                <TableRow key={player.player_id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{Math.round(player.phase1_mae).toLocaleString()}</TableCell>
                  <TableCell>{Math.round(player.phase2_mae).toLocaleString()}</TableCell>
                  <TableCell>{Math.round(player.phase3_mae).toLocaleString()}</TableCell>
                  <TableCell>{Math.round(player.phase4_mae).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Demand Predictions by Phase</CardTitle>
              <CardDescription>
                Comparing actual demand with class predictions
              </CardDescription>
            </div>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Phase 1</SelectItem>
                <SelectItem value="2">Phase 2</SelectItem>
                <SelectItem value="3">Phase 3</SelectItem>
                <SelectItem value="4">Phase 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={phaseData}
                margin={{ top: 5, right: 30, bottom: 40, left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="decision_number" 
                  label={{ value: 'Decision Number', position: 'bottom', offset: 25 }}
                />
                <YAxis label={{ value: 'Demand', angle: -90, position: 'insideLeft', offset: -5 }} />
                <Tooltip 
                    formatter={(value: number, name: string) => {
                        if (name === "Class Average") {
                        return [Math.round(value).toLocaleString(), name];
                        }
                        return [typeof value === 'number' ? value.toLocaleString() : value, name];
                    }}
                    />                
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual_demand" 
                  stroke="#4B5563" 
                  name="Actual Demand" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="class_average" 
                  stroke="#2563EB" 
                  name="Class Average" 
                  strokeWidth={2}
                />
                {selectedPhase !== '1' && (
                  <Line 
                    type="monotone" 
                    dataKey="algorithm_prediction" 
                    stroke="#DC2626" 
                    name="TrendAI Prediction" 
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}