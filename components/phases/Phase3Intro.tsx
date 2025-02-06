import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateSessionItems, SeededRandom } from '../../lib/generateItems';
import { GAME_CONFIG } from '../../config';

interface Phase3IntroProps {
  sessionId: string;
  playerId: string;
  onBeginPhase3: () => void;
}

const Phase3Intro: React.FC<Phase3IntroProps> = ({ sessionId, playerId, onBeginPhase3 }) => {
  const sampleData = useMemo(() => {
    const random = new SeededRandom(42);
    const items = generateSessionItems(42, false, [0, 0, 20, 0])
      .filter(item => item.phase === 3)
      .slice(0, 20)
      .map(item => ({
        ...item,
        sentiment_score: item.social_sentiment,
        prediction_error: Math.abs(item.algorithm_prediction - item.actual_demand),
        relative_error: (item.algorithm_prediction - item.actual_demand) / item.actual_demand
      }));
    return items;
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-blue-800">Phase 3: Your Secret Weapon</h1>

      <Alert className="bg-blue-50">
        <AlertDescription className="text-lg space-y-4">
          <p>
            The marketing team at TRENDY THREADS INC. has been running focus groups to gather feedback 
            on our product lines. As a test, they gathered sentiment scores for 20 recent products that 
            TrendAI made predictions for.
          </p>
          <p>
            Each product was rated by the focus group on a scale from -10 (strongly dislike) to +10 
            (strongly like). TrendAI doesn&apos;t have access to this information - it&apos;s your unique insight 
            into customer preferences!
          </p>
          <p>
            Let&apos;s look at how these sentiment scores relate to actual demand and TrendAI&apos;s prediction accuracy...
          </p>
        </AlertDescription>
      </Alert>

      <div className="bg-purple-50 p-4 rounded-lg my-4">
        <h3 className="text-md font-semibold mb-2">🔍 What to Watch For in Phase 3:</h3>
        <p className="mb-2">As you analyze this data and prepare for Phase 3, consider:</p>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Information Edge:</strong> You now have sentiment data that TrendAI can&apos;t see - how might this help?</li>
          <li><strong>Pattern Recognition:</strong> Does positive/negative sentiment correlate with higher/lower demand?</li>
          <li><strong>AI Limitations:</strong> When does TrendAI seem to make larger errors? Are these related to sentiment?</li>
          <li><strong>Adjustment Strategy:</strong> How will you use sentiment scores to adjust TrendAI&apos;s predictions?</li>
          <li><strong>Market Understanding:</strong> What does the focus group feedback tell you about customer preferences?</li>
        </ul>
        <p className="mt-4 text-sm italic">Keep these questions in mind as you review the data below - they&apos;ll help you develop your strategy!</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Focus Group Results Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Sentiment Score vs Actual Demand</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 55, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="sentiment_score"
                    type="number"
                    domain={[-10, 10]}
                    label={{ value: 'Focus Group Sentiment Score', position: 'bottom', offset: 35 }}
                    tick={{ dy: 15 }}
                  />
                  <YAxis 
                    dataKey="actual_demand"
                    label={{ value: 'Actual Demand', angle: -90, position: 'insideLeft', offset: -10 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm">Sentiment: {data.sentiment_score}</p>
                            <p className="text-sm">Actual Demand: {Math.round(data.actual_demand).toLocaleString()}</p>
                            <p className="text-sm">TrendAI Prediction: {Math.round(data.algorithm_prediction).toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    data={sampleData}
                    fill="#2563EB"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 mb-16">
              <h3 className="text-lg font-semibold mb-4">Sentiment Score vs TrendAI Error</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 100, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="sentiment_score"
                    type="number"
                    domain={[-10, 10]}
                    label={{ value: 'Focus Group Sentiment Score', position: 'bottom', offset: 35 }}
                    tick={{ dy: 15 }}
                  />
                  <YAxis 
                    dataKey="prediction_error"
                    label={{ value: 'TrendAI Absolute Error', angle: -90, position: 'insideLeft', offset: -10 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="text-sm">Sentiment: {data.sentiment_score}</p>
                            <p className="text-sm">TrendAI Error: {Math.round(data.prediction_error).toLocaleString()}</p>
                            <p className="text-sm">Prediction: {Math.round(data.algorithm_prediction).toLocaleString()}</p>
                            <p className="text-sm">Actual: {Math.round(data.actual_demand).toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    data={sampleData}
                    fill="#DC2626"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Last Year&apos;s Sales</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead className="font-bold">Focus Group Score</TableHead>
                    <TableHead>TrendAI Prediction</TableHead>
                    <TableHead>Actual Demand</TableHead>
                    <TableHead>TrendAI Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(0, item.month - 1).toLocaleString('default', { month: 'long' })}
                      </TableCell>
                      <TableCell>{Math.round(item.last_year_sales).toLocaleString()}</TableCell>
                      <TableCell>{Math.round(item.temperature)}°F</TableCell>
                      <TableCell className="font-bold">{item.sentiment_score !== null ? Math.round(item.sentiment_score) : 'N/A'}</TableCell>
                      <TableCell>{Math.round(item.algorithm_prediction).toLocaleString()}</TableCell>
                      <TableCell>{Math.round(item.actual_demand).toLocaleString()}</TableCell>
                      <TableCell>{Math.round(item.prediction_error).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <Button 
              onClick={onBeginPhase3} 
              className="w-48"
            >
              Begin Phase 3
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase3Intro;