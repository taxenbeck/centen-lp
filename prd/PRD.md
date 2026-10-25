# Product Requirements Document: Behaviour Understanding Engine (BUE) App for iOS and Android

| | |
|---|---|
| **Document** | PRD v1.0 (draft for build kick-off) |
| **Date** | 20 October 2026 |
| **Authors** | Tobias Axenbeck, Wencke Nottmeyer |
| **Scientific basis** | Thesis *Behaviour Understanding Engine* (`../thesis/`, reference version), condensed version (`../thesis_short/`), paper (`../paper/`) |
| **Audience** | An agentic development team (AI coding agents plus human leads) |
| **Status** | Draft. Open decisions are listed in §14 and marked **[OPEN]** in the text. |

**How to read this document.** This file is the product contract: it says *what* must be built and *why*. The appendices say *how precisely*:

| Appendix | Content | Main consumers |
|---|---|---|
| [A1 Engine specification](A1_engine_specification.md) | Mathematical and algorithmic specification of the engine, defaults, test oracles | Engine agent, QA/simulation agent |
| [A2 Data model and interfaces](A2_data_model_and_interfaces.md) | Entities, event log, action-class schema, engine API, platform adapters, backend API | All engineering agents |
| [A3 UX and content](A3_ux_and_content.md) | Screens, flows, touchpoint, notifications, copy rules, engagement elements | iOS and Android agents, content reviewer |
| [A4 Safety, privacy and compliance](A4_safety_privacy_compliance.md) | Intended purpose, safety rules, GDPR, store policies, AI Act constraints | Compliance reviewer, all agents |
| [A5 Delivery plan and backlog](A5_delivery_plan_and_backlog.md) | Milestones, epics, user stories with acceptance criteria, agent-team setup, definition of done | Orchestrator, all agents |

Requirement identifiers (`FR-x`, `NFR-x`, `ENG-x`, `UX-x`, `SAF-x`, …) are stable and must be referenced in commits, tests and pull requests.

---

## 1. Summary

Most health apps decide *when* to send a reminder. Very few decide *how much* to ask for, although a person's capacity to act changes from day to day and within a day. The BUE app is a personal coach for health behaviour change that does both. For every moment at which it could intervene, it estimates

- **receptivity**, the probability that the person notices and engages with a prompt now, and
- **momentary barriers** (fatigue, load, time pressure, environment, social context, motivation), the reasons why an engaged person might still not act,

and proposes the action with the highest **expected health gain**: expected benefit × probability of execution, minus the cost of failure and the burden of the prompt. On hard days this is a *smaller* step (the **Smallest Step Strategy**): a 2-minute walk that actually happens rather than a 30-minute walk that does not. The engine learns from whether each proposal was carried out, so the model of the person improves every day.

The first release focuses on **walking** as the focal behaviour, runs the engine **fully on the device**, and works with **any combination of data sources**: none (app only), a 30-second daily check-in, wearables and calendar, or all of them.

In simulation with 200 synthetic users over 90 days, the engine doubled realised benefit compared with a fixed 10-minute prompt (+102%), exceeded a contextual bandit by 76%, and came within 8% of an oracle with full knowledge of the user's state (thesis, Chapter 5). The product must preserve the mechanisms behind that result.

## 2. Problem and Opportunity

**Problem.**

- About a third of adults worldwide do not reach recommended activity levels, and the proportion has not fallen in two decades.
- About half of people who intend to be active do not act on their intention (intention–behaviour gap).
- Existing apps mostly use fixed goals (e.g. 10,000 steps, 30 minutes) and fixed or timing-only reminders. On a bad day the goal is out of reach, the reminder fails, and the user experiences failure. Repeated failure lowers self-efficacy and leads to abandonment.
- Engagement-optimised apps compete for attention with streak pressure, badges and urgency, which can undermine autonomy and does not translate into lasting behaviour.

**Opportunity.**

- Small doses of activity carry the largest marginal health benefit (the dose–response curve is concave), and habits form through repetition rather than volume. A small step that happens is therefore worth more than a large step that does not.
- Smartphones, wearables and calendars provide enough signal to estimate a person's momentary state, and a person's response to the app's own proposals is itself the most informative signal.
- A transparent, success-oriented coach that asks for less on hard days and more on good days can build habits without attention capture.

## 3. Product Principles

These principles are binding. When a requirement is ambiguous, the interpretation that best satisfies them wins.

1. **A step that happens beats a step that does not.** Never propose a dose the person is unlikely to complete when they engage (execution floor, ENG-SSS).
2. **Count success, never failure.** No UI element, message or metric shown to the user may highlight a missed step. Misses are information for the model, not feedback for the user.
3. **Receptivity decides whether and when; barriers decide how much.** Do not prompt at unreceptive moments; do not respond to a hard day with a better-timed big request.
4. **No artificial urgency, no attention capture.** No "streak at risk", no countdowns, no guilt framing, no dark patterns. Engagement is monitored as a guardrail, never optimised as an objective.
5. **The user owns the goal.** Goals, the focal behaviour, anchors and quiet hours are set by the user and never redefined by the engine. Inferred vulnerability may only *lower* demands.
6. **Every proposal is explainable.** "Why this?" is always one tap away and answered in plain language.
7. **No data source is mandatory.** The app is fully functional without wearable, calendar or daily check-in. Each additional source makes it better, and the app says honestly how much.
8. **Private by design.** Inference runs on the device. Raw sensor data and calendar content never leave it.
9. **Every deployment is an experiment.** Decisions are randomised within safe bounds and logged with their probabilities, so effects can be estimated causally (micro-randomised trial logic).

## 4. Target Users and Personas

**Target group (MVP).** Adults (18+) without acute medical conditions who want to become or stay more physically active, own a smartphone (iOS ≥ 17 or Android ≥ 10 [OPEN: confirm minimum OS versions, see §14]) and are willing to receive at most a few suggestions per day. Excluded in the MVP: minors, pregnancy-specific programmes, clinical populations and rehabilitation (see A4).

| Persona | Situation | Sensing profile | What they need from the app |
|---|---|---|---|
| **Ben, 38, project lead** | Packed calendar, Apple Watch, no patience for questionnaires | P2 *Sensor* | Suggestions that fit into real gaps; zero typing; respects meetings |
| **Clara, 52, teacher** | No wearable, no work calendar on her phone, likes a short daily chat | P1 *Coach* | A 30-second morning check-in and a realistic plan for the day |
| **Rita, 45, restarting** | Used to run, stopped after an injury and a stressful year, low confidence | P0 → P1 | Tiny, safe first steps; visible progress; no pressure |
| **Malik, 29, data enthusiast** | Wearable, calendar and check-ins | P3 *Full* | Transparency about what the model believes and why |

## 5. Goals, Non-Goals and Success Metrics

### 5.1 Goals (MVP)

- **G1.** Increase weekly walking time and the number of days with at least one health action, compared with each user's baseline.
- **G2.** Produce success experiences: a high share of engaged proposals are completed.
- **G3.** Build habit: walking becomes increasingly spontaneous, and prompts fade.
- **G4.** Keep the burden low: few prompts, short check-ins, no attention capture.
- **G5.** Generate causally analysable data for a later micro-randomised trial (MRT).

### 5.2 Non-goals (MVP)

- Diagnosis, treatment or monitoring of any disease (see A4, intended purpose).
- Social network features, leaderboards, competitive challenges.
- Monetisation features (ads are excluded permanently; health data is never used for advertising).
- Multiple simultaneous focal behaviours (one focal behaviour at a time).
- Chat-based free-form coaching with a language model (Phase 2, see §9).
- Apple Watch / Wear OS companion apps (Phase 3).

### 5.3 Success metrics

| Type | Metric | Target (pilot, 12 weeks) | Notes |
|---|---|---|---|
| **North star** | Active days per week: days with ≥ 1 executed health step (verified or confirmed) | ≥ 4.0 by week 8 | Equals the visible "consistency" metric |
| Outcome | Change in weekly walking minutes, weeks 9–12 vs. baseline week | ≥ +60 min/week (median) | Simulation: 105–112 vs. 48 min/week |
| Success experiences | Executions / engaged proposals | ≥ 60% | Floor rule targets ≥ 50% per proposal |
| Success experiences | Executions / delivered prompts | ≥ 35% | Simulation: 37% |
| Habit | Share of walking bouts that occur spontaneously (no prompt within 2 h) | Rising trend from week 4 | Basis for fading |
| Burden | Prompts per day (mean) | ≤ 1.5; hard cap 3 | Configurable by user (lower only) |
| Burden | Median touchpoint duration | ≤ 45 s | P1/P3 only |
| Model quality | Calibration slope of predicted execution, days 15+ | 0.8–1.2 | Simulation: 0.85–1.07 |
| Model quality | Log-loss vs. population baseline, days 15+ | Better than baseline for ≥ 80% of users | Simulation: 0.635 vs. 0.660 |
| Guardrail | 30-day retention | Monitored, never optimised | Report only |
| Guardrail | Opt-out rate of notifications; "too many / too hard" feedback | ≤ 10% / ≤ 5% of users | Triggers review |
| Guardrail | Safety incidents (A4) | 0 serious | Any incident triggers review |

## 6. Scope and Release Phases

| Phase | Name | Content | Exit criterion |
|---|---|---|---|
| **0** | Engine core | Headless engine library (Kotlin Multiplatform), simulator port, parity tests against the Python reference simulator | Engine passes A1 §10 acceptance tests |
| **1** | MVP / pilot | iOS + Android apps; walking with 5-level ladder; slow breathing as fallback lateral class (feature flag); sensing profiles P0–P3; daily touchpoint; plan-ahead scheduling; explanations; accumulated gain, foundation, consistency weeks; safety screening; on-device storage; research logging; minimal backend | Closed pilot (n ≈ 30–50) runs 12 weeks without serious safety issues; metrics in §5.3 reported |
| **2** | Study and coaching | MRT study mode (consent, randomisation audit, export); structural barriers and tactics via optional deep check-ins (LLM-assisted, engine decides); affect ratings and motive-fit learning (feature flag); maintenance mode refinements | MRT protocol approved by ethics board; deep check-ins pass safety review |
| **3** | Scale and extend | Additional classes (movement breaks, strength, sleep wind-down, hydration); BLE ambient cue device; federated population prior; watch companions; second focal behaviour after consolidation | Defined per epic in A5 |

**Lateral steps.** In the MVP, lateral steps (e.g. slow breathing instead of a walk) are offered only when no walking level passes the execution floor, as recommended by the simulation. The behaviour is controlled by a remote-configurable flag with three modes: `off`, `below_floor` (default), `free`. **[OPEN-1]** The authors are reviewing this rule; the default may change before the pilot.

## 7. User Experience Overview

The detailed UX is specified in [A3](A3_ux_and_content.md). The core loop for the user is:

1. **Onboarding (≈ 5 min).** Choose the goal and focal behaviour (walking), set anchors ("after lunch", "after work"), quiet hours and a daily touchpoint time; complete a short safety screening (PAR-Q+ based); choose data sources with an honest explanation of what each adds; grant permissions.
2. **Daily touchpoint (optional, ≤ 45 s).** At the chosen time: close the loop on yesterday ("You walked 3 times yesterday"), ask 0–3 questions selected by value of information (e.g. "When do you have 15 free minutes today?"), and present today's plan with a pre-agreed smaller fallback step. For sensor-only users this is a silent briefing card.
3. **Proposals.** At decision points the app may send one short suggestion, e.g. *"There's a 20-minute gap after your 12:00 meeting. A 10-minute walk after lunch?"* Actions: **Done**, **Later**, **Not today**, and optionally **Why not?** (one tap: *no time / too tired / too stressed / weather / other people / don't feel like it*). Completion is verified by sensors where available, otherwise confirmed with one tap.
4. **Today and Progress screens.** The accumulated health gain (only grows), the "foundation" (habit strength), and consistency weeks (forgiving: a week counts with k of 7 active days). No misses are displayed.
5. **"Why this?"** Every proposal has a plain-language rationale, e.g. *"Short night and a full afternoon, so I suggested a short walk. Small steps still count fully for your habit."*
6. **Maintenance.** When walking has consolidated (A1 §8), prompts stop, and the user is invited to keep the routine on their own and optionally choose a new focus (Phase 3).

## 8. Functional Requirements

Priority: **M** = must (MVP), **S** = should (MVP if capacity allows), **L** = later phase.

### 8.1 Onboarding and goals

| ID | Requirement | Prio |
|---|---|---|
| FR-1 | The user selects a focal behaviour (MVP: walking) and a weekly goal (default: WHO-oriented, user-editable). The engine never changes the goal. | M |
| FR-2 | The user defines 1–3 anchors (daily routines the step follows, e.g. "after lunch") with approximate times. Anchors generate scheduled decision points. | M |
| FR-3 | The user sets quiet hours, the touchpoint time, and a maximum number of prompts per day (default 2, range 0–3). | M |
| FR-4 | Safety screening (PAR-Q+ based) runs before the first proposal; positive answers trigger the rules in A4 (SAF-1…SAF-4). | M |
| FR-5 | The user chooses data sources individually (activity data, sleep/HRV, calendar, daily check-in, location type, weather). Each choice shows its expected benefit in plain language. Any combination, including none, is valid. | M |
| FR-6 | Onboarding elicits structural barriers with a short checklist (e.g. long commute, unsafe area for walking, unsure how to start). They shift priors (A1 §4.4). | S |

### 8.2 Sensing and data adapters

| ID | Requirement | Prio |
|---|---|---|
| FR-10 | iOS: read steps, walking/running distance, workouts, sleep analysis, heart-rate variability (SDNN), resting heart rate via HealthKit, with background delivery where permitted. | M |
| FR-11 | Android: read steps, exercise sessions, sleep sessions, HRV (RMSSD) and resting heart rate via Health Connect, including background reads (`READ_HEALTH_DATA_IN_BACKGROUND`) where the feature is available, and history where granted. | M |
| FR-12 | Calendar: read free/busy windows and event metadata needed for features (start, end, all-day flag, attendee count, busy status) via EventKit (iOS) and CalendarContract (Android). Titles, descriptions and locations are never stored. | M |
| FR-13 | Phone context: foreground sessions, notification interactions, local time; on Android additionally screen state and Activity Recognition transitions (still → walking etc.). Platform asymmetries are allowed and modelled as different channel sets. | M |
| FR-14 | Weather: temperature, precipitation, heat warnings and daylight for a coarse location (city level, rounded), fetched via backend proxy. | M |
| FR-15 | All raw signals are converted to features on the device (A2 §4) and routed to exactly one role: *driver*, *evidence*, *context* or *outcome*. | M |
| FR-16 | Walking verification: a proposal counts as executed if a walking bout ≥ 0.8 × proposed duration occurs within 90 minutes of the proposal (sensor), or the user confirms it (self-report). Spontaneous bouts are recorded separately. | M |
| FR-17 | Missing data (e.g. wearable not worn, check-in skipped) is recorded explicitly and passed to the engine as missingness, not imputed. | M |

### 8.3 Engine (see A1 for the full specification)

| ID | Requirement | Prio |
|---|---|---|
| FR-20 | The engine maintains a Bayesian posterior over momentary barriers (K = 6), receptivity, learning states (habit, self-efficacy, meta-habit) and person parameters using a particle filter, fully on the device. | M |
| FR-21 | The engine treats the outcome of each proposal (ignored / engaged-missed / executed, plus "why not?") as evidence and attributes misses to competing barriers (explaining away). | M |
| FR-22 | At each decision point the engine evaluates the expected health gain (EHG) of all admissible actions on posterior samples and selects an action by clipped Thompson sampling; the null action (no prompt) is always a candidate. | M |
| FR-23 | Smallest Step Strategy: admissible doses must satisfy the chance-constrained execution floor and the progression cap (demonstrated level + 1). | M |
| FR-24 | Lateral steps follow the configured mode (`off` / `below_floor` / `free`) and the user's focus quota. | M |
| FR-25 | The engine values habit and self-efficacy gains, accounts for spontaneous behaviour (incremental gain) and fades prompts as the habit consolidates; consolidated behaviour switches to maintenance mode. | M |
| FR-26 | The engine starts from a population prior adjusted for onboarding covariates and personalises online; a nightly update refines person parameters. | M |
| FR-27 | Every decision is logged with context features, posterior summary, candidate set, selection probabilities, chosen action and outcome (A2 §3). | M |
| FR-28 | The engine produces a structured explanation for every decision (dominant barriers, feasibility, why this dose), rendered into text by the app. | M |
| FR-29 | The engine selects the touchpoint's questions greedily by value of information, up to the user's maximum (0–3). | M |
| FR-30 | Delivery channel and framing are chosen by a separate engagement bandit, conditional on the behavioural decision, from an approved template library only. | S |
| FR-31 | Motive-fit term (A1 §4.5), learned from affect ratings, behind a feature flag (default off). | L |
| FR-32 | Structural tactics and deep check-ins (A1 §6.4). | L |

### 8.4 Proposals, notifications and scheduling

| ID | Requirement | Prio |
|---|---|---|
| FR-40 | Decision points are generated from anchors (scheduled) and, where the platform allows, from context (a calendar gap opening, a sit-to-stand transition). Maximum 4 decision points per day in the MVP. | M |
| FR-41 | **Plan-ahead scheduling.** Because neither iOS nor Android guarantees background execution at exact times, the app computes decisions for upcoming decision windows whenever it runs (app open, touchpoint, background refresh, health-data delivery, silent push) and schedules local notifications. A later run re-plans and replaces pending notifications if new evidence changes the decision. Randomisation happens at planning time and is logged with the planned delivery time. | M |
| FR-42 | Notifications are standard priority (no time-sensitive/critical interruption levels), respect quiet hours and Focus/Do-Not-Disturb, and never stack: at most one pending proposal at a time. | M |
| FR-43 | A proposal offers the actions **Done**, **Later** (re-plans within the anchor window), **Not today**, and an optional one-tap **Why not?**. | M |
| FR-44 | Each proposal has a pre-agreed fallback step shown in the morning plan ("If the day gets tight: 2 minutes after lunch"). | M |
| FR-45 | Safety blocks (illness flag, heat warning, PAR-Q+ restriction, distress signals) suppress or restrict proposals per A4. | M |

### 8.5 Engagement and progress

| ID | Requirement | Prio |
|---|---|---|
| FR-50 | **Accumulated health gain** $G_t$: a monotonically non-decreasing score of realised benefit from executed and spontaneous steps (A1 §7). | M |
| FR-51 | **Foundation**: a visual representation of habit strength for the focal behaviour. | M |
| FR-52 | **Consistency weeks**: a day counts if any step is executed; a week counts with k of 7 days (default k = 4, user-adjustable 3–5). Earned rest days; automatic rest during safety blocks; a missed week starts a "fresh start", not a reset to zero. No "at risk" messages. | M |
| FR-53 | Weekly reflection card (optional): what went well, in success-only language. | S |
| FR-54 | Motive-sensitive configuration of progress displays (e.g. hide numbers) behind a feature flag. | L |
| FR-55 | BLE ambient cue device: pairing, light cue, button for plan acceptance / execution confirmation, fading in maintenance. | L |

### 8.6 Transparency and control

| ID | Requirement | Prio |
|---|---|---|
| FR-60 | "Why this?" explanation for every proposal and plan. | M |
| FR-61 | "What the app believes about today" view: the main barrier estimates as simple words and ranges (e.g. "Energy: probably lower than usual"), with the option to correct them (a correction is evidence). | S |
| FR-62 | Pause (1 day, 1 week, until resumed), change prompt cap, change anchors, change data sources at any time. | M |
| FR-63 | Data export (machine-readable) and complete deletion on device and backend. | M |

### 8.7 Research mode

| ID | Requirement | Prio |
|---|---|---|
| FR-70 | All decisions use clipped randomisation (A1 §6.3) in every build, so production data are always causally analysable. | M |
| FR-71 | With separate, explicit research consent, pseudonymised decision logs are uploaded to the study backend. Without it, nothing leaves the device except what A4 allows. | M |
| FR-72 | Study mode: protocol-defined contrasts with fixed randomisation probabilities, enrolment codes, study calendar and audit trail. | L |

## 9. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Safety | Hard safety filters precede all optimisation (A4). No proposal may exceed screening restrictions or be sent during safety blocks. |
| NFR-2 | Autonomy | No manipulative design: no urgency, guilt, loss framing or streak threats; inferred vulnerability only lowers demands. Copy must pass the rules in A3 §6. |
| NFR-3 | Privacy | Inference on device. Raw sensor data, calendar content and precise location never leave the device. Backend receives only what A4 §4 lists. |
| NFR-4 | Interpretability | Every decision is explainable from logged quantities (FR-28). |
| NFR-5 | Causal analysability | Selection probabilities logged for every decision; clipping enforced. |
| NFR-6 | Burden | ≤ 3 prompts/day hard cap; touchpoint median ≤ 45 s; onboarding ≤ 6 min median. |
| NFR-7 | Robustness | The engine degrades gracefully with missing channels, clock changes, time-zone travel, reinstalls and long pauses (re-entry at demonstrated level). Numerical failures fall back to a safe default policy (fixed small dose at anchors) and are reported. |
| NFR-8 | Performance | Fast loop ≤ 50 ms p95 on a 2021 mid-range device (reference implementation: 2–5 ms per decision with N = 1000 particles); nightly update ≤ 30 s, run while charging when possible; engine state ≤ 5 MB. |
| NFR-9 | Battery | ≤ 2% additional battery per day attributable to the app (median, measured with platform tools). No continuous GPS. |
| NFR-10 | Fairness | Personal baselines for physiological signals; equal functionality without calendar or wearable; personalisation speed monitored by sensing profile, age group and gender in the pilot. |
| NFR-11 | Reliability | Plan-ahead scheduling ensures that ≥ 95% of planned proposals are delivered within their window even if the app is not woken. Crash-free sessions ≥ 99.5%. |
| NFR-12 | Determinism | The engine is deterministic given a seed and the event log; any decision can be replayed bit-identically on the same platform and within tolerance across platforms. |
| NFR-13 | Offline | All core functions work offline; weather and config fall back to cached values. |
| NFR-14 | Security | Encrypted local storage (platform keystore-backed); TLS 1.3 to backend; no third-party analytics or advertising SDKs. |
| NFR-15 | Accessibility | WCAG 2.2 AA equivalent on mobile: dynamic type, screen readers (VoiceOver/TalkBack), contrast, no colour-only information. |
| NFR-16 | Localisation | German and English at launch; all copy externalised; units metric/imperial. |
| NFR-17 | Maintainability | Engine core platform-independent with ≥ 90% line coverage on math modules; action classes and copy are data, not code (A2 §5). |

## 10. System Architecture

### 10.1 Overview

```text
┌──────────────────────────────── Device ─────────────────────────────────┐
│  Native app shell (SwiftUI / Jetpack Compose)                            │
│   ├─ UI: onboarding, today, touchpoint, proposal, progress, settings     │
│   ├─ Scheduler: plan-ahead, local notifications, background tasks       │
│   └─ Platform adapters: HealthKit | Health Connect, EventKit |          │
│      CalendarContract, CoreMotion | Activity Recognition, notifications │
│                       │ features / events            ▲ decisions         │
│  ┌────────────────────▼──────────────────────────────┴───────────────┐  │
│  │ engine-core (Kotlin Multiplatform, pure, deterministic)          │  │
│  │  feature router → particle filter → EHG + Smallest Step →        │  │
│  │  clipped Thompson sampling → explanation; nightly update;        │  │
│  │  consolidation detector; value-of-information item selection     │  │
│  └────────────────────▲──────────────────────────────────────────────┘  │
│  Encrypted local store: event log, engine state, settings, config cache  │
└───────────────────────┼──────────────────────────────────────────────────┘
                        │ HTTPS (minimal, see A4 §4)
┌───────────────────────▼──────────────── Backend (EU) ───────────────────┐
│ Config service (action classes, templates, population prior, flags)     │
│ Weather proxy │ Push wake-ups (APNs/FCM) │ Research upload (consented)  │
│ Phase 3: federated aggregation of population prior                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Technology decision (ADR-001)

**Decision.** The engine is implemented once as a **Kotlin Multiplatform (KMP)** library (`engine-core`), compiled to JVM/Android and to a native iOS framework. The user interfaces and platform adapters are **native**: SwiftUI on iOS and Jetpack Compose on Android.

**Rationale.**

- The engine is the product's core intellectual property and contains numerically delicate code (particle filter, Laplace update, sampling). It must exist **exactly once**, be deterministic, and be testable against the Python reference simulator. KMP shares this logic without a JavaScript bridge or runtime.
- The app depends heavily on platform-specific capabilities with different semantics (HealthKit vs. Health Connect, background execution, notifications, EventKit vs. CalendarContract, BLE later). Native shells give full, first-class access and platform-appropriate UX.
- Compose Multiplatform for iOS has been declared stable (May 2025) and remains an option for sharing UI later; it is not required for the MVP.

**Alternatives considered.**

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| KMP core + native UIs | One engine, native integrations and UX | Two UI codebases | **Chosen** |
| KMP core + Compose Multiplatform UI | One codebase for UI too | Less native feel on iOS; platform integrations still native | Revisit in Phase 3 |
| Rust core (UniFFI) + native UIs | Performance, portability incl. web | Smaller ecosystem for statistics; extra FFI layer | Fallback if KMP numerics underperform |
| Flutter / React Native | Single codebase | Engine in Dart/JS or via native modules; background and health integrations through plugins of variable quality | Rejected |

**Libraries (guidance, not mandate).** SQLDelight for the encrypted event store (SQLCipher or platform encryption), kotlinx.serialization, kotlinx-datetime, a small in-house linear-algebra module (K ≤ 6, P ≈ 150 – no heavy dependency needed), Ktor client. Backend: Kotlin (Ktor) or any stack the team prefers, containerised, EU region.

### 10.3 Execution model on the device

- **Fast loop** (per decision point, A1 §5): triggered by the scheduler in plan-ahead mode.
- **Nightly loop** (A1 §5.4): run via BGProcessingTask (iOS) / WorkManager with charging constraint (Android); if missed, run on next app open.
- **Platform realities.** iOS background tasks and HealthKit background delivery are opportunistic and not time-guaranteed (step-count observers, for example, deliver at most hourly). Android requires a separate permission for Health Connect background reads, and exact alarms are restricted. The design therefore never depends on waking at an exact time: plans are computed ahead, notifications are scheduled locally, and evidence that arrives late is integrated by fixed-lag smoothing (A1 §5.3). Silent pushes from the backend at decision windows are a best-effort accelerator, not a dependency.

### 10.4 Reference implementation

The Python simulator in `../thesis/simulation/bue_sim.py` is the **reference implementation** and **test oracle** for the engine (note: it uses K = 4 barriers and walking + breathing only). The KMP port must reproduce its policy behaviour on the reference population within the tolerances given in A1 §10 before any app work depends on the engine.

## 11. Analytics and Evaluation

- **On-device metrics** for the user (accumulated gain, consistency) are computed from the event log.
- **Product metrics** (§5.3) are computed only from users who consented to research upload, or from aggregated, privacy-preserving counters (A4 §4).
- **Pilot (end of Phase 1).** 12-week single-arm pilot with consenting users, primary metrics as in §5.3, plus qualitative interviews on perceived burden and autonomy.
- **MRT (Phase 2).** 12-week micro-randomised trial with six contrasts (prompt vs. none; scaled vs. default dose; downward vs. lateral; touchpoint item sets; cue-device prompts; motive-matched vs. neutral framing), causal excursion effects moderated by the inferred barrier state. Requires ethics approval (A4).

## 12. Dependencies

| Dependency | Needed for | Risk |
|---|---|---|
| Apple HealthKit entitlement, App Store review | iOS health data | Review of health claims and privacy texts |
| Google Health Connect permissions declaration | Android health data | Play Console review; background-read feature availability varies |
| Weather API (EU-hosted or proxied) | Environment barrier, heat safety | Licence and cost |
| APNs / FCM | Silent wake-ups (optional) | Best effort only |
| Ethics board | Pilot and MRT | Timeline |
| Scientific owner (authors) | Parameter priors, copy review, safety rules | Availability |

## 13. Risks and Mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Background execution limits on iOS/Android prevent timely decisions | Missed or late proposals | Plan-ahead scheduling (FR-41); late-evidence smoothing; measure delivery reliability (NFR-11) |
| R2 | Model misspecification in real users (simulation used the engine's own model family) | Poor dose choices | Conservative floor; calibration monitoring; fallback policy; pilot with interim review |
| R3 | Uncertainty underestimated (simulated 80% interval coverage 58–78%) | Over-confident proposals | Chance constraint with ε_p = 0.2; widen innovations if coverage monitor fails |
| R4 | Sparse feedback in P0 users | Slow personalisation | Strong population prior; encourage one time-window question (recovers ~96% of full-sensing benefit in simulation) |
| R5 | Users perceive small steps as "too easy" or patronising | Disengagement | Explanations; progression cap allows steady re-escalation; user can raise the floor of the ladder |
| R6 | Verification errors (phone not carried, wearable off) | Wrong outcome evidence | Verification model with sensitivity/specificity; one-tap confirmation; missingness modelled |
| R7 | Regulatory reclassification as medical device | Delay, cost | Strict wellness intended purpose and claims review (A4) |
| R8 | Lateral-step rule changes after review | Rework | Feature flag with three modes (FR-24) |
| R9 | Agentic team diverges from the specification | Silent loss of mechanism | Parity tests against simulator; property tests for propositions; human review gates (A5 §2) |

## 14. Open Questions

| ID | Question | Owner | Needed by |
|---|---|---|---|
| OPEN-1 | Final rule for lateral steps (`below_floor` vs. `off` vs. `free`) | Authors | Pilot start |
| OPEN-2 | Minimum OS versions (proposal: iOS 17, Android 10 / API 29 with Health Connect) | Tech lead | M1 |
| OPEN-3 | Product name and brand | Authors | Store submission |
| OPEN-4 | Weather data provider | Tech lead | M2 |
| OPEN-5 | Pilot setting and ethics board (university affiliation) | Authors | M3 |
| OPEN-6 | Default k for consistency weeks (proposal: 4 of 7) | Authors | M2 |
| OPEN-7 | Whether the pilot includes breathing at all (depends on OPEN-1) | Authors | Pilot start |
| OPEN-8 | Language-model provider and hosting for Phase 2 deep check-ins (EU data residency) | Tech lead | Phase 2 |

## 15. Glossary

| Term | Meaning |
|---|---|
| Anchor | An existing daily routine after which a step is proposed ("after lunch") |
| Barrier | A latent, time-varying obstacle to acting (fatigue, load, time, environment, social, motivation) |
| Decision point | A moment at which the engine decides whether and what to propose |
| Demonstrated level | Highest ladder level executed recently; the progression cap is one level above it |
| Dose / ladder | Size of a step (e.g. 2, 5, 10, 20, 30 minutes walking) and the ordered list of sizes |
| EHG | Expected health gain: $P \cdot \tilde B - \rho\ell - \kappa$ (A1 §3) |
| Execution floor | Minimum probability that an engaged proposal is executed, required with high posterior probability |
| Feasibility Φ | Probability that a sufficient time window exists |
| Focal behaviour | The behaviour the user has chosen to build (MVP: walking) |
| Lateral step | A step from another domain (e.g. breathing) instead of the focal behaviour |
| Meta-habit | The routine of doing *something* for one's health every day |
| MRT | Micro-randomised trial |
| Receptivity ρ | Probability that a prompt is noticed and engaged with |
| Sensing profile | P0 app only, P1 coach (touchpoint), P2 sensor, P3 full |
| Touchpoint | Short daily exchange: close the loop, listen, advise, adjust |
