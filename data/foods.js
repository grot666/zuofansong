// Per 100 g edible portion. Raw unless noted. Sources: CFCT = 中国食物成分表 (标准版 第6版), USDA = FoodData Central.
// priceCNYPer500g = Shanghai estimate (≈). fatClass: high = worthwhile fat, low = hidden/low-value fat.
// yield = cooked/raw weight factor for grains (estimate).
const F = (id, name, py, cat, kcal, protein, fat, carbs, fiber, price, tags, extra = {}) => ({ id, name, py, cat, kcal, protein, fat, carbs, fiber, priceCNYPer500g: price, tags, source: extra.source || 'CFCT', verified: extra.verified ?? false, ease: extra.ease ?? 4, ...extra });
export const FOODS = [
  // grains (raw)
  F('rice','大米','dami','主食',346,7.4,0.8,77.9,0.7,3,['主食','粳米'],{yield:2.3,source:'CFCT'}),
  F('millet','小米','xiaomi','主食',361,9.0,3.1,75.1,1.6,6,['杂粮'],{yield:2.6}),
  F('cornGrits','玉米糁','yumishen','主食',347,7.9,3.0,75.6,3.6,4,['杂粮','玉米渣'],{yield:2.8}),
  F('oatRice','燕麦米','yanmaimi','主食',338,10.1,0.2,77.4,6.0,9,['杂粮','燕麦'],{yield:2.4,soak:true}),
  F('brownRice','糙米','caomi','主食',348,7.7,2.7,75.0,3.4,7,['杂粮'],{yield:2.4,soak:true}),
  F('blackRice','紫米','zimi','主食',345,8.3,1.7,75.1,3.9,10,['杂粮','黑米'],{yield:2.4,soak:true}),
  F('buckwheat','荞麦','qiaomai','主食',337,9.3,2.3,73.0,6.5,8,['杂粮'],{yield:2.5,soak:true}),
  F('oats','燕麦片','yanmaipian','主食',377,15.0,6.7,66.9,5.3,10,['早餐','杂粮'],{source:'CFCT'}),
  F('pasta','意大利面(干)','yidalimian','主食',371,13.0,1.5,74.7,3.2,10,['主食'],{yield:2.4,source:'USDA（未记录 FDC id，待核对）',verified:false}),
  F('wwPasta','全麦意面(干)','quanmaiyimian','主食',352,15.0,2.5,71.0,9.0,14,['主食','高纤'],{yield:2.4,source:'USDA'}),
  F('noodle','挂面','guamian','主食',353,10.3,0.6,75.6,0.7,5,['主食','面条'],{yield:2.6}),
  F('sweetPotato','红薯','hongshu','主食',86,1.6,0.1,20.1,3.0,3,['薯类','替代主食'],{source:'USDA（未记录 FDC id，待核对）',verified:false,ease:5}),
  F('corn','玉米(鲜)','yumi','主食',112,4.0,1.2,22.8,2.9,3,['替代主食'],{ease:5,fdcCompare:{id:169998,kcal:86,protein:3.27,note:'FDC 为美国甜玉米；国产糯/黏玉米热量更高，待核对中国食物成分表'}}),
  F('yam','山药','shanyao','主食',57,1.9,0.2,12.4,0.8,5,['薯类']),
  F('potato','土豆','tudou','主食',81,2.6,0.2,17.8,1.1,2,['薯类'],{ease:4}),
  F('taro','芋头','yutou','主食',81,2.2,0.2,18.1,1.0,5,['薯类']),
  F('mantou','馒头','mantou','主食',223,7.0,1.1,47.0,1.3,5,['主食','早餐']),
  F('wwBread','全麦面包','quanmaimianbao','主食',247,13.0,3.4,41.0,6.0,15,['早餐','便利店'],{source:'USDA'}),
  // protein
  F('egg','鸡蛋','jidan','蛋白',139,13.1,8.6,2.4,0,6,['蛋白','早餐'],{fatClass:'high',unit:{name:'个',g:50},ease:5}),
  F('chickenBreast','鸡胸肉','jixiongrou','蛋白',118,24.6,1.9,0.6,0,10,['蛋白','低脂'],{source:'CFCT'}),
  F('chickenThigh','去皮鸡腿肉','jituirou','蛋白',133,20.0,5.5,0,0,13,['蛋白']),
  F('chickenSkin','鸡皮','jipi','蛋白',440,9.0,44.0,0,0,8,['隐形脂肪'],{fatClass:'low'}),
  F('tofuFirm','北豆腐','beidoufu','蛋白',116,12.2,4.8,2.0,0.5,3,['豆制品','蛋白'],{fatClass:'neutral',ease:5,fdcCompare:{id:172475,kcal:144,protein:17.3,note:'美国 firm tofu 与北豆腐不是同一产品，不套用'}}),
  F('tofuSilk','内酯豆腐','neizhidoufu','蛋白',50,5.0,1.9,3.3,0.4,3,['豆制品']),
  F('doufugan','豆干','dougan','蛋白',197,16.2,11.3,9.6,0.8,8,['豆制品']),
  F('qianzhang','千张','qianzhang','蛋白',262,24.5,16.0,5.5,1.0,10,['豆制品']),
  F('shrimp','虾仁','xiaren','蛋白',48,10.4,0.7,0,0,30,['蛋白','海鲜'],{source:'CFCT'}),
  F('seabass','鲈鱼','luyu','蛋白',97,18.4,2.0,0,0,22,['鱼'],{fatClass:'high',source:'USDA FDC 175142',verified:true}),
  F('basa','巴沙鱼','bashayu','蛋白',90,15.0,3.0,0,0,12,['鱼','冷冻'],{fatClass:'high'}),
  F('sole','龙利鱼','longliyu','蛋白',80,16.0,1.5,0,0,18,['鱼','冷冻'],{fatClass:'high'}),
  F('porkLoin','猪里脊','zhuliji','蛋白',155,20.2,7.9,0.7,0,16,['猪肉','瘦肉'],{fdcCompare:{id:168249,kcal:109,protein:21.0,note:'FDC 为修净纯瘦里脊；市售里脊常带筋膜脂肪，保留 CFCT 值并标≈'}}),
  F('porkBelly','五花肉','wuhuarou','蛋白',568,7.7,59.0,0,0,18,['隐形脂肪'],{fatClass:'low'}),
  F('leanBeef','瘦牛肉','shouniurou','蛋白',113,21.3,2.5,1.3,0,40,['牛肉','瘦肉']),
  F('yogurt','无糖酸奶','wutangsuannai','蛋白',72,3.2,3.5,6.7,0,12,['乳制品','早餐']),
  F('milk','牛奶','niunai','蛋白',61,3.15,3.25,4.8,0,7,['乳制品','早餐'],{unit:{name:'盒',g:250},source:'USDA FDC 171265',verified:true}),
  F('whey','乳清蛋白粉','ruqing','蛋白',380,80,6,8,0,90,['蛋白粉'],{source:'label',unit:{name:'勺',g:30},powder:true}),
  // vegetables
  F('shanghaiQing','上海青','shanghaiqing','蔬菜',15,1.5,0.3,2.7,1.1,3,['绿叶菜'],{ease:5}),
  F('jimaocai','鸡毛菜','jimaocai','蔬菜',17,1.8,0.3,2.8,1.1,5,['绿叶菜']),
  F('spinach','菠菜','bocai','蔬菜',28,2.6,0.3,4.5,1.7,5,['绿叶菜']),
  F('broccoli','西兰花','xilanhua','蔬菜',36,4.1,0.6,4.3,1.6,6,['高纤'],{ease:5}),
  F('cabbage','卷心菜','juanxincai','蔬菜',24,1.5,0.2,4.6,1.0,2,['便宜']),
  F('napa','大白菜','dabaicai','蔬菜',18,1.5,0.1,3.2,0.8,1.5,['便宜']),
  F('tomato','番茄','fanqie','蔬菜',20,0.9,0.2,4.0,0.5,4,['生吃'],{ease:5}),
  F('cucumber','黄瓜','huanggua','蔬菜',16,0.8,0.2,2.9,0.5,3,['生吃','凉拌'],{ease:5}),
  F('beansprout','绿豆芽','lvdouya','蔬菜',18,2.1,0.1,2.9,0.8,2,['便宜']),
  F('jiaobai','茭白','jiaobai','蔬菜',26,1.2,0.2,5.9,1.9,6,['时令']),
  F('winterMelon','冬瓜','donggua','蔬菜',12,0.4,0.2,2.6,0.7,1.5,['便宜']),
  F('loofah','丝瓜','sigua','蔬菜',20,1.0,0.2,4.2,0.6,5,[]),
  F('zucchini','西葫芦','xihulu','蔬菜',19,0.8,0.2,3.8,0.6,3,[]),
  F('lettuce','生菜','shengcai','蔬菜',15,1.3,0.3,2.0,0.7,4,['生吃']),
  F('shiitake','香菇(鲜)','xianggu','蔬菜',26,2.2,0.3,5.2,3.3,8,['菌菇']),
  F('enoki','金针菇','jinzhengu','蔬菜',32,2.4,0.4,6.0,2.7,4,['菌菇']),
  F('woodEar','木耳(水发)','muer','蔬菜',27,1.5,0.2,6.0,2.6,6,['菌菇','高纤']),
  F('kelp','海带(鲜)','haidai','蔬菜',13,1.2,0.1,2.1,0.5,3,['海藻']),
  F('frozenVeg','速冻什锦蔬菜','suxianshucai','蔬菜',64,3.0,0.4,13.0,4.0,8,['速冻','懒人'],{source:'USDA',ease:5}),
  // fruit
  F('apple','苹果','pingguo','水果',53,0.4,0.2,13.7,1.7,6,['水果']),
  F('banana','香蕉','xiangjiao','水果',93,1.4,0.2,22.0,1.2,5,['水果']),
  F('kiwi','猕猴桃','mihoutao','水果',61,0.8,0.6,14.5,2.6,10,['水果','通便']),
  // fats
  F('oil','食用油','shiyongyou','油脂',899,0,99.9,0,0,8,['油'],{fatClass:'high',unit:{name:'茶匙',g:4.5}}),
  F('sesamePaste','芝麻酱','zhimajiang','油脂',618,19.2,52.7,22.7,5.9,20,['调味'],{fatClass:'high',unit:{name:'勺',g:10}}),
  F('peanuts','花生(生)','huasheng','油脂',574,24.8,44.3,21.7,5.5,10,['坚果'],{fatClass:'high'}),
  F('walnut','核桃','hetao','油脂',646,14.9,58.8,19.1,9.5,25,['坚果'],{fatClass:'high'}),
  // takeaway estimates
  F('gaijiaofan','盖浇饭(外卖≈)','gaijiaofan','外食',150,6,6,18,1,0,['外卖'],{fatClass:'low',source:'estimate',unit:{name:'份',g:500}}),
  F('wonton','鲜肉馄饨(≈)','huntun','外食',140,6,5,18,0.8,0,['外食'],{fatClass:'low',source:'estimate',unit:{name:'碗',g:350}}),
];
// A31: 好吃 flag lives in data (read by core/scores.js); custom foods may set `tasty: true` too.
for (const f of FOODS) if (['seabass', 'shrimp', 'leanBeef', 'chickenThigh', 'egg', 'porkLoin'].includes(f.id)) f.tasty = true;
// A37: reviewed — every 蛋白/主食/外食 food not flagged tasty above is explicitly not tasty.
for (const f of FOODS) if (['蛋白', '主食', '外食'].includes(f.cat) && typeof f.tasty !== 'boolean') f.tasty = false;
