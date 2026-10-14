// A53: fiber preference split from portion.js (R10-F1). Import via js/core/plan.js (facade).
import { FIBER_TARGET, FIBER_RANGE, PEAS_SIDE_G } from '../fiber.js';
// R10-F1: prefer variants reaching FIBER_MIN g fiber (veg portion ×1/×1.5/×2, kiwi, staple) when kcal/protein still fit.
export const VEG_MULTS = [1, 1.5, 2];
export const FIBER_MIN = FIBER_TARGET.min;
export const FIBER_W = 10;
export const fiberNote = f => `膳食纤维约 ${Math.round(f)} g（目标 ${FIBER_RANGE}）：可把白米换成糙米/杂粮，或加一份蔬菜/猕猴桃。`;
// R10-F1: when a day still misses fiber, also try higher-fiber staples in order (STAPLE_ALT_W penalty) and keep the better score.
export const FIBER_ALT = { riceCooked: ['brownRiceCooked', 'sweetPotatoBaked'], brownRiceCooked: ['sweetPotatoBaked'], milletCooked: ['sweetPotatoBaked'] };
export const STAPLE_ALT_W = 20;
// 烤红薯 variety cap (07:07 order): at most SP_MAX_PER_WEEK sweet-potato days; once reached, a sweet-potato day falls back to 杂粮 staples and fiber swaps skip it.
export const SP_ID = 'sweetPotatoBaked';
export const SP_MAX_PER_WEEK = 3;
export const SP_CAP_ALT = ['brownRiceCooked', 'milletCooked'];
export const stapleOptions = (staple, capped) => (capped && staple === SP_ID ? SP_CAP_ALT : [staple]);
export const fiberAlts = (staple, capped) => (FIBER_ALT[staple] || []).filter(id => !(capped && id === SP_ID));
export const FIBER_SIDE = [['peas', PEAS_SIDE_G]]; // 青豆 per lunch/dinner on a day still short of fiber
