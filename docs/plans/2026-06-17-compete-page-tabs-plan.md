# Compete Page 3-Tab Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure `app/compete/page.tsx` into 3 tabs (Rank / Leaderboard / Challenges) in a sticky bar above `BottomNav`, removing the always-visible incoming-challenge card and the leaderboard bottom-sheet.

**Architecture:** Single client component, no new files. Replace `leaderboardOpen` boolean state with an `activeTab` enum that gates which content block renders inside the existing scrollable content `<div>`. Add a new sticky tab-bar `<div>` between that content area and `<BottomNav>`. The Challenge sheet modal (opponent/lift/format picker) is untouched — only the things that can open it move.

**Tech Stack:** Next.js 16 App Router, Tailwind, Framer Motion, Lucide React. No test runner exists in this repo (no jest/vitest, no `*.test.*` files) — verification is manual, via the project's own `/run` (start dev server) and `/verify` (confirm a fix works in the running app) skills, per `reference/AGENT-GUIDE.md`'s Skills table. Every task below ends with a manual browser check instead of an automated test run.

**Design doc:** `docs/plans/2026-06-17-compete-page-tabs-design.md` — read it first for the full rationale and approved layout.

**Read before starting:** `reference/AGENT-GUIDE.md` (design system — colors, modal/tab/button patterns, animation conventions). Do not deviate from those patterns in this plan.

---

### Task 1: Add `activeTab` state, remove `leaderboardOpen`, import `Medal` icon

**Files:**
- Modify: `app/compete/page.tsx:5` (import line)
- Modify: `app/compete/page.tsx:99-105` (state declarations inside `CompetePage`)

**Step 1: Update the lucide-react import**

Find:
```tsx
import { Swords, Crown, ChevronRight, Check, X, ArrowUp, Flame, Trophy } from 'lucide-react'
```
Replace with:
```tsx
import { Swords, Crown, ChevronRight, Check, X, ArrowUp, Flame, Trophy, Medal } from 'lucide-react'
```

**Step 2: Replace the state block**

Find:
```tsx
  const [challengeOpponent, setChallengeOpponent] = useState<string | null>(null)
  const [challengeSuperfight, setChallengeSuperfight] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [challengeLift, setChallengeLift] = useState<string | null>(null)
  const [challengeFormat, setChallengeFormat] = useState<'weight' | 'reps'>('weight')
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [boardView, setBoardView] = useState<'class' | 'open'>('class')
```
Replace with:
```tsx
  const [challengeOpponent, setChallengeOpponent] = useState<string | null>(null)
  const [challengeSuperfight, setChallengeSuperfight] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [challengeLift, setChallengeLift] = useState<string | null>(null)
  const [challengeFormat, setChallengeFormat] = useState<'weight' | 'reps'>('weight')
  const [activeTab, setActiveTab] = useState<TabId>('rank')
  const [boardView, setBoardView] = useState<'class' | 'open'>('class')
```

**Step 3: Verify**

This won't compile yet — `TabId` doesn't exist until Task 2. That's expected; proceed directly to Task 2 before checking the build.

**Step 4: Commit**

Do not commit yet — Task 1 and Task 2 are one logical unit. Commit at the end of Task 2.

---

### Task 2: Define the `TABS` array and `TabId` type

**Files:**
- Modify: `app/compete/page.tsx` — add near the other module-level consts (right after the `avatarColor` function, before `export default function CompetePage()`, i.e. after line 90)

**Step 1: Add the tab definitions**

Insert after the `avatarColor` function (before `export default function CompetePage()`):
```tsx
const TABS = [
  { id: 'rank', label: 'Rank', icon: Medal },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'challenges', label: 'Challenges', icon: Swords },
] as const
type TabId = (typeof TABS)[number]['id']
```

**Step 2: Verify it compiles**

Run: `npm run dev` (or use the project's `/run` skill) from `app/compete/page.tsx`'s repo root.
Expected: dev server starts without a TypeScript error about `TabId` being undefined. (Other errors are expected at this point — later tasks still reference JSX that doesn't exist yet. If using `/run`, just confirm there's no `TabId`-related error in the terminal output.)

**Step 3: Commit**

```bash
git add app/compete/page.tsx
git commit -m "feat(compete): add activeTab state and TABS definition"
```

---

### Task 3: Simplify the header — drop the "Power Rank" eyebrow

**Files:**
- Modify: `app/compete/page.tsx:240-243`

**Step 1: Replace the header block**

Find:
```tsx
      <header className="px-5 pt-12 pb-3 relative">
        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em]">Power Rank</p>
        <h1 className="text-2xl font-bold leading-none">Compete</h1>
      </header>
```
Replace with:
```tsx
      <header className="px-5 pt-12 pb-3 relative">
        <h1 className="text-2xl font-bold leading-none">Compete</h1>
      </header>
```

**Step 2: Verify**

Visually confirm in the browser (via `/run`) that the Compete page header now shows only "Compete", no orange eyebrow text above it.

**Step 3: Commit**

```bash
git add app/compete/page.tsx
git commit -m "feat(compete): drop Power Rank eyebrow from header"
```

---

### Task 4: Gate the hero card behind the Rank tab, remove the old fixed Challenge button

**Files:**
- Modify: `app/compete/page.tsx:245-355` (content div through the old fixed-bottom Challenge button)

**Step 1: Wrap the hero card in the Rank tab condition**

Find the opening of the content div and the hero card:
```tsx
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-3 relative">

        {/* HERO — where you stand + the climb hook */}
        <div className="rounded-2xl bg-[#1C1C1E] border border-[#252528] overflow-hidden">
```
Replace with:
```tsx
      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-3 relative">

        {activeTab === 'rank' && (
        <>
        {/* HERO — where you stand + the climb hook */}
        <div className="rounded-2xl bg-[#1C1C1E] border border-[#252528] overflow-hidden">
```

Find the end of the hero card's closing `</div>` (the one right before the `{/* PENDING ... */}` comment):
```tsx
          </button>
        </div>

        {/* PENDING — urgent, only when present */}
```
Replace with:
```tsx
          </button>
        </div>
        </>
        )}

        {/* PENDING — urgent, only when present */}
```

**Step 2: Remove the old fixed-bottom Challenge button**

Find (this sits after the closing `</div>` of the scrollable content area, before `<BottomNav active="compete" />`):
```tsx
      </div>

      {/* Primary action — the loudest thing on the page */}
      <div className="px-5 pb-6 pt-3 relative">
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => openChallenge(rival?.name ?? null)}
          className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
        >
          <Swords className="w-4 h-4" />
          Challenge
        </motion.button>
      </div>

      <BottomNav active="compete" />
```
Replace with (tab bar placeholder added now, filled in Task 8 — for this task just remove the button and close the content div correctly; leave a TODO comment so Task 8 has an anchor):
```tsx
      </div>

      {/* TODO(Task 8): sticky 3-tab bar goes here */}

      <BottomNav active="compete" />
```

**Step 3: Verify**

In the browser, confirm: Compete page now shows the hero card with no Challenge button below it, and no crash. (The Pending/Leaderboard sections below the hero are still unconditionally rendered at this point — that's fixed in Tasks 5–6.)

**Step 4: Commit**

```bash
git add app/compete/page.tsx
git commit -m "feat(compete): gate hero card behind Rank tab, remove fixed Challenge button"
```

---

### Task 5: Move the leaderboard into an inline Leaderboard tab

**Files:**
- Modify: `app/compete/page.tsx` — the old "LEADERBOARD — opens the full board on tap" button block, and the old Leaderboard sheet `AnimatePresence` block
- Modify: `renderLeaderRow` and `renderOpenRow` (drop `setLeaderboardOpen(false)`)

**Step 1: Update `renderLeaderRow`'s onClick**

Find:
```tsx
        onClick={() => { if (!entry.you) { setLeaderboardOpen(false); openChallenge(entry.name) } }}
```
Replace with:
```tsx
        onClick={() => { if (!entry.you) openChallenge(entry.name) }}
```

**Step 2: Update `renderOpenRow`'s onClick**

Find:
```tsx
        onClick={() => { if (!entry.you) { setLeaderboardOpen(false); openChallenge(entry.name, !sameClass) } }}
```
Replace with:
```tsx
        onClick={() => { if (!entry.you) openChallenge(entry.name, !sameClass) }}
```

**Step 3: Replace the old Leaderboard button with inline tab content**

Find:
```tsx
        {/* LEADERBOARD — opens the full board on tap */}
        <button
          onClick={() => setLeaderboardOpen(true)}
          className="w-full flex items-center gap-3 rounded-2xl bg-[#1C1C1E] border border-[#252528] p-4 hover:border-[#3A3A3C] transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF4500]/15 border border-[#FF4500]/30 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-[#FF4500]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white">Leaderboard</p>
            <p className="text-xs font-semibold text-[#9A9AAA]">{shortClassName(WEIGHT_CLASSES[selectedClass].full)} · {rankings.length} fighters</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#636366]" />
        </button>

      </div>
```
Replace with:
```tsx
        {activeTab === 'leaderboard' && (
        <>
        <div className="flex bg-[#161618] rounded-xl p-1 border border-[#252528]">
          {([['class', 'My Class'], ['open', 'Open']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setBoardView(v)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${boardView === v ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#636366]'}`}>{l}</button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          {boardView === 'class' ? rankings.map(renderLeaderRow) : OPEN_RANKINGS.map(renderOpenRow)}
          {boardView === 'open' && <p className="text-[10px] text-[#48484A] text-center mt-2">Cross-class · pound-for-pound (size-adjusted)</p>}
        </div>
        </>
        )}

      </div>
```

**Step 4: Remove the old Leaderboard sheet**

Find the entire block (from the comment through its closing `</AnimatePresence>`):
```tsx
      {/* Leaderboard sheet */}
      <AnimatePresence>
        {leaderboardOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLeaderboardOpen(false)}
              className="fixed inset-0 bg-black/90 z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F] border-t border-[#252528] rounded-t-3xl z-[70] flex flex-col max-h-[92dvh]"
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
              </div>
              <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold">Leaderboard</h2>
                  <p className="text-[#9A9AAA] text-sm">Tap a fighter to challenge</p>
                </div>
                <button onClick={() => setLeaderboardOpen(false)} className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 pb-3 flex-shrink-0">
                <div className="flex bg-[#161618] rounded-xl p-1 border border-[#252528]">
                  {([['class', 'My Class'], ['open', 'Open']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setBoardView(v)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${boardView === v ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#636366]'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-1.5">
                {boardView === 'class' ? rankings.map(renderLeaderRow) : OPEN_RANKINGS.map(renderOpenRow)}
                {boardView === 'open' && <p className="text-[10px] text-[#48484A] text-center mt-2">Cross-class · pound-for-pound (size-adjusted)</p>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Challenge sheet — opponent + lift + format */}
```
Replace with just:
```tsx
      {/* Challenge sheet — opponent + lift + format */}
```

**Step 5: Verify**

In the browser: tap into a state where `activeTab === 'leaderboard'` is forced temporarily (or wait until Task 8 wires the tab bar) — for now, sanity-check the build compiles with no reference to `leaderboardOpen` anywhere (search the file). Run a project-wide check:

Run: `grep -n "leaderboardOpen" app/compete/page.tsx`
Expected: no output (zero matches).

**Step 6: Commit**

```bash
git add app/compete/page.tsx
git commit -m "feat(compete): inline leaderboard into its own tab, remove sheet"
```

---

### Task 6: Move pending challenges into the Challenges tab, add "New Challenge" button

**Files:**
- Modify: `app/compete/page.tsx` — the "PENDING — urgent, only when present" block

**Step 1: Replace the pending-challenges block**

Find:
```tsx
        {/* PENDING — urgent, only when present */}
        {PENDING_CHALLENGES.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest px-1">Incoming</p>
            {PENDING_CHALLENGES.map((c, i) => (
              <div key={i} className="rounded-2xl bg-[#FF4500]/8 border border-[#FF4500]/25 p-3 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                  style={{ backgroundColor: `${avatarColor(c.from)}22`, color: avatarColor(c.from), border: `1.5px solid ${avatarColor(c.from)}55` }}
                >
                  {initials(c.from)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse flex-shrink-0" />
                    {c.from} challenged you
                  </p>
                  <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5 truncate">{c.lift} · {c.format === 'weight' ? 'most weight' : 'most reps'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.9 }} aria-label="Accept"
                    className="w-10 h-10 rounded-xl bg-[#22C55E] flex items-center justify-center shadow-[0_2px_14px_rgba(34,197,94,0.4)]">
                    <Check className="w-5 h-5 text-white" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} aria-label="Decline"
                    className="w-10 h-10 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white">
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        )}
```
Replace with:
```tsx
        {activeTab === 'challenges' && (
        <>
        {PENDING_CHALLENGES.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest px-1">Incoming</p>
            {PENDING_CHALLENGES.map((c, i) => (
              <div key={i} className="rounded-2xl bg-[#FF4500]/8 border border-[#FF4500]/25 p-3 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                  style={{ backgroundColor: `${avatarColor(c.from)}22`, color: avatarColor(c.from), border: `1.5px solid ${avatarColor(c.from)}55` }}
                >
                  {initials(c.from)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse flex-shrink-0" />
                    {c.from} challenged you
                  </p>
                  <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5 truncate">{c.lift} · {c.format === 'weight' ? 'most weight' : 'most reps'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.9 }} aria-label="Accept"
                    className="w-10 h-10 rounded-xl bg-[#22C55E] flex items-center justify-center shadow-[0_2px_14px_rgba(34,197,94,0.4)]">
                    <Check className="w-5 h-5 text-white" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} aria-label="Decline"
                    className="w-10 h-10 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white">
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#636366] text-center py-6">No pending challenges</p>
        )}

        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => openChallenge(null)}
          className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
        >
          <Swords className="w-4 h-4" />
          New Challenge
        </motion.button>
        </>
        )}
```

**Step 2: Verify**

Confirm the file still compiles (`/run`) and `grep -c "activeTab === " app/compete/page.tsx` returns `3` (Rank, Leaderboard, Challenges blocks).

Run: `grep -c "activeTab === " app/compete/page.tsx`
Expected: `3`

**Step 3: Commit**

```bash
git add app/compete/page.tsx
git commit -m "feat(compete): move pending challenges + New Challenge button into Challenges tab"
```

---

### Task 7: Add the sticky 3-tab bar

**Files:**
- Modify: `app/compete/page.tsx` — replace the `{/* TODO(Task 8): sticky 3-tab bar goes here */}` placeholder added in Task 4

**Step 1: Replace the placeholder**

Find:
```tsx
      {/* TODO(Task 8): sticky 3-tab bar goes here */}

      <BottomNav active="compete" />
```
Replace with:
```tsx
      {/* Section tab bar — Rank / Leaderboard / Challenges */}
      <div className="px-5 pb-3 pt-2 border-t border-[#252528] bg-[#0D0D0F] flex-shrink-0 relative">
        <div className="flex bg-[#161618] rounded-xl p-1 border border-[#252528]">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            const showDot = tab.id === 'challenges' && PENDING_CHALLENGES.length > 0
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  active ? 'bg-[#1C1C1E] text-[#FF4500] shadow-sm' : 'text-[#636366]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {showDot && (
                  <span className="absolute top-1 right-[28%] w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <BottomNav active="compete" />
```

**Step 2: Verify in the browser**

Start the dev server (`/run` skill) and manually check:
1. Compete page loads with the Rank tab active by default (hero card visible, no other tab content showing).
2. Tapping "Leaderboard" shows the My Class/Open toggle + ranking rows, no hero card, no pending challenges.
3. Tapping "Challenges" shows the pending-challenge card (Marcus T. · Squat) and the "New Challenge" button below it, with a pulsing orange dot on the Challenges tab itself.
4. Tapping a leaderboard row opens the Challenge sheet pre-filled with that opponent.
5. Tapping "New Challenge" on the Challenges tab opens the Challenge sheet with no opponent preselected.
6. Tapping the climb-hook button on the Rank tab ("Beat {rival} to hit #N") opens the Challenge sheet pre-filled with the rival.
7. No console errors, no leftover reference to `leaderboardOpen` anywhere (`grep -n "leaderboardOpen" app/compete/page.tsx` → no output, already confirmed in Task 5 but re-check after this task too since this task didn't touch that).

Use the project's `/verify` skill to confirm all of the above in the running app.

**Step 3: Commit**

```bash
git add app/compete/page.tsx
git commit -m "feat(compete): add sticky Rank/Leaderboard/Challenges tab bar above BottomNav"
```

---

### Task 8: Final full-page manual pass + cleanup check

**Files:**
- Read-only check: `app/compete/page.tsx`

**Step 1: Confirm no dead state or unused imports remain**

Run: `grep -n "ChevronRight" app/compete/page.tsx`
Expected: still used inside the hero card's climb-hook button (`<ChevronRight className="w-4 h-4 text-[#636366]" />`) — confirm at least one match remains. (It was previously also used in the now-deleted Leaderboard button; that's fine as long as one usage remains so the import isn't dead.)

Run: `grep -n "leaderboardOpen" app/compete/page.tsx`
Expected: no output.

**Step 2: Full click-through in the browser**

Re-run the full manual checklist from Task 7 Step 2 one more time end-to-end, since several tasks touched overlapping JSX. Use `/verify`.

**Step 3: Update CONTEXT.md**

`app/CONTEXT.md` doesn't yet mention this restructure. Add a line under "Done criteria" reflecting the new tab structure exists (it doesn't change the underlying TODOs — Compete still runs on dummy `RANKINGS_DATA`/`PENDING_CHALLENGES`/`OPEN_ROSTER` — only the navigation shell changed).

Find in `app/CONTEXT.md`:
```
- [ ] Compete page (`/compete`) Rankings & Battles tabs — still `RANKINGS_DATA` / `DUMMY_BATTLES`
```
Replace with:
```
- [x] Compete page (`/compete`) restructured into Rank / Leaderboard / Challenges tabs (sticky bar above BottomNav) — still backed by dummy `RANKINGS_DATA` / `PENDING_CHALLENGES` / `OPEN_ROSTER`, not real Supabase data
```

**Step 4: Commit**

```bash
git add app/CONTEXT.md
git commit -m "docs: update CONTEXT.md for Compete page tab restructure"
```

**Step 5: Push**

Per project convention (push after code changes without being asked):
```bash
git push origin main
```
