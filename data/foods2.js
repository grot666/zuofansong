// Cooked / packaged items verified against USDA FoodData Central API (SR Legacy, per 100 g), 2026-10-15.
// See docs research (grot666/culiang-jianzhi-chufang docs/RESEARCH.md R3.1, RESEARCH-R4.md R4.1).
const U = (id, name, py, cat, fdc, kcal, protein, fat, carbs, fiber, price, tags, extra = {}) => ({ id, name, py, cat, kcal, protein, fat, carbs, fiber, priceCNYPer500g: price, tags, source: 'USDA FDC ' + fdc, verified: true, ease: 4, ...extra });
const E = (id, name, py, cat, kcal, protein, fat, carbs, fiber, price, tags, extra = {}) => ({ id, name, py, cat, kcal, protein, fat, carbs, fiber, priceCNYPer500g: price, tags, source: extra.source || 'CFCT', verified: false, ease: 4, ...extra });
export const FOODS2 = [
  U('riceCooked', '白米饭(熟)', 'mifan', '主食', 168878, 130, 2.69, 0.28, 28.2, 0.4, 1.3, ['主食', '熟重'], { unit: { name: '碗', g: 150 }, ease: 5 }),
  U('brownRiceCooked', '糙米饭(熟)', 'caomifan', '主食', 169704, 123, 2.74, 0.97, 25.6, 1.6, 3, ['杂粮', '熟重'], { unit: { name: '碗', g: 150 } }),
  U('milletCooked', '小米饭(熟)', 'xiaomifan', '主食', 168871, 119, 3.51, 1.0, 23.7, 1.3, 2.4, ['杂粮', '熟重'], { unit: { name: '碗', g: 150 } }),
  U('oatsDry', '燕麦(干,USDA)', 'yanmai', '主食', 169705, 389, 16.9, 6.9, 66.3, 10.6, 10, ['早餐', '高纤', '杂粮'], { unit: { name: '份', g: 40 }, ease: 5 }),
  U('sweetPotatoBaked', '烤红薯(熟)', 'kaohongshu', '主食', 168483, 90, 2.01, 0.15, 20.7, 3.3, 4, ['薯类', '熟重'], { ease: 5 }),
  U('thighRoasted', '去皮鸡腿肉(熟)', 'jituirou', '蛋白', 172388, 179, 24.8, 8.15, 0, 0, 18, ['蛋白', '熟重'], { fatClass: 'neutral', unit: { name: '份', g: 120 } }),
  U('breastRoasted', '鸡胸肉(熟)', 'jixiongrou', '蛋白', 171477, 165, 31.0, 3.57, 0, 0, 14, ['蛋白', '低脂', '熟重'], { unit: { name: '份', g: 100 } }),
  U('tunaLight', '水浸金枪鱼罐头(淡/鳍鱼)', 'jinqiangyu', '蛋白', 173709, 86, 19.4, 0.96, 0, 0, 35, ['鱼', '罐头', '懒人'], { unit: { name: '罐(氥干)', g: 100 }, ease: 5, note: '汞含量低（FDA “最佳选择”）' }),
  U('tunaAlbacore', '水浸白金枪鱼罐头', 'baijinqiangyu', '蛋白', 175158, 128, 23.6, 2.97, 0, 0, 45, ['鱼', '罐头'], { unit: { name: '罐(氥干)', g: 100 }, ease: 5, note: '汞约为淡金枪鱼 3 倍，每周≤ 1 罐更稳妥' }),
  U('eggUSDA', '鸡蛋(USDA)', 'jidan', '蛋白', 171287, 143, 12.6, 9.51, 0.72, 0, 6, ['蛋白', '早餐'], { fatClass: 'high', unit: { name: '个', g: 50 }, ease: 5, aliasOf: 'egg' }),
  U('eggBoiled', '水煮蛋', 'shuizhudan', '蛋白', 173424, 155, 12.6, 10.6, 1.12, 0, 6, ['蛋白', '早餐', '便利店'], { fatClass: 'high', unit: { name: '个', g: 50 }, ease: 5 }),
  U('shrimpCooked', '虾(熟)', 'xia', '蛋白', 175180, 99, 24.0, 0.28, 0.2, 0, 35, ['海鲜', '低脂', '熟重'], {}),
  U('salmon', '三文鱼(熟)', 'sanwenyu', '蛋白', 175168, 206, 22.1, 12.4, 0, 0, 60, ['鱼'], { fatClass: 'high' }),
  U('milkSkim', '脱脂牛奶', 'tuozhiniunai', '蛋白', 171269, 34, 3.37, 0.08, 4.96, 0, 8, ['乳制品', '低脂'], { unit: { name: '盒', g: 250 } }), // A65/R13-1 聚餐 lever
  U('broccoliUSDA', '西兰花(USDA)', 'xilanhua', '蔬菜', 170379, 34, 2.82, 0.37, 6.64, 2.6, 6, ['高纤', '烤蔬菜'], { ease: 5, aliasOf: 'broccoli' }),
  U('carrot', '胡萝卜', 'huluobo', '蔬菜', 170393, 41, 0.93, 0.24, 9.58, 2.8, 2, ['烤蔬菜', '便宜'], { ease: 5 }),
  U('spinachUSDA', '菠菜(USDA)', 'bocai', '蔬菜', 168462, 23, 2.86, 0.39, 3.63, 2.2, 5, ['绿叶菜'], {}),
  U('mushroom', '白蘑菇', 'mogu', '蔬菜', 169251, 22, 3.09, 0.34, 3.26, 1.0, 8, ['菌菇'], { atwaterNote: 'FDC 对菌菇用专属能量系数，低于 4/4/9 估算' }),
  U('peas', '青豆(豌豆)', 'qingdou', '蔬菜', 170419, 81, 5.42, 0.4, 14.4, 5.7, 8, ['高纤', '速冻'], { ease: 5 }),
  U('avocado', '牛油果', 'niuyouguo', '水果', 171705, 160, 2.0, 14.7, 8.53, 6.7, 30, ['水果', '高纤'], { fatClass: 'high' }),
  U('oliveOil', '橄榄油', 'ganlanyou', '油脂', 171413, 884, 0, 100, 0, 0, 40, ['油'], { fatClass: 'high', unit: { name: '茶匙', g: 4.5 } }),
  E('tofuUSDA', '老豆腐(USDA 外国硬豆腐近似)', 'laodoufu', '蛋白', 144, 17.3, 8.72, 2.78, 2.3, 4, ['豆制品'], { source: 'USDA FDC 172475 (近似)' }),
  E('garlic', '大蒜', 'dasuan', '蔬菜', 149, 6.36, 0.5, 33.1, 2.1, 6, ['调味'], {source:'USDA FDC 169230',verified:true,fdcVerifiedAt:'2026-10-15'}),
  E('greenPepper', '青椒', 'qingjiao', '蔬菜', 20, 0.86, 0.17, 4.64, 1.7, 4, [], { source: 'USDA FDC 170427', verified: true }),
  E('eggplant', '茄子', 'qiezi', '蔬菜', 25, 0.98, 0.18, 5.88, 3.0, 3, ['微波'], {source:'USDA FDC 169228',verified:true,fdcVerifiedAt:'2026-10-15'}),
  E('celery', '西芹', 'xiqin', '蔬菜', 14, 0.69, 0.17, 2.97, 1.6, 3, ['高纤'], {source:'USDA FDC 169988',verified:true,fdcVerifiedAt:'2026-10-15'}),
  E('cauliflower', '花菜', 'huacai', '蔬菜', 25, 1.92, 0.28, 4.97, 2.0, 4, ['烤蔬菜'], { source: 'USDA FDC 169986', verified: true }),
  E('kongxincai', '空心菜', 'kongxincai', '蔬菜', 19, 2.6, 0.2, 3.13, 2.1, 4, ['绿叶菜'], {source:'USDA FDC 169301',verified:true,fdcVerifiedAt:'2026-10-15'}),
  E('oyster', '蠔油', 'haoyou', '调味', 114, 1.6, 0.1, 26.5, 0.2, 10, ['调味'], {unit: { name: '勺', g: 10 }, fdcCompare:{id:174529,kcal:51,protein:1.35,note:'FDC 为美式蚝油；国产蠔油含糖/淀粉更高，保留 CFCT 值并标≈'}}),
  E('soy', '生抽', 'shengchou', '调味', 63, 5.6, 0.1, 10.1, 0.2, 8, ['调味'], {unit: { name: '勺', g: 10 }, fdcCompare:{id:174277,kcal:53,protein:8.14,note:'FDC 为日式酱油(shoyu)；国产生抽配方不同，保留 CFCT 值并标≈'}}),
  E('kiwiGold', '金果猕猴桃', 'jinguo', '水果', 63, 1.02, 0.28, 15.8, 1.4, 20, ['水果', '助眠'], {unit: { name: '个', g: 90 }, source:'USDA FDC 168211',verified:true,fdcVerifiedAt:'2026-10-15'}),
  E('orange', '橙子', 'chengzi', '水果', 47, 0.94, 0.12, 11.8, 2.4, 6, ['水果'], {unit: { name: '个', g: 150 }, source:'USDA FDC 169097',verified:true,fdcVerifiedAt:'2026-10-15'}),
  E('edamame', '毛豆', 'maodou', '蛋白', 121, 11.9, 5.2, 8.91, 5.2, 8, ['豆类', '高纤', '速冻'], {source:'USDA FDC 168411',verified:true,fdcVerifiedAt:'2026-10-15'}),
];
// A31: 好吃 flag lives in data (read by core/scores.js); custom foods may set `tasty: true` too.
for (const f of FOODS2) if (['shrimpCooked', 'thighRoasted', 'eggUSDA', 'salmon'].includes(f.id)) f.tasty = true;
// A37: reviewed — every 蛋白/主食/外食 food not flagged tasty above is explicitly not tasty.
for (const f of FOODS2) if (['蛋白', '主食', '外食'].includes(f.cat) && typeof f.tasty !== 'boolean') f.tasty = false;
