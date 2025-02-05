import React, { useEffect, useState, useMemo } from 'react';
import { generateSessionItems, getMarketSegment, calculateAlgorithmConfidence, SeededRandom } from '../../lib/generateItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Phase4IntroProps {
  sessionId: string;
  playerId: string;
  onBeginPhase4: () => void;
}

// Color constants
const RED = "#DC2626";
const BLUE = "#2563EB";



// const Phase4Intro: React.FC<Phase4IntroProps> = ({ sessionId, playerId, onBeginPhase4 }) => {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

const Phase4Intro: React.FC<Phase4IntroProps> = ({ onBeginPhase4 }) => {
    const random = new SeededRandom(42);
    const sampleData = useMemo(() => {
        const items = generateSessionItems(42, false).filter(item => item.phase === 4);
        
        return items.map(item => ({
          ...item,
          market_segment: getMarketSegment(item.online_traffic),
          confidence: calculateAlgorithmConfidence(
            random, 
            item.online_traffic,
            item.advertising_spend,
            item.phase
          ),
          prediction_error: Math.abs(item.algorithm_prediction - item.actual_demand)
        }))
        .filter(item => item.advertising_spend !== null && item.online_traffic !== null);
      }, []);
    
      const byTraffic = useMemo(() => 
        [...sampleData].sort((a, b) => (a.online_traffic || 0) - (b.online_traffic || 0)),
        [sampleData]
      );
    
      const byAdvertising = useMemo(() => 
        [...sampleData].sort((a, b) => (a.advertising_spend || 0) - (b.advertising_spend || 0)),
        [sampleData]
      );
    
      const formatLargeNumber = (value: number): string => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`;
        }
        return value.toString();
    };    
  
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <Alert className="bg-blue-50">
          <AlertDescription className="text-lg space-y-4">
            <p>
              Welcome to Phase 4 - The Digital Transformation!
            </p>
            <p>
              Your retail division has been performing well, and the company has decided to increase its 
              investment in digital marketing and e-commerce. Over the past month, we've launched targeted 
              advertising campaigns and revamped our online store to drive more traffic to our product pages.
            </p>
            <p>
              Our data science team has been monitoring the algorithm's performance, and they've noticed some 
              interesting patterns. While the algorithm continues to be a valuable tool, its performance seems 
              to vary across different market conditions.
            </p>
            <p>
              You'll now have access to two new metrics:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>Online Traffic: The number of daily visits to each product's page</li>
              <li>Advertising Spend: Our current investment in promoting each product</li>
            </ul>
            <p>
              Additionally, for each prediction, the algorithm will now show you its confidence score, 
              indicating how reliable it believes its forecast to be.
            </p>
          </AlertDescription>
        </Alert>
        
        <Card>
        <CardHeader>
          <CardTitle>Online Traffic vs Algorithm Absolute Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="online_traffic" 
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  label={{ value: 'Daily Online Traffic', position: 'bottom', offset: 20 }}
                  tickFormatter={formatLargeNumber}
                  ticks={[800, 1000, 1200, 1400, 1600, 1800, 2000]}
                />
                <YAxis 
                  dataKey="prediction_error"
                  label={{ value: 'Algorithm Absolute Error', angle: -90, position: 'insideLeft', offset: -10, dy: 60 }}
                  tickFormatter={formatLargeNumber}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="text-sm">Traffic: {data.online_traffic?.toLocaleString()}</p>
                          <p className="text-sm">Algorithm Prediction: {Math.round(data.algorithm_prediction).toLocaleString()}</p>
                          <p className="text-sm">Actual Demand: {Math.round(data.actual_demand).toLocaleString()}</p>
                          <p className="text-sm">Algorithm Absolute Error: {Math.round(data.prediction_error).toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  data={byTraffic}
                  fill={RED}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advertising Spend vs Algorithm Absolute Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="advertising_spend" 
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  label={{ value: 'Advertising Spend ($)', position: 'bottom', offset: 20 }}
                  ticks={[50, 70, 90, 110, 130, 150]}
                />
                <YAxis 
                  dataKey="prediction_error"
                  label={{ value: 'Algorithm Absolute Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }}
                  tickFormatter={formatLargeNumber}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="text-sm">Ad Spend: ${data.advertising_spend}</p>
                          <p className="text-sm">Algorithm Prediction: {Math.round(data.algorithm_prediction).toLocaleString()}</p>
                          <p className="text-sm">Actual Demand: {Math.round(data.actual_demand).toLocaleString()}</p>
                          <p className="text-sm">Algorithm Absolute Error: {Math.round(data.prediction_error).toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  data={byAdvertising}
                  fill={RED}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Algorithm Confidence vs Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="confidence" 
                  type="number"
                  domain={[0, 100]}
                  label={{ value: 'Algorithm Confidence (%)', position: 'bottom', offset: 20 }}
                  ticks={[0, 20, 40, 60, 80, 100]}
                />
                <YAxis 
                  dataKey="prediction_error"
                  label={{ value: 'Algorithm Absolute Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }}
                  tickFormatter={formatLargeNumber}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="text-sm">Confidence: {data.confidence}%</p>
                          <p className="text-sm">Algorithm Absolute Error: {Math.round(data.prediction_error).toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  data={sampleData}
                  fill={BLUE}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Combined Effects on Algorithm Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="online_traffic" 
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  label={{ value: 'Daily Online Traffic', position: 'bottom', offset: 20 }}
                  tickFormatter={formatLargeNumber}
                  ticks={[800, 1000, 1200, 1400, 1600, 1800, 2000]}
                />
                <YAxis 
                  dataKey="advertising_spend"
                  domain={[50, 150]}
                  ticks={[50, 70, 90, 110, 130, 150]}
                  label={{ value: 'Advertising Spend ($)', angle: -90, position: 'insideLeft', offset: -10, dy: 50 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="text-sm">Traffic: {data.online_traffic?.toLocaleString()}</p>
                          <p className="text-sm">Ad Spend: ${data.advertising_spend}</p>
                          <p className="text-sm">Algorithm Absolute Error: {Math.round(data.prediction_error).toLocaleString()}</p>
                          <p className="text-sm">Algorithm Confidence: {data.confidence}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {sampleData.map((entry, index) => {
                  const maxError = Math.max(...sampleData.map(d => d.prediction_error));
                  const ratio = entry.prediction_error / maxError;
                  
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
        </CardContent>
      </Card>

      <div className="flex justify-center mt-8">
        <Button onClick={onBeginPhase4} className="w-48">Begin Phase 4</Button>
      </div>
    </div>
  );
};

export default Phase4Intro;