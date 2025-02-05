'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'


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
    params: {id: string}
};

export default function SessionSummaryPage({ params }: Props) {
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{sessionName}</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Player Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                  Player Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead onClick={() => handleSort('phase1_mae')} className="cursor-pointer">
                  Phase 1 MAE {sortField === 'phase1_mae' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead onClick={() => handleSort('phase2_mae')} className="cursor-pointer">
                  Phase 2 MAE {sortField === 'phase2_mae' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead onClick={() => handleSort('phase3_mae')} className="cursor-pointer">
                  Phase 3 MAE {sortField === 'phase3_mae' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead onClick={() => handleSort('phase4_mae')} className="cursor-pointer">
                  Phase 4 MAE {sortField === 'phase4_mae' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSummaries.map((player) => (
                <TableRow key={player.player_id}>
                  <TableCell>{player.name}</TableCell>
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

      <div className="mb-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Phase {selectedPhase} Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] mb-18">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={phaseData}
               margin={{ top: 5, right: 30, bottom: 40, left: 10 }} // Increased bottom margin from default
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="decision_number" 
                  label={{ value: 'Decision Number', position: 'bottom', offset: 25 }}
                />
                <YAxis label={{ value: 'Demand', angle: -90, position: 'insideLeft', offset: -2 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual_demand" 
                  stroke="#8884d8" 
                  name="Actual Demand" 
                />
                <Line 
                  type="monotone" 
                  dataKey="class_average" 
                  stroke="#82ca9d" 
                  name="Class Average" 
                />
                {selectedPhase !== '1' && (
                  <Line 
                    type="monotone" 
                    dataKey="algorithm_prediction" 
                    stroke="#ff7300" 
                    name="Algorithm Prediction" 
                  />
                )}

                {/* <Line 
                  type="monotone" 
                  dataKey="best_student" 
                  stroke="#ffc658" 
                  name="Most Accurate Student" 
                />
                <Line 
                  type="monotone" 
                  dataKey="worst_student" 
                  stroke="#ff0000" 
                  name="Least Accurate Student" 
                /> */}

              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}