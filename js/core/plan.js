// A45 facade: plan.js was split into js/core/plan/{select,portion,budget,shopping}.js. Re-exports keep every import path stable.
export * from './plan/select.js';
export * from './plan/portion.js';
export * from './plan/fiber.js';
export * from './plan/day.js';
export * from './plan/budget.js';
export * from './plan/shopping.js';
export { COOKED_TO_RAW, SHOP_ALIAS, twinOf } from './foods.js';
