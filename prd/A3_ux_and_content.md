# Appendix A3: UX, Flows and Content

Part of the [BUE PRD](PRD.md). Normative for both app shells. Visual design (brand, colours, typography) is **[OPEN-3]** and not specified here; layouts follow platform conventions (Human Interface Guidelines, Material 3).

---

## 1. Experience Principles

| ID | Principle | Consequence for design |
|---|---|---|
| UX-1 | Calm technology | The app lives at the periphery. Short interactions, no feeds, no badge counts on the app icon, no in-app notifications centre. |
| UX-2 | Success-only feedback | No red, no crosses, no "missed" lists, no percentages that can fall. Misses are never displayed. |
| UX-3 | One thing at a time | At most one open proposal; the Today screen shows one plan and one fallback. |
| UX-4 | Honest and explainable | Every number and suggestion has a "Why?" with plain-language reasons. |
| UX-5 | Effortless refusal | "Not today" is as prominent as "Done"; it never triggers a follow-up prompt the same day for the same anchor. |
| UX-6 | User in control | Pause, fewer prompts, change anchors, change data sources: each reachable in ≤ 2 taps from Today. |

## 2. Screen Inventory

| Screen | Purpose | Key elements |
|---|---|---|
| **Welcome** | Promise and principles | "Small steps that actually happen. On hard days we'll ask for less." 3 cards, start button |
| **Goal & focus** | FR-1 | Focal behaviour (walking), weekly target (pre-filled, editable), short explanation that small steps count |
| **Anchors** | FR-2 | Pick 1–3 routines from suggestions (after breakfast, after lunch, after work, evening) with typical times; custom anchor |
| **Safety check** | FR-4 | PAR-Q+-based questions (A4 §2), plain language; outcome screen if restricted or blocked |
| **Your data, your choice** | FR-5 | Toggles per source with benefit statement (§5); permissions requested in context, one at a time |
| **Daily check-in setup** | FR-3 | On/off, time, max questions (0–3); preview of a check-in |
| **Rhythm** | FR-3 | Quiet hours, prompts per day (0–3, default 2) |
| **Today** | Home | Plan for today (anchor + suggested step + fallback), accumulated gain, foundation stage, this week's consistency dots (filled only), "Why this?" |
| **Touchpoint** | Daily exchange | Close the loop → listen (0–3 items) → advise (plan + fallback) → adjust |
| **Proposal card** | In-app counterpart of a notification | Step, time window, Done / Later / Not today, "Why this?" |
| **Why not? sheet** | Optional after "Not today" or a timed-out engaged proposal | 6 chips + skip; thank-you microcopy |
| **Why this? sheet** | FR-60 | 2–3 sentences generated from `Explanation`; link "What the app thinks about today" |
| **Today's picture** | FR-61 (S) | Energy, stress, time, weather, motivation as words with ranges; "This doesn't fit" correction |
| **Progress** | FR-50–52 | Accumulated gain curve (only rises), foundation stages, consistency weeks, highlights |
| **Settings** | FR-62–63 | Pause, rhythm, anchors, data sources, check-in, research participation, export, delete |
| **Maintenance** | A1 §8 | "Walking has become part of your day." Options: keep weekly check-in, choose a new focus (Phase 3) |

## 3. Daily Touchpoint

**Timing.** At the chosen time (default 07:30 or after the first anchor); delivered as one notification "Your plan for today is ready" (P2: silent briefing card, no notification unless the user opted in).

**Structure (≤ 45 s median).**

1. **Close the loop** (1 line): success-only. *"Yesterday: 2 walks, 15 minutes. Nicely done."* If nothing happened: *"New day, fresh start."* (never mention the miss).
2. **Listen** (0–3 items, chosen by VOI, A1 §6.4):

| itemId | Question | Answer format |
|---|---|---|
| `touch_energy` | How is your energy this morning? | 5-point emoji/word scale |
| `touch_stress` | How full does today feel? | 5-point |
| `touch_timep` | How much time pressure do you expect? | 5-point |
| `touch_motiv` | How much do you feel like moving today? | 5-point |
| `touch_free_time_<period>` | Around lunch / in the afternoon / in the evening: how much free time will you have? | none / ~10 min / 20+ min |

3. **Advise**: today's plan per anchor with the chosen step and the pre-agreed fallback. *"After lunch: 10-minute walk. If it gets tight: 2 minutes around the block counts too."*
4. **Adjust**: "Change plan" (pick another anchor, smaller step, or "rest day today" – a rest day is never penalised and is counted as earned rest if available).

## 4. Proposals and Notifications

**Rules.**

- Standard interruption level only. No sounds beyond system default; no repeated notifications; no badges.
- One pending proposal at a time; a new decision replaces the pending notification.
- Actions directly on the notification: **Done**, **Later**, **Not today**.
- **Later** re-plans within the same anchor window (max once); **Not today** closes the anchor for today.
- If an engaged proposal is neither done nor verified within 90 min, at most one gentle in-app question may appear at the next app open: *"Did you get to walk? No worries if not."* with Done / Not this time / skip. Never as a notification.

**Template structure.** `{context hook}` + `{step}` + `{optional reassurance}`. Templates are versioned data (`templates` in config), each annotated with BCT codes and allowed reason codes.

| templateId | Example (EN) | Example (DE) | Allowed reason codes |
|---|---|---|---|
| `walk_after_anchor_v1` | After lunch: a 10-minute walk? | Nach dem Mittagessen: 10 Minuten gehen? | any |
| `walk_window_v1` | You've got a gap until 14:00. 10 minutes outside? | Bis 14 Uhr hast du Luft. 10 Minuten raus? | feasible window known |
| `walk_small_step_v1` | Busy day. Just 2 minutes around the block – it counts fully for your habit. | Voller Tag. Nur 2 Minuten um den Block – zählt voll für deine Gewohnheit. | HARD_DAY_SMALL_STEP |
| `walk_step_up_v1` | You've been walking regularly. Up for 20 minutes today? | Du gehst inzwischen regelmäßig. Heute 20 Minuten? | GOOD_DAY_STEP_UP |
| `breathe_lateral_v1` | No room for a walk today. Three slow minutes of breathing instead? | Heute ist kein Platz für einen Spaziergang. Stattdessen drei Minuten ruhig atmen? | lateral, below floor |

## 5. Data-Source Benefit Statements (onboarding and settings)

Statements must be honest and based on the simulation (thesis Chapter 5); they may be refined after the pilot.

| Source | Statement |
|---|---|
| None | "The app works without any data. It learns from which suggestions you take up." |
| Daily check-in | "30 seconds in the morning. Telling the app when you have time helps it most – about as much as connecting your calendar." |
| Calendar | "The app only looks at when you're busy, never at titles or people." |
| Activity data | "Lets the app notice walks automatically, so you don't need to confirm them." |
| Sleep and heart-rate variability | "Helps the app recognise days when you have less energy and suggest smaller steps." |
| Weather | "Avoids suggesting outdoor walks in heavy rain or heat." |

## 6. Copy Rules (binding, NFR-2)

**Must.**

- Celebrate any executed step equally in tone ("2 minutes counts").
- Frame smaller steps as smart, not as lowered expectations.
- Use the user's own goal and anchors.
- Offer the fallback before it is needed (morning plan), not after a miss.
- Keep notifications ≤ 90 characters (DE may use ≤ 110).

**Must not.**

- Mention misses, failures, broken streaks or lost progress.
- Use urgency ("now or never", "only today", countdowns), guilt ("you promised"), social comparison, fear appeals or health threats.
- Use "streak at risk" or loss framing of any kind.
- Claim medical effects or use diagnostic language (A4 §1).
- Use exclamation-mark chains, all caps or emoji in notifications (emoji allowed in in-app celebratory moments, max one).

**Review gate.** Every new or changed template is checked by an automated linter (banned-phrase list, length, reason-code consistency) and approved by a human content reviewer before it enters the config bundle.

## 7. Engagement Elements

| Element | Behaviour | BCT | Model link |
|---|---|---|---|
| **Accumulated health gain** | Running total of realised immediate benefit (A1 §7); line chart that only rises; milestone moments every 50 points | 2.2, 2.4 | Feedback; self-efficacy |
| **Foundation** | Five stages (e.g. "first stones" … "solid ground") mapped from $h_{c^\star}$; never decreases visually within a week | 2.2 | Habit strength |
| **Consistency weeks** | Week dots filled for active days; week counts with k of 7; earned rest days (1 per 2 counted weeks, max 2 banked); automatic rest during safety blocks; after a missed week: "fresh start" | 2.3, 8.3, 10.4 | Meta-habit; no objective term |
| **Weekly reflection** (S) | Sunday card: best moment of the week, one sentence on what helped | 1.2 (light), 2.2 | – |

No leaderboards, no badges for frequency of app opens, no rewards for engagement with the app itself.

## 8. Accessibility and Localisation

- Dynamic type up to the largest accessibility sizes without truncating actions.
- All scales and charts with text alternatives; consistency dots announced as "4 active days this week".
- Touch targets ≥ 44 pt / 48 dp.
- Haptics optional; reduced-motion setting respected.
- German and English at launch; informal address ("du") in German **[OPEN]** to be confirmed by authors.
