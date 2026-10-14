// A53: fiber preference split from portion.js (R10-F1). Import via js/core/plan.js (facade).
// R10-F1: prefer variants reaching 25 g fiber (veg portion ×1/×1.5/×2, kiwi, staple) when kcal/protein still fit.
export const VEG_MULTS = [1, 1.5, 2];
export const FIBER_MIN = 25;
export const FIBER_W = 10;
export const fiberNote = f => `膳食纤维约 ${Math.round(f)} g（目标 25–30 g）：可把白米换成糙米/杂粮，或加一份蔬菜/猕猴桃。`;
// R10-F1: when a day still misses fiber, also try higher-fiber staples in order (STAPLE_ALT_W penalty) and keep the better score.
export const FIBER_ALT = { riceCooked: ['brownRiceCooked', 'sweetPotatoBaked'], brownRiceCooked: ['sweetPotatoBaked'], milletCooked: ['sweetPotatoBaked'] };
export const STAPLE_ALT_W = 20;
