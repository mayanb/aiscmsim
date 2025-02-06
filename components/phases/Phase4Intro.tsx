import React, { useMemo } from 'react';
import { generateSessionItems, getMarketSegment, calculateAlgorithmConfidence, SeededRandom } from '../../lib/generateItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
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
        const items = generateSessionItems(42, false, [0, 0, 0, 20]).filter(item => item.phase === 4);
        
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
      <h1 className="text-3xl font-bold text-center text-blue-800">Phase 4: The Digital Transformation and a Shifting Landscape</h1>
        <Alert className="bg-blue-50">
          <AlertDescription className="text-lg space-y-4">
          <p>
            Congratulations on your successful demand predictions at TRENDY THREADS INC.! Your innovative use of TrendAI 
            and focus group insights has caught the attention of senior leadership.
          </p>
          <p>
            The company is now embarking on an ambitious digital transformation initiative. We&apos;ve revamped our 
            e-commerce platform and launched targeted digital marketing campaigns. This shift has introduced new 
            dynamics in how customers discover and interact with our products. While the TrendAI continues to be a valuable tool, 
            its performance seems to vary across different market conditions.
          </p>
            <p>
              To help you make demand forecasts in this shifting landscape, the data science team has added two new metrics to your dashboard:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Online Traffic:</strong> The number of daily visits to each product&apos;s page</li>
              <li><strong>Advertising Spend:</strong> Our current investment in promoting each product</li>
            </ul>
            <p>
              The data science team has also developed a new "confidence score" feature for TrendAI. 
              For each prediction, TrendAI will now tell you how confident it is in its forecast. 
              They suggest paying attention to these confidence scores - they might give you helpful hints about when to trust TrendAI&apos;s predictions and when to rely more on your judgment.
            </p>
            <p>
              As our business evolves, your challenge is to adapt your decision-making process. Some products are gaining more online visibility than others, and customer behavior seems to be shifting in response to our digital initiatives. 
              Can you identify these patterns and adjust your forecasts accordingly?
            </p>
            <p className="italic">
              Remember: The retail landscape is changing, and what worked yesterday might not work as well today. Good luck!
            </p>
          </AlertDescription>
        </Alert>

        <div className="bg-purple-50 p-4 rounded-lg my-4">
          <h3 className="text-md font-semibold mb-2">🔍 What to Watch For in Phase 4:</h3>
          <p className="mb-2">As you analyze this data and prepare for Phase 4, consider:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Digital Presence:</strong> How does online visibility affect customer demand? Are there distinct patterns based on traffic levels?</li>
            <li><strong>Marketing Impact:</strong> What happens to demand and prediction accuracy when we increase advertising spend?</li>
            <li><strong>Algorithm Confidence:</strong> What factors seem to influence TrendAI's confidence? Does lower confidence correlate with worse predictions?</li>
            <li><strong>Changing Patterns:</strong> Do you notice any systematic biases in TrendAI's predictions under different conditions?</li>
          </ul>
          <p className="mt-4 text-sm italic">Keep these questions in mind as you review the data below - they'll help you develop your strategy!</p>
        </div>

          <Card>
            <CardHeader>
              <CardTitle>Digital Transformation Results Analysis</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-8">
              <div className="h-96 mb-12">
                <h3 className="text-lg font-semibold mb-4">Online Traffic vs TrendAI Absolute Error</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 55, left: 40 }}>
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
                        label={{ value: 'TrendAI Absolute Error', angle: -90, position: 'insideLeft', offset: -10, dy: 60 }}
                        tickFormatter={formatLargeNumber}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="text-sm">Traffic: {data.online_traffic?.toLocaleString()}</p>
                                <p className="text-sm">TrendAI Prediction: {Math.round(data.algorithm_prediction).toLocaleString()}</p>
                                <p className="text-sm">Actual Demand: {Math.round(data.actual_demand).toLocaleString()}</p>
                                <p className="text-sm">TrendAI Absolute Error: {Math.round(data.prediction_error).toLocaleString()}</p>
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
              
              <div className="h-96 mb-12">
              <h3 className="text-lg font-semibold mb-4">Advertising Spend vs TrendAI Absolute Error</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 55, left: 40 }}>
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
                        label={{ value: 'TrendAI Absolute Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }}
                        tickFormatter={formatLargeNumber}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="text-sm">Ad Spend: ${data.advertising_spend}</p>
                                <p className="text-sm">TrendAI Prediction: {Math.round(data.algorithm_prediction).toLocaleString()}</p>
                                <p className="text-sm">Actual Demand: {Math.round(data.actual_demand).toLocaleString()}</p>
                                <p className="text-sm">TrendAI Absolute Error: {Math.round(data.prediction_error).toLocaleString()}</p>
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

                <div className="h-96 mb-12">
                  <h3 className="text-lg font-semibold mb-4">TrendAI Confidence vs Absolute Error</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 55, left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="confidence" 
                        type="number"
                        domain={[0, 100]}
                        label={{ value: 'TrendAI Confidence (%)', position: 'bottom', offset: 20 }}
                        ticks={[0, 20, 40, 60, 80, 100]}
                      />
                      <YAxis 
                        dataKey="prediction_error"
                        label={{ value: 'TrendAI Absolute Error', angle: -90, position: 'insideLeft', offset: -10, dy: 65 }}
                        tickFormatter={formatLargeNumber}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="text-sm">Confidence: {data.confidence}%</p>
                                <p className="text-sm">TrendAI Absolute Error: {Math.round(data.prediction_error).toLocaleString()}</p>
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

                <div className="h-96 mb-12">
                  <h3 className="text-lg font-semibold mb-4">Combined Digital Transformation Effects on TrendAI Error</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 75, left: 40 }}>
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
                                <p className="text-sm">TrendAI Absolute Error: {Math.round(data.prediction_error).toLocaleString()}</p>
                                <p className="text-sm">TrendAI Confidence: {data.confidence}%</p>
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

            </div>
            <div className="flex justify-center mt-8">
              <Button onClick={onBeginPhase4} className="w-48">Begin Phase 4</Button>
            </div>

          </CardContent>
          </Card>
    </div>
  );
};

export default Phase4Intro;