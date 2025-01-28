import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

interface Phase1SummaryProps {
  sessionId: string;
  playerId: string;
  playerName: string;
  onPhaseComplete: () => void;
}

interface ItemDetails {
  id: string;
  phase: number;
  decision_number: number;
  last_year_sales: number;
  month: number;
  temperature: number;
  category: string;
  actual_demand: number;
}

interface PlayerDecision {
    player_id: string;
    players: { name: string }[];
    item_id: string;
    player_prediction: number;
  }
  

interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  total_error: number;
  average_error: number;
}

const Phase1Summary: React.FC<Phase1SummaryProps> = ({ 
  sessionId, 
  playerId,
  playerName,
  onPhaseComplete 
}) => {
  const [decisionData, setDecisionData] = useState<Array<{
    decision_number: number;
    student_prediction: number;
    actual_demand: number;
    error: number;
    last_year_sales: number;
    month: number;
    temperature: number;
    category: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchPhase1Data = async () => {
      try {
        // Fetch items for phase 1
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('phase', 1)
          .eq('session_id', sessionId)
          .order('decision_number');

        if (itemsError) throw itemsError;

        // Fetch the player's decisions for phase 1
        const { data: playerDecisions, error: decisionsError } = await supabase
          .from('decisions')
          .select('*')
          .eq('player_id', playerId)
          .eq('phase', 1)
          .order('created_at');

        if (decisionsError) throw decisionsError;

        // Fetch all players' decisions for phase 1
        const { data: allDecisions, error: allDecisionsError } = await supabase
          .from('decisions')
          .select(`
            player_id,
            players(name),
            item_id,
            player_prediction
          `)
          .eq('phase', 1)
          .eq('session_id', sessionId);

        if (allDecisionsError) throw allDecisionsError;

        // Combine items with player decisions
        const combinedData = items.map(item => {
          const playerDecision = playerDecisions.find(d => d.item_id === item.id);
          const error = playerDecision 
            ? Math.abs(item.actual_demand - playerDecision.player_prediction)
            : 0;

          return {
            decision_number: item.decision_number,
            student_prediction: playerDecision ? playerDecision.player_prediction : 0,
            actual_demand: item.actual_demand,
            error,
            last_year_sales: item.last_year_sales,
            month: item.month,
            temperature: item.temperature,
            category: item.category
          };
        });

        // Calculate leaderboard
        // Update the type of playerErrors
        const playerErrors: { [key: string]: number } = {};
        const playerDecisionCounts: { [key: string]: number } = {};

        allDecisions.forEach(decision => {
        const playerId = decision.player_id;
        const item = items.find(i => i.id === decision.item_id);
        
        if (item) {
            const error = Math.abs(item.actual_demand - decision.player_prediction);
            
            playerErrors[playerId] = (playerErrors[playerId] || 0) + error;
            playerDecisionCounts[playerId] = (playerDecisionCounts[playerId] || 0) + 1;
        }
        });


          
        const leaderboardData: LeaderboardEntry[] = Object.entries(playerErrors).map(([id, totalError]) => {
        const playerDecision = allDecisions.find(d => d.player_id === id) as PlayerDecision;
        const playerName = playerDecision?.players?.[0]?.name || 'Unknown';
        
        return {
            player_id: id,
            player_name: playerName,
            total_error: totalError,
            average_error: totalError / (playerDecisionCounts[id] || 1)
        };
        }).sort((a, b) => a.average_error - b.average_error);

        setDecisionData(combinedData);
        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error('Error fetching phase 1 data:', err);
        setError('Failed to load phase 1 summary');
      } finally {
        setLoading(false);
      }
    };

    fetchPhase1Data();
  }, [sessionId, playerId]);

  // Custom tooltip for the line chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const decision = decisionData.find(d => d.decision_number === Number(label));
      if (!decision) return null;

      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-bold mb-2">Decision {label}</p>
          <p>Category: {decision.category}</p>
          <p>Last Year's Sales: {Math.round(decision.last_year_sales).toLocaleString()}</p>
          <p>Month: {new Date(0, decision.month - 1).toLocaleString('default', { month: 'long' })}</p>
          <p>Temperature: {Math.round(decision.temperature)}°F</p>
          <p className="text-blue-600">Your Prediction: {Math.round(decision.student_prediction).toLocaleString()}</p>
          <p className="text-green-600">Actual Demand: {Math.round(decision.actual_demand).toLocaleString()}</p>
          <p className="text-red-600">Absolute Error: {Math.round(decision.error).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading Phase 1 Summary...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  // Calculate overall performance metrics
  const totalError = decisionData.reduce((sum, d) => sum + d.error, 0);
  const averageError = totalError / decisionData.length;
  const playerRank = leaderboard.findIndex(entry => entry.player_name === playerName) + 1;
  const classAverageError = leaderboard.reduce((sum, entry) => sum + entry.average_error, 0) / leaderboard.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader className="bg-slate-50">
          <CardTitle>Phase 1: Demand Prediction Performance</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Your Overall Error</h3>
              <p className="text-2xl font-bold">{Math.round(averageError).toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Your Rank</h3>
              <p className="text-2xl font-bold">{playerRank} / {leaderboard.length}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-600 mb-1">Class Average Error</h3>
              <p className="text-2xl font-bold">
                {Math.round(classAverageError).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Performance Visualization */}
          <div className="h-96 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={decisionData} 
                margin={{ top: 5, right: 20, bottom: 30, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="decision_number"
                  label={{ value: 'Decision Number', position: 'bottom', offset: 20 }}
                />
                <YAxis 
                  label={{ value: 'Demand / Error', angle: -90, position: 'insideLeft', offset: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="student_prediction" 
                  stroke="#2563eb" 
                  name="Your Predictions" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual_demand" 
                  stroke="#10b981" 
                  name="Actual Demand" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="error" 
                  stroke="#ef4444" 
                  name="Your Error" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Leaderboard */}
          <Card className="mb-8">
            <CardHeader className="bg-slate-50">
              <CardTitle>Phase 1 Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Rank</th>
                    <th className="p-2">Player</th>
                    <th className="p-2">Average Error</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr 
                      key={entry.player_id} 
                      className={`${
                        entry.player_name === playerName 
                          ? 'bg-blue-50 font-bold' 
                          : ''
                      } border-b`}
                    >
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{entry.player_name}</td>
                      <td className="p-2">{Math.round(entry.average_error).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Continue to Phase 2 */}
          <div className="text-center">
            <Button 
              onClick={onPhaseComplete} 
              className="w-64 text-lg"
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