// lib/generateItems.ts
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
    algorithm_prediction: number;
    session_id?: number;
}

// First define interfaces for our return types
export interface Phase4Features {
    online_traffic: number;
    advertising_spend: number;
}

// Seeded random number generator
export class SeededRandom {
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


// utils.ts
export const getMarketSegment = (traffic: number | null): string | null => {
    if (traffic === null) return null;
    if (traffic > 1500) return 'Digital-First';
    if (traffic <= 1000) return 'Traditional';
    return 'Mixed';
};


export const generateSessionItems = (sessionId: number, increaseDigitalLikelihood: boolean, 
    numPhaseDecisions: number[] = [GAME_CONFIG.PHASE_1_DECISIONS, GAME_CONFIG.PHASE_2_DECISIONS, GAME_CONFIG.PHASE_3_DECISIONS, GAME_CONFIG.PHASE_4_DECISIONS]
): Item[] => {
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


    const generatePhase4Features = (decisionNumber: number, increaseDigital: boolean): Phase4Features => {
        // Base probabilities (at decision 1)
        const baseDigitalProb = 0.3;   // 30% digital
        const baseMixedProb = 0.4;     // 40% mixed
        // Traditional is remaining 30%
    
        // Calculate how much to adjust probabilities based on decision number
        let digitalProb, mixedProb;
        if (increaseDigital) {
            // Increase digital probability from 30% to 60% over the decisions
            // Decrease traditional probability from 30% to 10%
            // Keep mixed relatively stable, adjusting only slightly from 40% to 30%
            const maxDecisions = numPhaseDecisions[3];
            const progressRatio = (decisionNumber - 1) / (maxDecisions - 1);
            
            // Increase digital probability linearly from 0.3 to 0.6
            digitalProb = baseDigitalProb + (0.3 * progressRatio);
            // Decrease mixed probability slightly from 0.4 to 0.3
            mixedProb = baseMixedProb - (0.1 * progressRatio);
        } else {
            // Keep original probabilities if flag is false
            digitalProb = baseDigitalProb;
            mixedProb = baseMixedProb;
        }
    
        const segment_type = random.random();
        let online_traffic: number;
    
        if (segment_type < digitalProb) { // Digital-First segment
            online_traffic = Math.round(random.normal(2000, 200));
        } else if (segment_type < (digitalProb + mixedProb)) { // Mixed segment
            online_traffic = Math.round(random.normal(1250, 150));
        } else { // Traditional segment
            online_traffic = Math.round(random.normal(800, 100));
        }
    
        const base_advertising = 100 + (online_traffic - 800) / 10;
        const advertising_spend = Math.max(50, Math.round(random.normal(base_advertising, 15)));
    
        return {
            online_traffic,
            advertising_spend
        };
    };


    // Generate items for all phases
    [1, 2, 3, 4].forEach(phase => {
        const numDecisions = phase === 1 ? numPhaseDecisions[0] : 
                           phase === 2 ? numPhaseDecisions[1] : 
                           phase === 3 ? numPhaseDecisions[2] : numPhaseDecisions[3];

        for (let i = 0; i < numDecisions; i++) {
            const base = generateBaseFeatures();
            let sentiment: number | null = null;
            let advertising: number | null = null;
            let traffic: number | null = null;

            if (phase < 4) {
                sentiment = Math.round(random.uniform(-10, 10));
            }
            if (phase === 4) {
                const phase4Features = generatePhase4Features(i, increaseDigitalLikelihood);
                advertising = phase4Features.advertising_spend;
                traffic = phase4Features.online_traffic;
            }
            const actual_demand = calculateDemand(random, base, phase, sentiment, traffic, advertising);
            const algorithm_prediction = calculateAlgorithmPrediction(random, base.last_year_sales, base.month, base.temperature, phase, traffic, advertising);


            items.push({
                phase,
                decision_number: i + 1,
                ...base,
                social_sentiment: sentiment,
                advertising_spend: advertising,
                online_traffic: traffic,
                actual_demand,
                algorithm_prediction,
                session_id: sessionId,
            });
        }
    });

    return items;
};


// Helper function to calculate demand
export const calculateDemand = (
    random: SeededRandom,
    base: { last_year_sales: number; month: number; temperature: number },
    phase: number,
    sentiment: number | null = null,
    traffic: number | null = null,
    advertising: number | null = null
): number => {
    let demand = 0;

    const base_effect = 0.9 * base.last_year_sales;
    const seasonal_effect = 300 * Math.cos(2 * Math.PI * (base.month - 11) / 12);
    const temperature_effect = -2.0 * Math.pow(base.temperature - 70, 2) / 50;
    demand = base_effect + seasonal_effect + temperature_effect;

    if (sentiment != null) {
        if (phase < 4) {
            demand += 20 * sentiment;
        }
    }

    if (phase === 4 && traffic !== null && advertising !== null) {
        // Market segment effects
        if (traffic > 1500) {  // Digital-First
            demand += 0.5 * advertising + 0.1 * traffic;
            demand += random.normal(0, 150);  // Higher volatility
        } else if (traffic <= 1000) {  // Traditional
            demand += 0.2 * advertising + 0.02 * traffic;
            demand += random.normal(0, 50);   // Lower volatility
        } else {  // Mixed
            demand += 0.35 * advertising + 0.05 * traffic;
            demand += random.normal(0, 100);  // Medium volatility
        }
        
        // Additional effects based on advertising levels
        if (advertising > 130) {
            demand *= 1.1;  // High advertising boost
        }
    }

    // Base noise and final adjustments
    demand += random.normal(0, 15);
    return Math.round(Math.max(0, demand));
};

const calculateAlgorithmPrediction = (
    random: SeededRandom,
    last_year_sales: number,
    month: number,
    temperature: number, 
    phase: number,
    traffic: number | null = null,
    advertising: number | null = null
): number => {
    // Base prediction components
    const seasonal = Math.cos(2 * Math.PI * (month - 11) / 12);
    const tempEffect = -2.0 * Math.pow(temperature - 70, 2) / 50;
    let prediction = 0.9 * last_year_sales + 300 * seasonal + tempEffect;
    
    if (phase === 4 && traffic !== null && advertising !== null) {
        // Adjust prediction based on segment
        if (traffic > 1500) {  // Digital-First
            prediction *= 0.85;  // Systematic underprediction
        } else if (traffic <= 1000) {  // Traditional
            prediction *= 1.05;  // Slight overprediction
        } else {  // Mixed
            prediction *= 0.95;  // Mild underprediction
        }
        
        // Add some noise to prediction
        prediction += random.normal(0, 15);
    }

    // if (phase < 4) {
    //     prediction += random.normal(0, 5);
    // }
    
    return Math.round(Math.max(0, prediction));
};

// Separate function for confidence calculation (to be used in utils.ts)
export const calculateAlgorithmConfidence = (
    random: SeededRandom,
    traffic: number | null,
    advertising: number | null,
    phase: number
): number => {
    if (phase !== 4 || traffic === null || advertising === null) {
        return 90; // Base confidence for non-phase-4 or missing data
    }

    let confidence = 90;
    
    // Segment-based confidence adjustment
    if (traffic > 1500) {  // Digital-First
        confidence *= 0.7;
    } else if (traffic <= 1000) {  // Traditional
        confidence *= 0.9;
    } else {  // Mixed
        confidence *= 0.8;
    }
    
    // High advertising reduces confidence
    if (advertising > 130) {
        confidence *= 0.8;
    }
    confidence += random.normal(0, 2)
    
    return Math.round(Math.max(0, Math.min(100, confidence)));
};

// export { generateSessionItems };
