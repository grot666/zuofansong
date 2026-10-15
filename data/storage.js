// A66/R13-2: storage class per food (RESEARCH-R13 §R13.2). Closed set; no shelf-life numbers (FoodKeeper not reachable).
// pantry = dry/canned/condiment; frozen = bought frozen; keeps = whole roots/gourds/cabbages/eggs/hard fruit; fresh = chilled.
export const STORES = ['fresh', 'frozen', 'keeps', 'pantry'];
const L = (store, ids) => ids.split(' ').map(id => [id, store]);
export const STORE = Object.fromEntries([
  ...L('pantry', 'rice millet cornGrits oatRice brownRice blackRice buckwheat oats oatsDry pasta wwPasta noodle tunaLight tunaAlbacore whey garlic soy oyster oil oliveOil sesamePaste peanuts walnut riceCooked brownRiceCooked milletCooked'),
  ...L('frozen', 'basa sole edamame frozenVeg peas'),
  ...L('keeps', 'sweetPotato sweetPotatoBaked yam potato taro cabbage napa carrot winterMelon pumpkin lotusRoot mantou banana avocado egg eggUSDA eggBoiled eggWhite wwBread konjac apple orange kiwi kiwiGold kiwiUSDA'),
  ...L('fresh', 'chickenBreast chickenThigh chickenSkin chickenGizzard porkLoin porkBelly leanBeef duckBlood shrimp seabass hairtail pomfret crucian salmon tofuFirm tofuSilk tofuUSDA doufugan qianzhang soymilk milk milkSkim yogurt shanghaiQing jimaocai spinach spinachUSDA lettuce kongxincai beansprout shiitake enoki mushroom woodEar kelp broccoli broccoliUSDA cauliflower tomato cucumber loofah zucchini eggplant greenPepper celery snowPea bitterMelon jiaobai corn thighRoasted breastRoasted shrimpCooked'),
]);
export const withStore = list => { for (const f of list) if (!f.store && STORE[f.id]) f.store = STORE[f.id]; return list; };
