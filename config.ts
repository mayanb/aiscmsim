// config.ts or lib/config.ts
export const GAME_CONFIG = {
    PHASE_1_DECISIONS: 20,
    PHASE_2_DECISIONS: 20,
    PHASE_3_DECISIONS: 20, 
    PHASE_4_DECISIONS: 20,
    // PHASE_3_DECISIONS: 20, 
    // PHASE_4_DECISIONS: 25,
    // PHASE_1_DECISIONS: 5,
    // PHASE_2_DECISIONS: 5,
    // PHASE_3_DECISIONS: 5, 
    // PHASE_4_DECISIONS: 5,
  } as const;  // Using 'as const' makes these truly readonly constants