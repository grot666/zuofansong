# BACKLOG (top = next)

Original items 1–10 — all ✅ (Pages enabled 05:03; tests in CI + local; single VERSION v0.6.x; foods 131; tuna counter, bedtime/caffeine, plateau, templates ×0.5/×1/×1.5, weekly review, r9/r24 renamed — v0.2–v0.6.0).
Next: A18 → A17 → A20 → A21 → A22 → A6 split app.js views · A19 · A8 · A11 · R-15 · N-items still open below · ✅ price override per food (v0.6.7).

## Architecture items (see docs/ARCHITECTURE.md §8) — top priority first
_Arch verification @6ab7969 (v0.6.1), 2026-10-15 ~05:20 SGT. `node --test`: 51/51 pass on a clean clone._

### Verified (closed)
- ✅ **A1 CI**: 6c3edfb.
- ✅ **A2 store hardening + migrations** (06fe449). Injectable backend, MIGRATIONS registry with SCHEMA_VERSION=2, export envelope, KNOWN_KEYS whitelist, no alert in core, `storage-error` banner in boot.js. Follow-ups are A13/A14.
- ✅ **A3 single VERSION** (06fe449). `test/version.test.js` checks: CACHE === 'zfs-'+VERSION, changelog head, no literal v0.x.y.
- ✅ **A4 shared profile defaults**. One `DEFAULT_PROFILE` in `core/profile.js`. Plan and review pages use `getProfile()` → `normalizeProfile`.
- ✅ **A7 service worker** (06fe449). Navigations: network-first 3 s → cache → index.html. Assets: stale-while-revalidate, and a miss → `Response.error()`, never HTML. Only same-origin `ok && basic` responses are cached. All 3 pages run `bootStore()` → render → `registerSW()`, and this order is tested. Follow-up is A15.
- ✅ **A9 budget-aware planWeek** (06fe449). selectWeek/portionDay split; `applyBudget` matches the R6 fixture step by step; `planWeek` swaps each dinner(d)+lunch(d+1) pair together, wrapping lunch(0)=dinner(6). Follow-up is A16.
- ✅ **A5 food index + shared totals** (53dcc5d): `core/foods.js` `makeIndex`/`totals`; plan.js `sum` and review.js `dayTotals` delegate to it; all 3 pages use the index; `foods.js` is in sw ASSETS.
- ✅ **A10 data integrity**: `test/data.test.js` (53dcc5d).
- ✅ **A12 maintenance-week auto-revert**: `core/breaks.js` startBreak/resolveBreak, migration v2 (`breakFrom` → `breakState`), `resolveBreak` called in boot.

### Open, in priority order
- ✅ v0.6.2 **A13 migration test hardening (P0)**
  - Why: `store.test.js` covers v1→v2 with `breakFrom` and a second `migrate()`, but not these paths:
    - (1) Importing a legacy bare export with no `version` key but a `breakFrom`, while the current version is already 2. `importAll` → `migrate()` is a no-op, so `breakFrom` lingers forever and `breakState` is never created.
    - (2) The `backup.preMigration` write fails (quota) and the migration proceeds silently. That backup also roughly doubles storage, which is exactly when the quota bites.
    - (3) Migration 2 reads the device clock (`new Date()`), so `until` can't be tested.
    - (4) v0 → v2 on a fresh device that has data but no version: no backup is taken.
  - AC:
    - (a) `importAll` treats a payload with no `version` as schema 1: write `version=1` before `migrate()`. Test: legacy `{breakFrom:20, profile:{…}}` imported into a v2 store → `breakState.from === 20`, and no `breakFrom` key.
    - (b) If the backup `set()` returns false, `migrate()` aborts without bumping the version and emits `storage-error`. Test with a backend that throws on `backup.preMigration`.
    - (c) `migrate({today})` / `MIGRATIONS[2](api, today)` accepts an injected date. Test: `until === today`.
    - (d) Running `MIGRATIONS[2]` twice on the same state is a no-op (direct call, not via the version gate).
    - (e) After a successful migration, `backup.preMigration` is cleared on the next app version, or capped to one copy. Test that only one backup key exists.
- ✅ v0.6.2 **A15 sw.test.js: reverse ASSETS check (P0)**
  - Why: `version.test.js` checks that every ASSETS entry exists, but not that every shipped file is in ASSETS. Today the list is complete (checked by script @6ab7969), but nothing enforces it. A6 will add ~7 `js/views/*.js` files. Missing one means that offline, the page fails to import it: the miss returns `Response.error()` (correct), but the page then breaks.
  - AC: move the SW checks to `test/sw.test.js`.
    - Every `*.html` file, everything under `js/**/*.js`, `data/*.js` and `css/*.css`, plus `manifest.webmanifest` and `icon.svg`, must be in ASSETS.
    - No duplicates.
    - Keep the existing direction (every ASSETS entry exists on disk).
    - Must land **before A6**.
- ✅ v0.6.2 **A16 planWeek pairing and budget invariants beyond the R6 fixture (P1)**
  - Why: the test checks pairing for d<6 only, at one seed and one budget. It doesn't check:
    - the wraparound case lunch(0)=dinner(6) after swaps
    - kcal ±5% after swaps
    - that `overBudget` is reported when the budget can't be met
    - the per-protein cap of 3
  - AC: `r6.test.js` (or `plan.test.js`) loops over seeds 0..3 × budgets {∞, 0.85×free, 0.5×free}.
    - For all 7 d: `week[(d+1)%7].lunch protein === week[d].dinnerProtein`.
    - `checkWeek` passes on every day.
    - No protein appears in more than 3 slots.
    - At 0.5×free: `overBudget === (cost > budget)`, and cost is non-increasing as the budget tightens.
    - Determinism: the same seed and budget give a deep-equal week.
- ✅ v0.6.6 **A8 core test gaps (P1)**. Still open:
  - female BMR; TDEE for each activity factor
  - warning when kcal < BMR
  - BMI ≥30 uses goal-weight protein
  - multi-grain blend: needsSoak and waterRatio
  - fatWallet over budget
  - gutRisk low case, and monotonic in fiber
  - shoppingList raw grams: rice = cooked/2.3, exact
  - review: the ±10% boundary, lowFatPct, plateau on rising weight labelled 上升, window edges, month-end dates
  - new: `normalizeProfile` clamps and fills defaults (fatPct <20 → 20; strings → numbers)
  - new: `sleep.js` midnight wrap is covered by r6; add the `sleepNoteDay` once-per-day rule
  - AC: one test per bullet; total test count ≥ 60.
- ✅ v0.6.3 **A6 split app.js (P2, sequenced after A5)**
  - Why: `app.js` is 35 KB. A5 has landed, so views import `makeIndex`/`totals` from core. Do A15 first so every new view file is forced into ASSETS. One view per commit keeps every step green.
  - AC, in this order, each its own commit with CI green:
    - (1) `js/views/shared.js` (the `$`, `esc`, `r1`, `bar` helpers, plus the food index)
    - (2) `veg` → (3) `rice` → (4) `foods` → (5) `plate` → (6) `me` → (7) `today` (most state last)
    - `app.js` ≤ 3 KB router.
    - A15 test passes; the SW test catches each new file.
- ✅ v0.6.6 **A11 log retention (P3)**
  - AC: as before.
- **A14 KNOWN_KEYS ↔ docs sync (P3)**
  - Why: v0.6 added the keys `tplMult`, `sleepNoteDay` and `breakState`.
  - AC: a test parses the ARCHITECTURE §3 key table and asserts it matches `KNOWN_KEYS`. Or simpler: keep the table generated from a comment in store.js.

### Arch review @2f32a1a (v0.6.2), 2026-10-15 ~05:25 SGT — new items (probes reproducible, see ARCHITECTURE §3–§5)
56/56 tests pass on a clean clone. A13/A15/A16 verified shipped. Sequence: **A18 → A17 → A20 → A21 → A22 → A6**; A19 in parallel (core-only).
- ✅ v0.6.4 **A18 boot: surface migrate abort + detect non-persistent storage (P0 reliability)**
  - Why: since A13b, `migrate()` returns early when `backup.preMigration` can't be written, so the page runs v2 code on v1 data. The `storage-error` from that failed write fires **before** `bootStore()` attaches its listener → silent. Probe: backend throwing on `backup.*` → `migrate() === 1`, `breakFrom` kept, no `breakState`, no banner. Separately, blocked/private-mode localStorage silently falls back to `memoryBackend` and everything is lost on reload.
  - AC: attach the `storage-error` listener first; `bootStore()` checks `migrate() < SCHEMA_VERSION` → banner “数据升级未完成：存储空间不足。请先在“我的”导出备份，再删除旧记录” (export must work on v1 data); `store.isPersistent()` = real localStorage + probe write/remove of `culiang.v1.__probe` succeeds → else banner “当前浏览器不能保存数据（隐私模式？），关闭后记录会丢失”. Tests (core only): `isPersistent()` false with a throwing backend and with memoryBackend; migrate abort returns 1 and `exportAll()` still succeeds.
- ✅ v0.6.4 **A17 import: cap legacy version + replace mode + undo (P1 reliability)**
  - Repro on 2f32a1a (memoryBackend): (1) `importAll({version:99, profile:{}})` → accepted, store version 99, no future migration ever runs; (2) store has `log.2026-10-01`, import an envelope without it → the old day survives (merge, though the UI says it replaces).
  - AC: compute `incoming = Number(env.schema ?? data.version) || 1` and throw “备份来自更新的版本” if `> SCHEMA_VERSION` for envelope **and** legacy; before writing: `backup.preImport = exportAll()` (abort import if that fails), then `resetAll()` except `backup.*`; whitelisted write; `set('version', incoming)`; `migrate()`. me view: “撤销上次导入” restores `backup.preImport`. Tests: both repros flipped; export → import round-trip deep-equal on `data`; a `weights` value that isn't an array is skipped (count not incremented).
- ✅ v0.6.5 **A19 plan feasibility outside the default target (P1 correctness)**
  - Repro (`generateWeek` + `checkWeek`, seeds 0–8): grid kcal {1400,1500,1800,2000,2200} × protein {110,140,160} → **247/945 days off ±5% kcal**; default 1617/140 → 0/63; **profile at 62 kg (1502 kcal / 140 g) → 9/63**. Two causes: protein floor pushes kcal up at low kcal (1500/140: 8, 1400/160: 46); staple cap 350 g/meal can't reach high kcal at low protein (2200/110: 59). `planweek.test.js` only covers 1800/140.
  - AC: `portionDay` gets two more knobs before giving up — breakfast ×0.75/×1/×1.25 and snack kiwi 0/100/200 g — and returns `fit: 'ok'|'kcal-high'|'kcal-low'`; `planWeek` returns `infeasible: {reason}` when `protein*4 > 0.45*kcal`; plan-page shows “这个热量下蛋白目标偏高，已优先保证蛋白（热量 +x%）” instead of a silent miss. Test: grid where `protein*4 ≤ 0.40*kcal` → every day kcalOk && proteinOk (must include 1500/140 and 2200/110); outside → every off-band day has `fit !== 'ok'`.
- ✅ v0.6.4 **A20 SW update safety (P1)**
  - AC: precache with `ASSETS.map(u => new Request(u, {cache:'reload'}))` (Pages `max-age=600` can otherwise seed the new cache with old modules); each `*.html` gets a small **non-module** inline script: if the page's main container is still empty 4 s after `load`, or a `script` element fires `error`, show “加载失败 · 清除离线缓存并重新加载” → `getRegistrations().unregister()` + `caches.keys()→delete` + `location.reload()`; it must not reference `localStorage`. boot listens for `navigator.serviceWorker` `controllerchange` → toast “已更新到新版本 · 刷新” (no auto reload). Tests in `sw.test.js`: `cache: 'reload'` present; every html has the hatch marker (e.g. `data-zfs-hatch`) and the hatch text has no `localStorage`.
- ✅ v0.6.4 **A21 profile writes freeze defaults (P1 small)**
  - Why: `app.js` me-view submit and weight logger save `{...p, ...d}` with `p = normalizeProfile(...)` → the first save writes every default into storage (breaks ARCHITECTURE §3 rule 5; e.g. a later change to default `caffeineGapH` never reaches this user).
  - AC: pure `mergeProfileEdit(stored, edits)` in `core/profile.js` returns `{...stored, ...edits}` (numbers coerced, unknown keys dropped); both writers use `S.get('profile', {})`. Test: `mergeProfileEdit({}, {weight: 73})` has exactly `['weight']`.
- ✅ v0.6.4 **A22 core/dates.js (P2 refactor, before A6)**
  - Why: 6 copies of the local-date helper (boot.localDate, app.today + dayOffset, plan-page, review-page, store.localToday); review.lastNDates uses UTC ms math.
  - AC: pure `localDate(now = new Date())`, `addDays(str, n)`, `dayNum(str)`; all callers import it (sw ASSETS + A15 test catch the new file). Tests: addDays across 2026-10-31→11-01, 2026-12-31→2027-01-01, 2028-02-28→02-29; localDate for a fixed Date at 23:59 and 00:01 local.
- **A14 addendum** — `sleepNoteDay` is in KNOWN_KEYS but **no code writes it** (grep @2f32a1a); either implement the R6.2 once-per-day rule with it or drop the key.

---

## Research status & items (needs-research worker, 2026-10-15 04:35 SGT; sources: docs/RESEARCH.md, docs/RESEARCH-R5.md)
Status from CHANGELOG/PROGRESS @13c48c4 (not runtime-verified — tests not yet run per PROGRESS).

### Mission features (PROMPT §3)
- ✅ #1 我的目标 · ✅ #2 食材库 (≈100, 22 FDC-verified) · ✅ #3 杂粮饭配比器 · ✅ #4 一餐搭配 · ✅ #5 今日饮食 · ✅ #6 脂肪预算 · ✅ #7 蛋白补充 · ✅ #8 饮水/如厕舒适度 (v0.1) · ✅ #9 懒人蔬菜 32 (v0.2) · ✅ #10 一周菜单+购物清单+周日备餐 (v0.3; budget not enforced → A9).

### Research items already shipped (v0.2/v0.3)
- ✅ R-02 protein modes (自定 140 g / 体重 / 去脂体重) · ✅ R-03 rice-safety copy · ✅ R-07 "杂粮不更低热量" note · ✅ R-14 记入我的计划日 · ✅ R-05 护腕 filter · ✅ R-06 (22 of R3.1/R4.1 verified) · 🟡 R-01 (BF% at goal shipped; pace %/wk check not listed) · 🟡 R-15 (fiber-low flag shipped; ranked swaps = N-04) · 🟡 R-11 (周日备餐 shipped; 30-min evening one-tray variant open).

### Open items (slot after engineer items 1–3 / A1–A3; numbers in parentheses map to engineer list)
- **P0 · R-01b Pace check** — AC: profile shows kg/wk and %BW/wk to goal date; >1%/wk amber, <0.25%/wk info; test 74→58 kg, 2026-10-15→2027-07-31 ≈ 0.39 kg/wk ≈ 0.53%/wk.
- **P0 · N-02 Weight MA7 + chart** (R5.3) — AC: MA7 = calendar window [d−6,d], shown only with ≥3 entries (replace current last-7-entries average); inline SVG raw dots + MA line + goal line, 4w/8w/12w/全部, tap tooltip; status chip 正常/偏快/持平; tests for MA math, gap rule, %/wk.
- **P0 · N-03 Templates + 3-tap log** (= item 8; R5.5) — AC: "+"→sheet→template→记录 (×0.5/×1/×1.5) = 3 taps with undo; "存为模板" from plate builder; 3 presets; "复制昨天" with checkbox confirm; tests for multiplier expand + copy-yesterday.
- **P1 · N-04 Ranked fiber swaps** ⚠ needs research: AC test (oats40/peas100/broc200 top 3) conflicts with the ratio formula on R5.2 values; shipped ranking = replacements first, then ratio. (R5.2, completes R-15) — AC: `js/core/fiber.js` ranks the 7 R5.2 swaps by fiberGain/max(kcalDelta,20), top 3, never > kcal target +5%, water tip when gut risk high; copy exactly as R5.2 (incl. corrected brown200: +2.4 g / −14 kcal); test: plan-day returns oats40/peas100/broc200 in top 3.
- **P1 · N-05 Takeaway quick-add data** (feeds item 4; R5.1) — AC: 20 R5.1 rows as `type:"dish"`, `verified:false`, `source:"fatsecret.cn 估算"`, `defaultPortionG` + `portionNote:"默认份量为假设，建议称重"`; always ≈ + tip line; test 黄焖鸡米饭 500 g → 835 kcal.
- **P1 · N-06 Weekly review** (= item 9; R5.4) — AC: 10-item checklist auto-filled from logs/weights; missing = "未记录"; one decision saved; "−100–150 kcal" updates target with confirm, "维持周" sets kcal = TDEE for 7 days; fixture-week test.
- **P1 · R-09 Tuna counter** (= item 5; R3.3) — AC: foods carry `mercuryClass`; tuna split 淡(鲣鱼/skipjack) / 白(长鳍/albacore); weekly soft note light >3×113 g or albacore >1×113 g, labelled conservative; plan rotates shrimp/salmon.
- **P1 · R-04/R-12 Bedtime & caffeine** (= item 6; R1.4, R3.5) — AC: bedtime setting (default 23:30); "晚餐建议 HH:MM 前吃完" = bedtime−3 h; caffeine items nudge after bedtime−6 h.
- **P1 · R-10 Plateau** (= item 7; R3.6) — AC: trigger only if MA7 change <0.1 kg over ≥14 d AND ≥5 logs/wk; offers −100–150 kcal / +steps / 1–2 wk maintenance (updates goal-date projection); trigger tests incl. sparse-data no-trigger.
- **P1 · R-08b Daily oil total** (R3.4) — AC: today view sums oil g from recipes/plates vs 膳食指南 25–30 g; test 15 g olive oil = 132.6 kcal / 15 g fat.
- **P2 · R-11b 30-min evening one-tray template** (R4.3) — AC: rice cooker + one tray/air fryer + microwave eggs; shows active minutes, 锅具数, 护腕 flag; ≥5 low-oil sauces rotated so flavour doesn't repeat 2 days running.
- **P2 · N-07 Verify kiwi** — AC: kiwi suggestion shows a number only after FDC 168153 verified via FDC API (`source:"USDA FDC 168153"`).
- **P2 · R-13 Slip recovery** (part of item 8) — AC: after over-target day show weekly average + "没关系，继续" (neutral, no red).

### R6 update (2026-10-15 ~04:55 SGT; full spec, copy, fixtures: docs/RESEARCH-R6.md)
v0.5.0 shipped N-06, R-08b, R-09, R-10 (per PM). **Correction:** R-01b expected value is **0.52 %/wk** (0.3875/74 = 0.5237), not 0.53.
- ✅ v0.6.0 **P0 · R-01b Pace check (detailed)** — AC: pure `paceCheck({currentKg, goalKg, today, goalDate})` in core, local calendar days; returns `{status, days, kgPerWeek, pctPerWeek}`; status `ok|fast|slow|invalid-date|reached|gain|incomplete`; amber card for fast, info for slow, zh copy per R6.1; recomputes on new weight log. Tests (today 2026-10-15, tol 1e-3): A 74→58 @2027-07-31 → 289 d, 0.3875 kg/wk, 0.5237 %, ok · B @2027-01-31 → 108 d, 1.0370, 1.4014 %, fast · C 74→72 → 0.0484, 0.0655 %, slow · D goalDate=today → invalid-date · E goal=74 → reached · F goal=78 → gain (no warnings) · G today 2027-03-01, 66→58 → 152 d, 0.5582 %, ok.
- ✅ v0.6.0 **P1 · R-04/R-12 Bedtime & caffeine (detailed)** — AC: profile `bedtime` (23:30), `dinnerGapH` (3, 2–4), `caffeineGapH` (6, 4–8), `sleepNudges` (on); pure `dinnerDeadline`/`caffeineCutoff` wrap past midnight; today card after 17:00; soft once/day note for meal ≥300 kcal after deadline; caffeine-tagged items after cutoff get note; copy per R6.2, no red. Tests: 23:30→20:30/17:30 · 01:00→22:00/19:00 · 22:00 gap2→20:00/16:00 · 00:00→21:00/18:00 · 21:10 450 kcal fires, 150 kcal not · coffee 17:29 no, 17:31 yes · nudges off → none.
- ✅ v0.6.0 **P1 · A9 budget (test spec)** — AC as A9 plus: greedy swap = highest-cost protein day first (tie → lower index) → cheapest-per-protein-g option that is cheaper and used < 3 days; grams rescaled so protein/day unchanged; prices from `priceCNYPer500g` (estimates, user override); UI shows "超出预算 ¥x，已尽量替换" when overBudget. Fixture (synthetic test prices, FDC protein; R6.3): 7 days × 100 g protein from tuna (¥30/500 g), fixed ¥100 → start 316.50. budget 400 → 0 swaps, 316.50, overBudget false · 200 → tofu×3 egg×2 tuna×2, 194.78, false · 150 → tofu×3 egg×3 thigh×1, 157.67, true. Assert protein/day 100 ± 0.5 g, cost ± 0.05.
- **P2 · Protein-per-yuan column** — AC: foods view sortable "蛋白/元" = P/100 g × 5 / priceCNYPer500g, labelled 估算 (raw basis, shell/bone not adjusted); test egg 12.6 g @ ¥6 → 10.5 g/¥.

### R7 update (2026-10-15 ~05:30 SGT; full data: docs/RESEARCH-R7.md)
- **P1 · R-11b One-tray evening template (detailed)** — AC: `data/sauces.js` with s1–s6 (`id,name,family,items:[[fdcFood,g]],kcal,fat,allergen?`), kcal/fat **computed at test time** from FDC ingredient values in R7.1 (not hand-typed); `rotateSauces(enabled, days, startIdx)` pure; template card lists 6 steps with active min, device count (3), 护腕 ✅ per step, “以中心温度为准：禽肉 74 °C” (USDA FSIS), sodium note for 酱油/蚝油; cook times shown as “以自家设备为准” (unsourced). Tests: s1 = 30.2 kcal/2.11 g, s2 19.2/0.10, s3 44.8/0.31, s4 24.7/0.11, s5 57.6/4.17, s6 27.6/0.05 (±0.1); rotation all-6 ×7 → s1 s2 s3 s4 s5 s6 s1; without s5 → s1 s2 s3 s4 s6 s1 s2; only s1 → repeatWarning true; no consecutive equal family when ≥2 families; every step with `wristSafe:false` must have a `wristNote`.
- **P2 · N-07 Kiwi** — ✅ verified via FDC API: 168153 = 61 kcal, P 1.14, F 0.52, C 14.7, fiber 3.0 /100 g. AC: kiwi food entry `verified:true, source:'USDA FDC 168153'` with these values; data.test asserts them; no per-fruit grams unless labelled ≈.
- **P2 · Price reference refresh** — AC: foods with an official Shanghai retail number get `priceCNYPer500g` + `priceSource` + `priceDate` (R7.3: 猪精瘦肉 17.55, 鸡蛋 5.91 [SH 2026-10-13]; ranges from 奉贤 2026-10-12 for 基围虾/粳米/牛肉/鱼); all others keep `估算`; UI shows “价格为估算，可自行修改”. Tests: proteinPerYuan pork 21.0@17.55 = 5.983, egg 12.6@5.91 = 10.660, rice 7.13@3.00 = 11.883, shrimp 20.1@23.00 = 4.370 (tol 1e-3).
- **P1 · UX-1 First-run defaults disclosure** (code audit, not click-through) — Why: never-saved profile silently shows DEFAULT_PROFILE targets + owner-specific “计划日/计划早餐”. AC: if `S.get('profile')` is unset, today view top card: “目前使用示例目标（1 分钟填写身高/体重/年龄可自动计算） [去设置] [先用示例]”; “先用示例” hides card (flag `onboardSeen`, add to KNOWN_KEYS); targets labelled “示例” until saved; first log still ≤ 1 tap from #today. Tests: no profile → card rendered + label; profile saved → no card; onboardSeen → no card.
- **P1 · UX-2 Blank profile fields become 0** — Why: `views.me.bind` does `d[k] = +d[k]`, so empty inputs overwrite defaults with 0. AC: empty string → keep previous value (or delete key so normalizeProfile default applies); required fields (身高, 体重, 出生日期) block save with inline message “请填写…”; out-of-range clamped by normalizeProfile with visible note. Tests (pure `parseProfileForm(formObj, prev)`): `{bodyFatPct:''}` + prev 20 → 20; `{goalWeight:''}` → prev kept; `{weight:'0'}` → error; `{height:'175.5'}` → 175.5.
- **P1 · UX-3 Quick-add matching & silent 100 g** — Why: exact/`includes` match else `alert()`; unit mode falls back to 100 g with no notice. AC: match ranks name startsWith > includes > pinyin > tag, top 5 suggestions inline (no alert); when food has no `unit`, unit select defaults to 克 with “该食材无单位，按克记录”; not-found shows inline “添加为自定义食材”. Tests (pure `matchFoods(q, foods)`): ‘鸡腿’ returns thigh items first; pinyin ‘jidan’ finds egg; unknown → []; `gramsFor(food without unit, 1, 'unit')` → null, not 100.
