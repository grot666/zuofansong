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
- ✅ v0.6.6 **A8 core test gaps (P1)**. All bullets ✅ (v0.6.6 test/a8.test.js + v0.7.2 test/a8b.test.js):
  - ✅ female BMR; TDEE for each activity factor
  - ✅ warning when kcal < BMR
  - ✅ BMI ≥30 uses goal-weight protein
  - ✅ multi-grain blend: needsSoak and waterRatio
  - ✅ fatWallet over budget
  - ✅ gutRisk low case, and monotonic in fiber
  - ✅ shoppingList raw grams: rice = cooked/2.3, exact
  - ✅ review: the ±10% boundary, lowFatPct, plateau on rising weight labelled 上升, window edges, month-end dates
  - ✅ new: `normalizeProfile` clamps and fills defaults (fatPct <20 → 20; strings → numbers)
  - ✅ new: `sleep.js` midnight wrap is covered by r6; `sleepNoteDay` moot — key dropped v0.6.4; notes are derived from the day's own log so they are once-per-day by construction (asserted)
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
- ✅ v0.7.1 **A14 KNOWN_KEYS ↔ docs sync (P3)**
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
- ✅ v0.6.4 (key dropped) **A14 addendum** — `sleepNoteDay` is in KNOWN_KEYS but **no code writes it** (grep @2f32a1a); either implement the R6.2 once-per-day rule with it or drop the key.

---

## Arch review @836ac40 (v0.7.1), 2026-10-15 ~05:50 SGT
Clean clone: `node --test` 80/80 pass. Probes were run against core with `node` (scripts not committed); the numbers below come from them.

Verified, no action needed:
- **Price precedence in the index.** User override > official ref (`data/prices.js`) > food estimate. All 3 pages pass the same argument order to `makeIndex`: `ui.js` (index), `plan-page.js`, `review-page.js`.
- **Nameless entries can't drop base foods.** A nameless override or ref for an unknown id is dropped (895a58a). The 73a2787 red-CI cause is now pinned by `data.test.js`, which asserts `f.all().length === ALL.length` with the `ghost` and `bogus` overrides.
- **SW assets.** `data/sauces.js`, `data/prices.js` and `js/core/sauces.js` are in ASSETS, and the A15 test in `sw.test.js` enforces disk ⊆ ASSETS.
- **Retention cost.** On a 400-day store (12 items/day, ~170 KB), the first `compactStore` takes 7 ms and archives 219 days; the steady state is ~3 ms per index load.
- **Retention vs import/undo.** `undoImport` wipes every non-backup key, including archives created after the import, then restores the pre-import snapshot, so no orphan archives remain.

- ✅ v0.7.4 **A23 Price overrides on cooked ids are ignored by planWeek/shoppingList/budget (P0)**
  - Why: the foods view lets the user override the price of any id, including cooked ids (`thighRoasted`, `breastRoasted`, `shrimpCooked`, `riceCooked`…). But `shoppingList` and `proteinCost` in plan.js price via `COOKED_TO_RAW` using the **raw** id, so the override is silently ignored on the plan page. Meanwhile, today/plate costs and protein/¥ do use it, so the two sides of the app disagree.
  - Probe (1800/140, seed 0):
    - The week costs ¥245.0 either way: `thighRoasted:999` leaves it unchanged, while `chickenThigh:999` raises it to ¥1835.8.
    - Budget ¥300 with `thighRoasted:999`: 0 swaps, and thigh is still used.
  - AC:
    - One `priceOf(food, id)` in `core/foods.js`. If id has a COOKED_TO_RAW entry `[rawId, k]`: a user override on the cooked id gives a raw-equivalent of `cookedPrice × k`; otherwise use the raw food's merged price. `shoppingList` and `proteinCost` use it.
    - The foods view labels cooked items' price as "按熟重" (cooked weight).
    - Tests:
      - `thighRoasted:999` raises the 1800/140 seed-0 cost, and budget 300 swaps thigh out.
      - `chickenThigh:999` keeps today's behaviour.
      - A raw override still beats a ref (`egg:7` over 5.91).
- ✅ v0.7.4 **A24 One food-index builder; explicit base vs partial lists (P1)**
  - Why:
    - The 6-argument `makeIndex(FOODS, FOODS2, FOODS3, PRICE_REFS, customFoods, priceOverrides(prices))` call is copied 3× (ui.js, plan-page.js, review-page.js). The next data file or a precedence change can drift between pages.
    - `makeIndex` decides "partial vs base" by the presence of `priceUser`/`priceSource`, so a future base food that carries a `priceSource` field (natural for R7 data) would be silently dropped.
  - AC:
    - `foodIndexFromStore(S)` in core, used by all 3 pages. Signature: `makeIndex({ base: [...], partials: [...] })`, where partials never create entries.
    - Tests:
      - Precedence table: estimate < ref < user, with a custom food plus a user override on that custom id.
      - A base food with `priceSource` stays in the index.
      - Pages are text-checked to contain `foodIndexFromStore(` and no raw `makeIndex(` call.
- **A25 Pin a realistic per-meal protein portion cap (P1)** ✅
  - Why: `portionDay` caps cooked protein at `Math.min(450, …)` grams **per meal**, and lunch and dinner each get it, so up to 900 g of cooked meat a day. Nothing pins this; `grep 450 test/` finds nothing.
  - Probe: across the A19 grid (6 kcal × 3 protein × 9 seeds × 7 days = 1134 days), the max is 450 g and **875 of 1134 days are ≥ 250 g per meal**. Many plans "fit" only by prescribing ~1–1.5 chicken breasts per meal, twice a day. That isn't "change what he eats tomorrow" realistic.
  - AC:
    - Exported `MAX_PROTEIN_G_PER_MEAL` (proposed 300; 250 if the add-on below keeps the grid green).
    - New knob before raising meat: a protein add-on slot. Order: yogurt 150–300 g, then extra egg, then tofu side, then a powder scoop only if `usesPowder` and within `maxScoops`.
    - Feasibility test asserts `proteinG ≤ MAX` on every grid day, keeps the existing green condition (protein×4 ≤ 0.40×kcal → ok), and reports `fit:'protein-high'` beyond it.
    - Test: 1800/140 seed 0 has every `proteinG ≤ 300`.
    - DECISIONS line records the chosen cap.
- **A26 Retention × import round-trip test (P2)** ✅
  - Why: the safety above holds by construction but isn't tested. Compaction is irreversible for >180-day detail and runs on every index load, including the first load after an import.
  - AC: test with an in-memory store:
    - Import a 400-day legacy backup → `compactStore` → `undoImport` → keys deep-equal the pre-import snapshot, with no `logArchive.*` left.
    - `compactStore` is a no-op while `backup.preImport` exists, so the user can undo an import before old detail is collapsed. It runs on the next load after undo, or after 1 day.
    - Archive totals for a day equal `totals()` at the moment of compaction (document that later price changes don't re-price archives).
- ✅ v0.7.4 **A27 Cost basis note (P3, docs + test)**
  - Why: today/plate cost uses the cooked-id price per cooked gram, while plan uses the raw price via the yield factor. After A23 both must agree for the same meal.
  - AC: test that `totals([[riceCooked, 230]]).cost` ≈ `shoppingList` cost of the same 230 g cooked (±¥0.05), using merged prices.


## Research status & items (needs-research worker, 2026-10-15 04:35 SGT; sources: docs/RESEARCH.md, docs/RESEARCH-R5.md)
Status from CHANGELOG/PROGRESS @13c48c4 (not runtime-verified — tests not yet run per PROGRESS).

### Mission features (PROMPT §3)
- ✅ #1 我的目标 · ✅ #2 食材库 (≈100, 22 FDC-verified) · ✅ #3 杂粮饭配比器 · ✅ #4 一餐搭配 · ✅ #5 今日饮食 · ✅ #6 脂肪预算 · ✅ #7 蛋白补充 · ✅ #8 饮水/如厕舒适度 (v0.1) · ✅ #9 懒人蔬菜 32 (v0.2) · ✅ #10 一周菜单+购物清单+周日备餐 (v0.3; budget not enforced → A9).

### Research items already shipped (v0.2/v0.3)
- ✅ R-02 protein modes (自定 140 g / 体重 / 去脂体重) · ✅ R-03 rice-safety copy · ✅ R-07 "杂粮不更低热量" note · ✅ R-14 记入我的计划日 · ✅ R-05 护腕 filter · ✅ R-06 (22 of R3.1/R4.1 verified) · 🟡 R-01 (BF% at goal shipped; pace %/wk check not listed) · 🟡 R-15 (fiber-low flag shipped; ranked swaps = N-04) · 🟡 R-11 (周日备餐 shipped; 30-min evening one-tray variant open).

### Open items (slot after engineer items 1–3 / A1–A3; numbers in parentheses map to engineer list)
- ✅ v0.6.0 **P0 · R-01b Pace check** — AC: profile shows kg/wk and %BW/wk to goal date; >1%/wk amber, <0.25%/wk info; test 74→58 kg, 2026-10-15→2027-07-31 ≈ 0.39 kg/wk ≈ 0.53%/wk.
- ✅ v0.4.0/v0.6.8 **P0 · N-02 Weight MA7 + chart** (R5.3) — AC: MA7 = calendar window [d−6,d], shown only with ≥3 entries (replace current last-7-entries average); inline SVG raw dots + MA line + goal line, 4w/8w/12w/全部, tap tooltip; status chip 正常/偏快/持平; tests for MA math, gap rule, %/wk.
- ✅ v0.6.0 **P0 · N-03 Templates + 3-tap log** (= item 8; R5.5) — AC: "+"→sheet→template→记录 (×0.5/×1/×1.5) = 3 taps with undo; "存为模板" from plate builder; 3 presets; "复制昨天" with checkbox confirm; tests for multiplier expand + copy-yesterday.
- ✅ v0.7.3 **P1 · N-04 Ranked fiber swaps** — ⚖ **RULED 05:45, see “Rulings R8 · N-04” below; the old “oats40/peas100/broc200 in top 3” test is withdrawn.** (R5.2, completes R-15) — AC: `js/core/fiber.js` ranks swaps per Ruling R8 · N-04; never > kcal target +5%, water tip when gut risk high; copy exactly as R5.2 (incl. corrected brown200: +2.4 g / −14 kcal).
- ✅ v0.7.1 **P1 · N-05 Takeaway quick-add data** (feeds item 4; R5.1) — AC: 20 R5.1 rows as `type:"dish"`, `verified:false`, `source:"fatsecret.cn 估算"`, `defaultPortionG` + `portionNote:"默认份量为假设，建议称重"`; always ≈ + tip line; test 黄焖鸡米饭 500 g → 835 kcal.
- ✅ v0.5.0 **P1 · N-06 Weekly review** (= item 9; R5.4) — AC: 10-item checklist auto-filled from logs/weights; missing = "未记录"; one decision saved; "−100–150 kcal" updates target with confirm, "维持周" sets kcal = TDEE for 7 days; fixture-week test.
- ✅ v0.5.0 **P1 · R-09 Tuna counter** (= item 5; R3.3) — AC: foods carry `mercuryClass`; tuna split 淡(鲣鱼/skipjack) / 白(长鳍/albacore); weekly soft note light >3×113 g or albacore >1×113 g, labelled conservative; plan rotates shrimp/salmon.
- ✅ v0.6.0 **P1 · R-04/R-12 Bedtime & caffeine** (= item 6; R1.4, R3.5) — AC: bedtime setting (default 23:30); "晚餐建议 HH:MM 前吃完" = bedtime−3 h; caffeine items nudge after bedtime−6 h.
- ✅ v0.5.0 **P1 · R-10 Plateau** (= item 7; R3.6) — ⚖ **exact rule + follow-ups: see “Rulings R8 · R-10” below.** AC: trigger only if MA7 change <0.1 kg over ≥14 d AND ≥5 logs/wk; offers −100–150 kcal / +steps / 1–2 wk maintenance (updates goal-date projection); trigger tests incl. sparse-data no-trigger.
- ✅ v0.6.8 **P1 · R-08b Daily oil total** (R3.4) — AC: today view sums oil g from recipes/plates vs 膳食指南 25–30 g; test 15 g olive oil = 132.6 kcal / 15 g fat.
- ✅ v0.7.0 **P2 · R-11b 30-min evening one-tray template** (R4.3) — AC: rice cooker + one tray/air fryer + microwave eggs; shows active minutes, 锅具数, 护腕 flag; ≥5 low-oil sauces rotated so flavour doesn't repeat 2 days running.
- ✅ v0.7.0 **P2 · N-07 Verify kiwi** — AC: kiwi suggestion shows a number only after FDC 168153 verified via FDC API (`source:"USDA FDC 168153"`).
- ✅ v0.7.1 **P2 · R-13 Slip recovery** (part of item 8) — AC: after over-target day show weekly average + "没关系，继续" (neutral, no red).

### R6 update (2026-10-15 ~04:55 SGT; full spec, copy, fixtures: docs/RESEARCH-R6.md)
v0.5.0 shipped N-06, R-08b, R-09, R-10 (per PM). **Correction:** R-01b expected value is **0.52 %/wk** (0.3875/74 = 0.5237), not 0.53.
- ✅ v0.6.0 **P0 · R-01b Pace check (detailed)** — AC: pure `paceCheck({currentKg, goalKg, today, goalDate})` in core, local calendar days; returns `{status, days, kgPerWeek, pctPerWeek}`; status `ok|fast|slow|invalid-date|reached|gain|incomplete`; amber card for fast, info for slow, zh copy per R6.1; recomputes on new weight log. Tests (today 2026-10-15, tol 1e-3): A 74→58 @2027-07-31 → 289 d, 0.3875 kg/wk, 0.5237 %, ok · B @2027-01-31 → 108 d, 1.0370, 1.4014 %, fast · C 74→72 → 0.0484, 0.0655 %, slow · D goalDate=today → invalid-date · E goal=74 → reached · F goal=78 → gain (no warnings) · G today 2027-03-01, 66→58 → 152 d, 0.5582 %, ok.
- ✅ v0.6.0 **P1 · R-04/R-12 Bedtime & caffeine (detailed)** — AC: profile `bedtime` (23:30), `dinnerGapH` (3, 2–4), `caffeineGapH` (6, 4–8), `sleepNudges` (on); pure `dinnerDeadline`/`caffeineCutoff` wrap past midnight; today card after 17:00; soft once/day note for meal ≥300 kcal after deadline; caffeine-tagged items after cutoff get note; copy per R6.2, no red. Tests: 23:30→20:30/17:30 · 01:00→22:00/19:00 · 22:00 gap2→20:00/16:00 · 00:00→21:00/18:00 · 21:10 450 kcal fires, 150 kcal not · coffee 17:29 no, 17:31 yes · nudges off → none.
- ✅ v0.6.0 **P1 · A9 budget (test spec)** — AC as A9 plus: greedy swap = highest-cost protein day first (tie → lower index) → cheapest-per-protein-g option that is cheaper and used < 3 days; grams rescaled so protein/day unchanged; prices from `priceCNYPer500g` (estimates, user override); UI shows "超出预算 ¥x，已尽量替换" when overBudget. Fixture (synthetic test prices, FDC protein; R6.3): 7 days × 100 g protein from tuna (¥30/500 g), fixed ¥100 → start 316.50. budget 400 → 0 swaps, 316.50, overBudget false · 200 → tofu×3 egg×2 tuna×2, 194.78, false · 150 → tofu×3 egg×3 thigh×1, 157.67, true. Assert protein/day 100 ± 0.5 g, cost ± 0.05.
- ✅ v0.6.1/v0.7.1 **P2 · Protein-per-yuan column** — AC: foods view sortable "蛋白/元" = P/100 g × 5 / priceCNYPer500g, labelled 估算 (raw basis, shell/bone not adjusted); test egg 12.6 g @ ¥6 → 10.5 g/¥.

### R7 update (2026-10-15 ~05:30 SGT; full data: docs/RESEARCH-R7.md)
- ✅ v0.7.0 **P1 · R-11b One-tray evening template (detailed)** — AC: `data/sauces.js` with s1–s6 (`id,name,family,items:[[fdcFood,g]],kcal,fat,allergen?`), kcal/fat **computed at test time** from FDC ingredient values in R7.1 (not hand-typed); `rotateSauces(enabled, days, startIdx)` pure; template card lists 6 steps with active min, device count (3), 护腕 ✅ per step, “以中心温度为准：禽肉 74 °C” (USDA FSIS), sodium note for 酱油/蚝油; cook times shown as “以自家设备为准” (unsourced). Tests: s1 = 30.2 kcal/2.11 g, s2 19.2/0.10, s3 44.8/0.31, s4 24.7/0.11, s5 57.6/4.17, s6 27.6/0.05 (±0.1); rotation all-6 ×7 → s1 s2 s3 s4 s5 s6 s1; without s5 → s1 s2 s3 s4 s6 s1 s2; only s1 → repeatWarning true; no consecutive equal family when ≥2 families; every step with `wristSafe:false` must have a `wristNote`.
- ✅ v0.7.0 **P2 · N-07 Kiwi** — ✅ verified via FDC API: 168153 = 61 kcal, P 1.14, F 0.52, C 14.7, fiber 3.0 /100 g. AC: kiwi food entry `verified:true, source:'USDA FDC 168153'` with these values; data.test asserts them; no per-fruit grams unless labelled ≈.
- ✅ v0.7.0 **P2 · Price reference refresh** — AC: foods with an official Shanghai retail number get `priceCNYPer500g` + `priceSource` + `priceDate` (R7.3: 猪精瘦肉 17.55, 鸡蛋 5.91 [SH 2026-10-13]; ranges from 奉贤 2026-10-12 for 基围虾/粳米/牛肉/鱼); all others keep `估算`; UI shows “价格为估算，可自行修改”. Tests: proteinPerYuan pork 21.0@17.55 = 5.983, egg 12.6@5.91 = 10.660, rice 7.13@3.00 = 11.883, shrimp 20.1@23.00 = 4.370 (tol 1e-3).
- ✅ v0.6.9 **P1 · UX-1 First-run defaults disclosure** (code audit, not click-through) — Why: never-saved profile silently shows DEFAULT_PROFILE targets + owner-specific “计划日/计划早餐”. AC: if `S.get('profile')` is unset, today view top card: “目前使用示例目标（1 分钟填写身高/体重/年龄可自动计算） [去设置] [先用示例]”; “先用示例” hides card (flag `onboardSeen`, add to KNOWN_KEYS); targets labelled “示例” until saved; first log still ≤ 1 tap from #today. Tests: no profile → card rendered + label; profile saved → no card; onboardSeen → no card.
- ✅ v0.6.9 **P1 · UX-2 Blank profile fields become 0** — Why: `views.me.bind` does `d[k] = +d[k]`, so empty inputs overwrite defaults with 0. AC: empty string → keep previous value (or delete key so normalizeProfile default applies); required fields (身高, 体重, 出生日期) block save with inline message “请填写…”; out-of-range clamped by normalizeProfile with visible note. Tests (pure `parseProfileForm(formObj, prev)`): `{bodyFatPct:''}` + prev 20 → 20; `{goalWeight:''}` → prev kept; `{weight:'0'}` → error; `{height:'175.5'}` → 175.5.
- ✅ v0.6.9 **P1 · UX-3 Quick-add matching & silent 100 g** — Why: exact/`includes` match else `alert()`; unit mode falls back to 100 g with no notice. AC: match ranks name startsWith > includes > pinyin > tag, top 5 suggestions inline (no alert); when food has no `unit`, unit select defaults to 克 with “该食材无单位，按克记录”; not-found shows inline “添加为自定义食材”. Tests (pure `matchFoods(q, foods)`): ‘鸡腿’ returns thigh items first; pinyin ‘jidan’ finds egg; unknown → []; `gramsFor(food without unit, 1, 'unit')` → null, not 100.

### Rulings R8 (needs-research, 2026-10-15 ~05:45 SGT; code read @ fiber.js 2ecd053, review.js 503625c)

#### ✅ v0.7.3 R8 · N-04 fiber swap ranking — **the formula is right; the old AC was wrong**
Intent (R5.2): most fiber per extra kcal, never > kcal target +5%, practical portions. Recomputed on the SWAPS values in fiber.js (= R5.2 table + kiwi from R7.2), score = fiberGain / max(kcalDelta, 20):
| rank | id | fiber g | Δkcal | score |
|---|---|---|---|---|
| 1 | sweetpot | 4.4 | −60 | 0.220 |
| 2 | brownhalf | 2.4 | −14 | 0.120 |
| 3 | spinach200 | 4.4 | 46 | 0.0957 |
| 4 | broc200 | 6.6 | 70 | 0.0943 |
| 5 | peas100 | 5.7 | 81 | 0.0704 |
| 6 | kiwi2 | 4.5 | 92 | 0.0489 |
| 7 | mushroom150 | 1.5 | 33 | 0.0455 |
| 8 | oats40 | 4.2 | 156 | 0.0269 |
Oats is **last**, so “oats/peas/broc in top 3” contradicts the stated intent; that AC is withdrawn. Two practical rules are added (design choices, not sourced):
- **(a) Minimum benefit:** drop swaps with fiberGain < 3 g (removes brownhalf, which R5.2 already labels “帮助有限”, and mushroom150).
- **(b) Replacements need a target:** `replace` swaps are offered only if the day has ≥ that much logged white rice (sweetpot: `riceCooked` ≥ 150 g; brownhalf: ≥ 200 g), and at most one rice-replacement is shown.
- **(c) Order:** sort by score desc only (drop the “replacements first” pre-sort; the max(Δ,20) floor already ranks them high). Tie → lower Δkcal, then id.
- Unchanged: room = kcalTarget×1.05 − kcal, filter Δkcal ≤ room; fiber ≥ target → []; gutHigh appends the water tip after the top 3.
New signature: `suggestFiber({fiber, fiberTarget=28, kcal, kcalTarget, riceG=0, gutHigh=false}, n=3)`.
Fixtures (expected order exact):
- F1 plan day: fiber 15, kcal 1782, kcalTarget 1800 (room 108), riceG 400 → **[sweetpot, spinach200, broc200]** (oats 156 > room, brownhalf <3 g).
- F2 no rice: fiber 10, kcal 1200, kcalTarget 1800, riceG 0 → **[spinach200, broc200, peas100]**.
- F3 tight: fiber 12, kcal 1880, kcalTarget 1800 (room 10), riceG 200 → **[sweetpot]**.
- F4 tight, no rice: same as F3 but riceG 0 → **[]**.
- F5 rice 160 g: fiber 15, kcal 1500, kcalTarget 1800, riceG 160 → **[sweetpot, spinach200, broc200]** (brownhalf ineligible anyway).
- F6 room 60: fiber 15, kcal 1830, kcalTarget 1800 (room 60), riceG 0 → **[spinach200]**.
- F7 done: fiber 28 → []. F8 gutHigh with F2 inputs → F2 list + `water` as 4th.

#### ✅ v0.7.3 R8 · R-10 plateau — exact rule (as shipped in `review.js plateau()`, plus required follow-ups)
Shipped rule (read from code):
1. Window = weigh-ins with date in (today−14 d, today], i.e. 14 calendar days today−13 … today (date strings parsed as UTC midnight on both sides; consistent).
2. Need ≥ 10 weigh-ins in the window (≈ 5/wk), else `{plateau:false, reason:'sparse'}`.
3. Split: A = today−13 … today−7, B = today−6 … today; each needs ≥ 3 weigh-ins, else sparse.
4. delta = mean(B) − mean(A) (plain means of the weigh-ins, i.e. this-week calendar average vs previous-week calendar average).
5. plateau = |delta| < 0.1 kg **or** delta > 0.
Mismatches vs research text: (i) research said “MA7 change over ≥ 14 d”; code compares two adjacent 7-day calendar means (MA7 today vs MA7 7 days earlier). **Ruling: keep the code's rule** — it uses 14 days of data, which is what “over ≥ 14 d” intended; update the R-10 wording to this. (ii) Rising weight returns plateau:true with no distinction. **Ruling:** return `reason:'up'` when delta ≥ 0.1, `reason:'flat'` when |delta| < 0.1; UI label 上升 vs 持平 (already listed in A8). (iii) No adherence condition. **Ruling:** the “−100–150 kcal” action is offered only if the same review week has `kcalOkDays ≥ 5` and `logged ≥ 5`; otherwise show “先把记录和热量做稳一周再判断” and offer only +步数/保持. (iv) No cooldown. **Ruling:** suppress plateau prompts for 14 days after any saved review decision of −kcal or 维持周, and while `breakState` is active (window must start after the break's `until`). All thresholds (0.1 kg, 10 logs, 3 per half, 5 adherent days, 14-day cooldown) are design choices derived from R3.6, not clinical cut-offs.
Fixtures (today = 2026-10-15; A = 10-02…10-08, B = 10-09…10-15; daily weigh-ins unless stated; values chosen to be exact in binary):
- P1 flat: A all 70.25, B all 70.1875 → delta −0.0625 → `{plateau:true, reason:'flat'}`.
- P2 losing: A 70.25, B 70.125 → delta −0.125 → plateau false.
- P3 rising: A 70.0, B 70.25 → delta +0.25 → `{plateau:true, reason:'up'}`.
- P4 sparse: 9 weigh-ins total → reason 'sparse'.
- P5a half sparse: A 7 + B 2 (total 9) → `{plateau:false, reason:'sparse'}`.
- P5b: A 7 at 70.25 + B 3 at 70.1875 (total 10, flat values) → `{plateau:true, reason:'flat'}`.
- P6 edges: an entry dated 10-01 (today−14) is excluded; 10-02 and 10-15 are included; 10-08 is in A, 10-09 in B.
- P7 adherence: P1 weights + week review kcalOkDays 3 → plateau true but actions = ['steps','keep'] (no −kcal).
- P8 cooldown: P1 weights + review decision '−kcal' saved 2026-10-05 → suppressed (until 2026-10-19); same decision saved 2026-09-30 → shown.
- P9 break: breakState.until 2026-10-10 → suppressed (window overlaps break).

### R8 update — click-through UX audit (2026-10-15 ~05:45 SGT)
Method: live https://grot666.github.io/zuofansong/ clicked through in a browser at **390×844** viewport while v0.7.1→v0.7.4 deployed (fresh profile → first run → profile → log → plan → review). Screenshots (9 PNG, ~750 KB) are on the bot's box at `/workspace/r8/` (01-firstrun-today … 09-weekly-review-fullpage); not committed (binary upload not available via the docs connector). Findings are observational; px sizes are approximate.
Positives confirmed: no `alert()` encountered; no horizontal overflow at 390 px; one-tray template steps all show ✅护腕; template log = 1 tap with undo.

- **P1 · UX-4 Weekly review is hard to reach** — Why: only linked from the index-page footer; absent from the 7-item bottom nav and from plan.html/review.html footers. AC: one shared nav (same items/order) on index, plan, review; review reachable in 1 tap from every page; today view shows a “本周回顾” card on Sunday/Monday if this week has no saved review. Tests: text-check each `*.html`/nav module contains a link to `review.html`; pure `reviewDue(today, reviews)` → true on 2026-10-18 (Sun) with no review for that week, false after a review is saved. ✅
- **P1 · UX-5 Fixed bottom nav covers content** — Why: on review.html the nav covers the 保存 button and the “已保存。” message. AC: `body`/main container gets `padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom))`; `--nav-h` defined once and used by the nav; save confirmation also rendered as a toast above the nav. Tests: CSS text-check that every page's main container uses `--nav-h` + `safe-area-inset-bottom`; `viewport-fit=cover` in each html meta. ✅
- **P1 · UX-6 Profile 保存 gives no feedback** — Why: on #me, tapping 保存 re-renders silently; user can't tell it worked. AC: after successful save show toast “已保存 · 每日目标已更新” (2–3 s, `role=status`/`aria-live=polite`) and scroll to/highlight the 每日目标 card; validation errors (UX-2) shown inline instead. Tests: pure save handler returns `{ok:true, changed:[keys]}`; UI test (DOM shim) asserts a `[role=status]` node with “已保存” after submit; no toast when validation fails.
- **P1 · UX-7 plan.html is one very long scroll** — Why: 7 day-cards + shopping list + prep + steps in one page; shopping list is buried. AC: sticky segmented control at top: 菜单 / 购物清单 / 备餐 (anchor links or tabs, hash-addressable `#list`, `#prep`); day cards collapsed except today (tap to expand, `<details>`); shopping list reachable in 1 tap. Tests: plan page contains anchors `#menu #list #prep`; exactly one day `<details open>` = today's weekday; `plan.html#list` scrolls/selects the list section (DOM shim).
- **P2 · UX-8 Update toast repeats after dismissal** — Why: “已更新到新版本 · 刷新” reappeared 3+ times across navigations after being dismissed. AC: show once per new SW version; store `updateSeen = VERSION` (add to KNOWN_KEYS) on dismiss or refresh; don't show on navigations where the controlling SW version == `updateSeen`. Tests: pure `shouldShowUpdate({newVersion, updateSeen})` → true first time, false after seen, true again for a newer version.
- **P2 · UX-9 换一套 regenerates silently** — Why: whole week replaced with no feedback/undo. AC: toast “已换一套菜单 · 撤销” for 6 s; undo restores the previous seed/week exactly. Tests: pure `regenWeek(state)` returns `{week, prevSeed}`; undo with prevSeed yields deep-equal previous week.
- **P2 · UX-10 First run is a dense dashboard; 去设置 vs 先用示例 ambiguous** — Why: new users land on the full today dashboard; button meanings unclear. AC: 3-step onboarding sheet on first run: (1) 身高/体重/出生日期/性别 (2) 目标体重+日期 (shows pace via paceCheck) (3) “记第一餐” with 3 template buttons; “跳过，先看看” always visible; rename buttons to “填我的数据（1 分钟）” / “先用示例数据看看”. Tests: no profile & !onboardSeen → sheet rendered step 1; completing step 1 saves only edited keys (mergeProfileEdit); skip sets onboardSeen.
- **P2 · UX-11 Bottom nav: 7 text items, ~50 px targets** — Why: crowded at 390 px. AC: ≤ 5 items with icon + label (e.g. 今日 / 搭配 / 菜单 / 回顾 / 我的; 蔬菜/杂粮饭/食材 move under 搭配 or a “更多” sheet); each target ≥ 44×44 px (Apple HIG minimum: https://developer.apple.com/design/human-interface-guidelines/accessibility); active item `aria-current=page`. Tests: nav module exports ≤ 5 items; CSS min-height/min-width ≥ 44px on nav links. ✅
- **P2 · UX-12 Quick-add datalist hides the 133-food library** — Why: `<datalist>` only appears after typing; users can't browse. AC: under the input show chips: 最近 (up to 8) + 常用 (top 8 by use count, fallback to curated 8: 鸡蛋/米饭/鸡腿肉/西兰花/燕麦/豆腐/牛奶/金枪鱼); “全部食材 ›” links to #foods with a log button per row. Tests: pure `quickChips(recents, useCount, foods)` returns ≤ 16 unique ids, recents first; empty history → curated 8.
- **P2 · UX-13 Dense clinical copy / unrealistic suggestions** — Why: e.g. protein card says “可加 15 个鸡蛋”. AC: protein-gap suggestion caps eggs at 3/day extra and splits the remainder across tofu/yogurt/lean meat with realistic portions (≤ 1 serving each), else “今天蛋白差得较多，明天早点安排”; copy ≤ 1 line per card on 390 px. Tests: pure `proteinFill(gapG)` → for gap 90 g never returns eggs > 3 and every item ≤ 1 serving; gap 10 g → single suggestion.
- **P2 · UX-14 TFCC: 拍黄瓜 and 切好块 without 护腕 marker** — Why: plan Tuesday “拍黄瓜” and prep line “西兰花/胡萝卜切好块” imply forceful smashing/chopping; no 护腕 flag (contradicts R-05 and R7.1 rules). AC: replace 拍黄瓜 with 拌黄瓜片 (刨片器/刀切薄片); prep copy “西兰花用手掰小朵或厨房剪刀剪；胡萝卜买切好的或刨片”; every recipe/prep step carries `wristSafe` (true/false) and false requires `wristNote` + alternative. Tests: data test — no recipe/prep text matches /拍|剁|砸|颠锅/ unless `wristSafe:false` with `wristNote`; every step has boolean `wristSafe`.

## PROMPT.md re-audit (engineer, 2026-10-15 ~05:55 SGT)
Line-by-line check of PROMPT.md against the live app (v0.7.6). Covered and verified: §2.1 targets and guardrails, §2.2 raw/cooked + soaking, §2.3 34 recipes with oil g and filters, §2.4 fat wallet, §2.5 protein gap + gut risk, §2.6 133 foods (109 unverified with ≈), §3 features 1–10, §4 tech (.nojekyll, manifest, dark mode, labelled inputs; click-to-open audit at 360 px: 0 issues, no overflow), §7 footer. Gaps:
- G1 (P1) §2 "use the 4 scores when suggesting meals": scores live only in the plate view. AC: pure `mealScores(items, food)` in core with tests; plan page shows 健康/好做/便宜/好吃 per lunch/dinner; plate view uses the same function. ✅
- G2 (P1) A25 follow-up / §2.5: no protein-powder food. AC: `wheyPowder` food (per 100 g, `verified:false`, label-based); plan add-on uses powder (≤ maxScoops × scoopG) only when profile.usesPowder, after whole-food add-ons; test. ✅
- G3 (P2) §6 reliability "backup reminders": none. AC: store `lastExport` on export; today page shows a dismissable hint when ≥14 days since last export and ≥7 logged days; test the pure check. ✅
- G4 (P2) §6 nutrition "食堂套餐" estimates missing. AC: ≥3 canteen set-meal entries, `verified:false`, source noted. ✅
