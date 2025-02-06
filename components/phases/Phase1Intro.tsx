import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GAME_CONFIG } from '../../config';

interface Phase1IntroProps {
  onBeginPhase1: () => void;
}

const Phase1Intro: React.FC<Phase1IntroProps> = ({ onBeginPhase1 }) => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      <Alert className="bg-blue-50">
        <AlertDescription className="text-lg">
          Welcome to your first day in TRENDY THREADS INC.&apos;s Demand Planning Division! 
          Time to put your AI model to work in real-world scenarios.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Your First Challenge: Predicting Product Demand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="prose max-w-none">
            <p className="text-lg">
              The holiday rush is approaching, and our CEO needs accurate demand forecasts for our product lines. 
              Your manager has given you access to three key pieces of information that our analytics team has 
              found to be most predictive of sales:
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg my-4">
              <h3 className="text-md font-semibold mb-2">📊 Your Data Toolkit:</h3>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Historical Sales:</strong> Last year&apos;s average monthly sales for this product line</li>
                <li><strong>Seasonality:</strong> The current month we&apos;re forecasting for</li>
                <li><strong>Weather Impact:</strong> Average temperature for the current month</li>
              </ul>
            </div>

            <h3 className="text-lg font-semibold mt-6">Using Your AI Assistant</h3>
            <p>
              Remember that AI model you built before joining us? It&apos;s time to put it to work! For each product, you should:
            </p>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Input the three data points (last year&apos;s sales, month, and temperature) into your model</li>
              <li>Use your model&apos;s prediction as your forecast</li>
            </ol>

            <div className="bg-blue-50 p-4 rounded-lg my-4">
              <h3 className="text-md font-semibold mb-2">🎯 Phase 1 Goals:</h3>
              <p>You&apos;ll make {GAME_CONFIG.PHASE_1_DECISIONS} predictions, and for each one:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Review the data provided</li>
                <li>Run the numbers through your AI model</li>
                <li>Submit your model&apos;s prediction</li>
                <li>See how accurate your forecast was</li>
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg my-4">
              <h3 className="text-md font-semibold mb-2">💡 Why This Matters:</h3>
              <p>
                At TRENDY THREADS INC., accurate forecasting is crucial:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Predict too low?</strong> Empty shelves and disappointed customers</li>
                <li><strong>Predict too high?</strong> Excess inventory tying up valuable warehouse space</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg my-4">
              <h3 className="text-md font-semibold mb-2">🔍 What to Watch For:</h3>
              <p className="mb-2">As you make your predictions, pay attention to these aspects to deepen your understanding:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Pattern Recognition:</strong> How do sales vary with different temperatures? Are certain months consistently higher or lower?</li>
                <li><strong>Model Performance:</strong> When does your model seem to predict well? When does it struggle?</li>
                <li><strong>Feature Impact:</strong> Which of the three factors (historical sales, month, temperature) seems to have the strongest influence on your predictions?</li>
                <li><strong>Error Patterns:</strong> When your predictions are off, are they consistently too high or too low? What might this tell you?</li>
              </ul>
              <p className="mt-4 text-sm italic">Keep track of your observations - they&apos;ll help you reflect on your performance at the end of this phase!</p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button 
              onClick={onBeginPhase1} 
              className="w-64 h-12 text-lg"
            >
              Start Making Predictions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase1Intro;