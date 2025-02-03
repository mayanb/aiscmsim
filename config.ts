// config.ts or lib/config.ts
export const GAME_CONFIG = {
    PHASE_1_DECISIONS: 10,
    PHASE_2_DECISIONS: 15,
    PHASE_3_DECISIONS: 20, 
    PHASE_4_DECISIONS: 25,
    PHASE_5_DECISIONS: 20,
  } as const;  // Using 'as const' makes these truly readonly constants