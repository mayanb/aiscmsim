// lib/generateItems.ts
import { createClient } from '@supabase/supabase-js'
import { GAME_CONFIG } from '../config';  // Adjust path as needed

// lib/generateItems.ts
export interface Item {
    phase: number;
    decision_number: number;
    last_year_sales: number;
    month: number;
    temperature: number;
    social_sentiment: number | null;
    advertising_spend: number | null;
    online_traffic: number | null;
    actual_demand: number;
    algorithm_prediction: number; // Added this field
    session_id?: number;
}

export const generateSessionItems = (sessionId: number): Item[] => {
    const random = new SeededRandom(sessionId);
    const items: Item[] = [];
    
    // Helper function to generate base features
    const generateBaseFeatures = () => {
        const last_year_sales = Math.round(random.normal(1000, 100));
        const month = random.randInt(1, 13);
        const base_temp = 62.5 + 32.5 * Math.sin(2 * Math.PI * (month - 6) / 12);
        const temperature = Math.round(random.normal(base_temp, 8));
        return { last_year_sales, month, temperature };
    };

    // Helper function to calculate demand
    const calculateDemand = (
        base: { last_year_sales: number; month: number; temperature: number },
        phase: number,
        sentiment: number | null = null,
        traffic: number | null = null,
        advertising: number | null = null
    ): number => {
        const base_effect = 0.9 * base.last_year_sales;
        const seasonal_effect = 300 * Math.cos(2 * Math.PI * (base.month - 11) / 12);
        const temperature_effect = -2.0 * Math.pow(base.temperature - 70, 2) / 50;

        let additional_effects = 0;
        if (sentiment !== null) {
            const sentiment_effect = 20 * sentiment;
            additional_effects += sentiment_effect;

            if (traffic !== null) {
                const sentiment_multiplier = Math.max(0, (sentiment + 10) / 20);
                const traffic_effect = 0.05 * (traffic - 1000) * sentiment_multiplier;
                additional_effects += traffic_effect;
            }
        }

        if (advertising !== null) {
            const advertising_effect = 0.3 * (advertising - 100);
            additional_effects += advertising_effect;
        }

        let demand = base_effect + seasonal_effect + temperature_effect + additional_effects;

        // Add base noise
        demand += random.normal(0, 30);
        
        // Apply regime shift in phase 5
        if (phase === 5) {
            const isExtremeTempProduct = base.temperature > 85 || base.temperature < 55;
            if (isExtremeTempProduct) {
                // Products in extreme temperatures (like accessories) are affected more by economic downturn
                demand *= 0.7;
                // Add more randomness to make the original algorithm less predictive
                demand += random.normal(0, 100);
            }
        }
        demand = Math.round(demand);

        return Math.max(0, demand); // Ensure demand is non-negative
    };

    // Generate items for all phases
    [1, 2, 3, 4, 5].forEach(phase => {
        const numDecisions = phase === 1 ? GAME_CONFIG.PHASE_1_DECISIONS : 
                           phase === 2 ? GAME_CONFIG.PHASE_2_DECISIONS : 
                           phase === 3 ? GAME_CONFIG.PHASE_3_DECISIONS : 
                           phase === 4 ? GAME_CONFIG.PHASE_4_DECISIONS : GAME_CONFIG.PHASE_5_DECISIONS;

        for (let i = 0; i < numDecisions; i++) {
            const base = generateBaseFeatures();
            const sentiment = Math.round(random.uniform(-10, 10));
            const advertising = Math.round(random.uniform(100, 150));
            const online_traffic = Math.round(random.uniform(1000 + 10 * (advertising || 0), 100));


            // const sentiment = phase >= 3 ? Math.round(random.uniform(-10, 10)) : null;
            // const advertising = phase >= 4 ? Math.round(random.uniform(100, 150)) : null;
            // const online_traffic = phase >= 4 ? Math.round(random.uniform(1000 + 10 * (advertising || 0), 100)) : null;

            items.push({
                phase,
                decision_number: i + 1,
                ...base,
                social_sentiment: sentiment,
                advertising_spend: advertising,
                online_traffic,
                actual_demand: calculateDemand(base, phase, sentiment, online_traffic, advertising),
                algorithm_prediction: calculateAlgorithmPrediction(base.last_year_sales, base.month, base.temperature),
                session_id: sessionId,
            });
        }
    });

    return items;
};

// Seeded random number generator
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    random(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    normal(mean: number, std: number): number {
        const u1 = this.random();
        const u2 = this.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z0 * std;
    }

    uniform(min: number, max: number): number {
        return min + this.random() * (max - min);
    }

    randInt(min: number, max: number): number {
        return Math.floor(this.uniform(min, max));
    }
}


// Function to calculate algorithm's prediction
export const calculateAlgorithmPrediction = (
    last_year_sales: number,
    month: number,
    temperature: number
): number => {
    // Simplified linear model
    const seasonal = Math.cos(2 * Math.PI * (month - 11) / 12);
    const tempEffect = -2.0 * Math.pow(temperature - 70, 2) / 50;
    
    return Math.round(0.9 * last_year_sales + 300 * seasonal + tempEffect);
};

//export { generateSessionItems };
