import { withStore } from './storage.js';
// Shanghai takeaway / breakfast ESTIMATES (research R5.1, fatsecret.cn generic entries, 2026-10-15).
// All verified:false -> UI shows ≈. Fiber is not given by source; set to a rough estimate (marked fiberEst).
// Default portions are design assumptions, editable when logging.
const T = (id, name, py, kcal, protein, fat, carbs, unitName, unitG, extra = {}) => ({ id, name, py, cat: '外食', kcal, protein, fat, carbs, fiber: extra.fiber ?? 1, fiberEst: true, priceCNYPer500g: 0, tags: ['外卖', '上海'], source: 'fatsecret.cn 估算 (R5.1)', verified: false, fatClass: extra.fatClass || 'low', unit: { name: unitName, g: unitG }, ease: 5, type: 'dish', defaultPortionG: unitG, portionNote: '默认份量为估算，按实际碗/盒大小调整', ...extra });
const C = (id, name, py, cat, kcal, protein, fat, carbs, fiber, price, tags, extra = {}) => ({ id, name, py, cat, kcal, protein, fat, carbs, fiber, priceCNYPer500g: price, tags, source: extra.source || 'CFCT (未逐条核对)', verified: false, ease: 4, ...extra });
export const FOODS3 = [
  T('shengjian', '生煎包', 'shengjianbao', 282, 10.0, 12.8, 34.3, '个', 25),
  T('xiaolong', '小笼包', 'xiaolongbao', 238, 12.3, 11.5, 22.6, '笼(8个)', 280),
  T('xiaohuntun', '鲜肉小馄饨', 'xiaohuntun', 259, 10.4, 6.9, 37.6, '碗(15个,汤不计)', 255),
  T('congyoumian', '葱油拌面', 'congyoubanmian', 144, 4.3, 4.8, 20.7, '份', 350),
  T('lamian', '兰州拉面', 'lanzhoulamian', 117, 4.9, 4.0, 15.2, '碗(含汤)', 500),
  T('dapai', '炸大排(浇头)', 'dapai', 250, 17.1, 17.9, 4.5, '块', 120, { fiber: 0 }),
  T('huangmenji', '黄焖鸡米饭', 'huangmenji', 167, 14.1, 7.8, 9.5, '份', 500),
  T('luroufan', '卤肉饭', 'luroufan', 187, 5.9, 9.6, 18.9, '份', 350),
  T('danchaofan', '蛋炒饭', 'danchaofan', 164, 5.1, 7.9, 17.8, '份', 350),
  T('baozaifan', '煲仔饭', 'baozaifan', 152, 6, 5, 21, '份', 300),
  T('malatang', '麻辣烫(不含汤)', 'malatang', 70, 4.0, 3.6, 6.4, '份', 500, { fiber: 1.5 }),
  T('xiangguo', '麻辣香锅', 'malaxiangguo', 99, 4.6, 5.2, 9.7, '份', 500, { fiber: 1.5 }),
  T('suancaiyu', '酸菜鱼(鱼+菜)', 'suancaiyu', 95, 13.4, 2.8, 3.2, '份', 400, { fatClass: 'neutral' }),
  T('jianbing', '煎饼果子', 'jianbingguozi', 161, 6.3, 2.6, 27.1, '个', 250),
  T('guanbing', '鸡蛋灌饼', 'jidanguanbing', 253, 12.3, 7.5, 34.7, '个', 200),
  T('roujiamo', '肉夹馍', 'roujiamo', 238, 13.7, 6.4, 34.1, '个', 200),
  T('fantuan', '饭团/粢饭团', 'fantuan', 163, 4.3, 3.4, 28.2, '个', 150, { fiber: 0.5 }),
  T('chayedan', '茶叶蛋', 'chayedan', 147, 12.5, 10.1, 1.1, '个', 60, { fiber: 0, fatClass: 'high' }),
  T('paomo', '羊肉泡馍', 'yangroupaomo', 133, 6.0, 4.9, 17.7, '碗', 500),
  T('yangchunmian', '阳春面(估)', 'yangchunmian', 110, 3.5, 2.5, 19, '碗(含汤)', 450, { source: '估算（参考挂面+猪油）' }),
  { id: 'kiwiUSDA', name: '猕猴桃(绿,USDA)', py: 'mihoutao', cat: '水果', kcal: 61, protein: 1.14, fat: 0.52, carbs: 14.66, fiber: 3.0, priceCNYPer500g: 10, tags: ['水果', '高纤', '助眠'], source: 'USDA FDC 168153', verified: true, ease: 5, unit: { name: '个', g: 75 } },
  C('soymilk', '无糖豆浆', 'doujiang', '蛋白', 31, 3.0, 1.6, 1.2, 0.3, 4, ['早餐', '豆制品'], { unit: { name: '杯', g: 300 } }),
  C('konjac', '魔芋丝', 'moyusi', '主食', 10, 0.1, 0.1, 3.3, 3.0, 8, ['低卡', '高纤'], {}),
  C('duckBlood', '鸭血', 'yaxue', '蛋白', 108, 13.6, 0.4, 12.4, 0, 6, ['蛋白', '低脂'], {}),
  C('eggWhite', '蛋清', 'danqing', '蛋白', 52, 10.9, 0.17, 0.73, 0, 8, ['蛋白', '低脂'], { unit: { name: '个蛋清', g: 33 }, source: 'USDA FDC 172183', verified: true }),
  C('lotusRoot', '莲藕', 'lianou', '蔬菜', 47, 1.2, 0.2, 11.5, 2.2, 5, ['根茎'], {fdcCompare:{id:169250,kcal:74,protein:2.6,note:'FDC 为美式莲藕数据，国产鲜藕含水更高，保留 CFCT 值并标≈'}}),
  C('pumpkin', '南瓜', 'nangua', '蔬菜', 26, 1.0, 0.1, 6.5, 0.5, 2, ['微波', '便宜'], {source:'USDA FDC 168448',verified:true,fdcVerifiedAt:'2026-10-15'}),
  C('snowPea', '荷兰豆', 'helandou', '蔬菜', 42, 2.8, 0.2, 7.55, 2.6, 8, [], {source:'USDA FDC 170010',verified:true,fdcVerifiedAt:'2026-10-15'}),
  C('bitterMelon', '苦瓜', 'kugua', '蔬菜', 17, 1.0, 0.17, 3.7, 2.8, 5, [], {source:'USDA FDC 168393',verified:true,fdcVerifiedAt:'2026-10-15'}),
  C('hairtail', '带鱼', 'daiyu', '蛋白', 127, 17.7, 4.9, 3.1, 0, 25, ['鱼'], { fatClass: 'high' }),
  C('pomfret', '鲳鱼', 'changyu', '蛋白', 140, 18.5, 7.3, 0, 0, 30, ['鱼'], { fatClass: 'high' }),
  C('crucian', '鲫鱼', 'jiyu', '蛋白', 108, 17.1, 2.7, 3.8, 0, 12, ['鱼', '煲汤'], { fatClass: 'high' }),
  C('chickenGizzard', '鸡胗', 'jizhen', '蛋白', 118, 19.2, 2.8, 4.0, 0, 12, ['蛋白', '卤味'], {}),
  // Caffeine drinks for R-04 sleep nudges. Coffee: USDA FDC 171890 (brewed, 1 kcal/100 g); latte/milk tea are rough estimates.
  C('coffee', '黑咖啡/美式', 'kafei', '饮品', 1, 0.1, 0, 0, 0, 0, ['饮品', '咖啡因'], { unit: { name: '杯', g: 350 }, source: 'USDA FDC 171890', verified: true, fatClass: 'neutral' }),
  C('latte', '拿铁(全脂奶)', 'natie', '饮品', 54, 3.0, 2.8, 4.4, 0, 0, ['饮品', '咖啡因'], { unit: { name: '杯', g: 350 }, fatClass: 'neutral', source: '估算' }),
  T('milkTea', '奶茶(少糖)', 'naicha', 55, 0.8, 2.0, 8.5, '杯', 500, { fiber: 0, cat: '饮品', tags: ['饮品', '咖啡因', '外卖'] }),
  C('greenTea', '绿茶(无糖)', 'lvcha', '饮品', 1, 0.2, 0, 0, 0, 0, ['饮品', '咖啡因'], { unit: { name: '杯', g: 300 }, fatClass: 'neutral', source: 'USDA FDC 171917', verified: true }),
  // G4: Shanghai canteen set meals (PROMPT §6). Rough composite estimates, unverified.
  T('canteenMeatSet', '食堂套餐(一荤两素+饭)', 'shitangtaocan', 150, 7, 6, 17, '份', 550, { fiber: 1.2, tags: ['食堂', '上海'], source: '估算：按常见食堂配菜（米饭 200 g + 荤菜 + 素菜）拆分加总，未核对', priceCNYPer500g: 15 }),
  T('canteenPorkSet', '食堂红烧肉套餐', 'shitanghongshaorou', 190, 6, 10, 18, '份', 500, { fiber: 0.8, tags: ['食堂', '上海'], source: '估算：按常见食堂配菜（米饭 200 g + 荤菜 + 素菜）拆分加总，未核对', priceCNYPer500g: 16 }),
  T('canteenFishSet', '食堂鱼块套餐', 'shitangyukuai', 140, 8, 5, 16, '份', 500, { fiber: 1, fatClass: 'neutral', tags: ['食堂', '上海'], source: '估算：按常见食堂配菜（米饭 200 g + 荤菜 + 素菜）拆分加总，未核对', priceCNYPer500g: 17 }),
  T('canteenVegSet', '食堂两素一饭', 'shitangliangsu', 125, 3.5, 4.5, 18, '份', 450, { fiber: 1.5, fatClass: 'neutral', tags: ['食堂', '上海'], source: '估算：按常见食堂配菜（米饭 200 g + 荤菜 + 素菜）拆分加总，未核对', priceCNYPer500g: 10 }),
];
// A31: 好吃 flag lives in data (read by core/scores.js); custom foods may set `tasty: true` too.
for (const f of FOODS3) if (['hairtail', 'pomfret', 'canteenMeatSet', 'canteenPorkSet'].includes(f.id)) f.tasty = true;
// A37: reviewed — every 蛋白/主食/外食 food not flagged tasty above is explicitly not tasty.
for (const f of FOODS3) if (['蛋白', '主食', '外食'].includes(f.cat) && typeof f.tasty !== 'boolean') f.tasty = false;
withStore(FOODS3); // A66
