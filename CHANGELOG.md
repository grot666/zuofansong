# CHANGELOG

## v0.8.2
- UX-6: pure saveProfile {ok, changed, clamped}; toast + scroll/highlight 每日目标.

## v0.8.1
- UX-4 shared nav (js/nav.js) + reviewDue card; UX-5 --nav-h + safe-area padding, toast; UX-11 5 icon items ≥44px with 搭配 sub-nav.

## v0.8.0
- G4: 4 canteen set-meal estimates (verified:false); 137 foods.

## v0.7.9
- G3: backup reminder (lastExport/backupSnooze keys, pure backupDue + test).

## v0.7.8
- G2: plan add-on may use whey powder when usesPowder (≤ maxScoops), after whole-food add-ons.

## v0.7.7
- G1: shared core mealScores; plan page shows 4-dimension scores per lunch/dinner.

## v0.7.6
- A26: compactStore is a no-op while backup.preImport exists; import→compact→undo round-trip test. Archives are not re-priced.

## v0.7.5
- A25: per-meal protein cap MAX_PROTEIN_G_PER_MEAL=300 g; egg-white/yogurt/egg/tofu add-ons (加餐) are tried before raising meat; tofu mains scale 1.5×.

## 0.7.4 — 2026-10-15
- A23 priceOf（熟重价×k 折算生重）；A24 foodIndexFromStore；A27 今日/菜单花费一致。

## 0.7.3 — 2026-10-15
- N-04 按 Rulings R8 排序；R-10 平台期 reason/依从度/14 天冷却/维持周抑制。

## 0.7.2 — 2026-10-15
- 375px UX 打磨、统一导航、无障碍（aria-current、焦点样式、页面标题）；R-10 平台期 ≥5 次/周；A8 剩余测试。

## 0.7.1 — 2026-10-15
- R-13 超标日显示 7 日平均；每元蛋白排序；N-05 外卖菜份量说明；A14 存储键文档同步测试。

## 0.7.0 — 2026-10-15
- R-11b 一盘烤晚餐模板 + 酱汁轮换（data/sauces.js，热量按 FDC 计算）；R7.3 价格参考（data/prices.js）；N-07 猕猴桃数据测试。

## 0.6.9 — 2026-10-15
- UX-1 首次使用示例目标提示；UX-2 资料空字段保留原值；UX-3 快速记录匹配与单位提示。

## 0.6.8 — 2026-10-15
- N-02 体重图时间范围；R-08b 今日用油。

## 0.6.7 — 2026-10-15
- 每种食材可自定价格（prices 键），全站花费计算使用。

## 0.6.6 — 2026-10-15
- A11 记录保留：>180 天的日记录压缩到 logArchive.YYYY-MM；A8 核心测试补齐。

## 0.6.5 — 2026-10-15
- A19：菜单份量求解（早餐 ×0.5–1.25、猕猴桃 0/100/200 g、主食、蛋白），不可行时提示。

## 0.6.4 — 2026-10-15
- A17 导入=替换+撤销；A18 迁移失败/非持久存储提示；A20 离线缓存逃生按钮、更新提示、预缓存绕过 HTTP 缓存；A21 资料保存不再固化默认值；A22 core/dates.js。

## 0.6.3 — 2026-10-15
- A6：app.js 拆为 js/ui.js + js/views/{today,plate,veg,rice,foods,me}.js（46 行路由）。

## 0.6.2 — 2026-10-15
- 导入无版本号的旧备份会运行迁移；迁移前备份失败则不升级；SW 后台更新用 waitUntil。

## 0.6.1 — 2026-10-15
- 食材页显示每元蛋白（g/¥）。内部：js/core/foods.js 统一索引与合计；test/data.test.js 数据自检。

## 0.6.0 — 2026-10-15
- 常用餐 ×0.5/×1/×1.5 份量；一周菜单按预算自动换便宜蛋白（晚餐+次日午餐一起换）。
- 目标节奏检查（%/周，偏快/偏慢/日期无效/已达成）。
- 睡前提醒：晚饭截止、咖啡因截止（可关）；新增咖啡/拿铁/奶茶/绿茶。
- 维持周 7 天后自动恢复缺口；存储失败提示；备份信封格式+白名单导入；Service Worker 策略更新。

## 0.2.0 — 2026-10-15
- 懒人蔬菜 32 道：油克数、步骤、时间、成本、营养；筛选 ≤5分钟 / 不开火 / 微波 / 护腕 / 一锅。
- 食材约 100 种，22 种按 USDA FDC API 核实（source: USDA FDC <id>），熟重条目（米饭/鸡腿/虾）。
- 蛋白目标模式：自定（默认 140 g，来自计划 130–160 g）/ 按体重 / 按去脂体重。
- 一键记入“我的计划日”；纤维不足提示（燕麦/青豆/猕猴桃）。
- 杂粮饭：食品安全提示（FSA：1 小时内冷藏、24 小时内吃完、只加热一次）；说明杂粮不更低热量。
- 体重 7 次平均；目标体重时体脂推算。本地日期修正（之前用 UTC 日期）。

## 0.1.0 — 2026-10-15
- 首个版本：我的目标、食材库、杂粮饭配比器、一餐搭配、今日饮食、脂肪预算、蛋白补充、饮水与如厕舒适度。
