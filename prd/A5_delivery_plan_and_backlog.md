# Appendix A5: Delivery Plan, Agent-Team Setup and Backlog

Part of the [BUE PRD](PRD.md). This appendix tells an agentic development team how to organise the work, where humans must approve, and what to build in which order. Durations are indicative for a team of AI coding agents with part-time human leads.

---

## 1. Milestones

| Milestone | Weeks (indicative) | Content | Exit criterion / gate |
|---|---|---|---|
| **M0 Foundations** | 0–2 | Repo, CI, ADR-001 confirmed, config schema, event schema, coding standards, simulator reference runs archived | Gate G1 (tech lead approves ADRs and schemas) |
| **M1 Engine core** | 2–6 | `engine-core` + `engine-sim`; all A1 §10 tests | Gate G2 (scientific owner signs off parity report) – **Phase 0 exit** |
| **M2 App skeletons** | 5–10 | Both shells: onboarding, adapters, event store, plan-ahead scheduler, engine integration, Today and proposal flows | Internal build: end-to-end decision on device with real sensors |
| **M3 Product completeness** | 10–13 | Touchpoint, engagement elements, explanations, safety rules, backend MVP, research logging | Gate G3 (content/copy approval), Gate G4 (privacy/DPIA, store texts) |
| **M4 Hardening** | 13–15 | Performance, battery, accessibility, privacy traffic test, 2-week internal dogfooding | All NFR checks green; no P1 bugs |
| **M5 Pilot** | 16–28 | TestFlight / Play closed testing, 12-week pilot with consent, weekly monitoring | Gate G5 (release approval incl. ethics) – **Phase 1 exit** |

## 2. Agent-Team Setup

### 2.1 Roles

| Role | Type | Responsibilities | Primary appendices |
|---|---|---|---|
| **Orchestrator** | Agent | Breaks epics into tasks, assigns, tracks dependencies, integrates, maintains the question log and status report | PRD, A5 |
| **Engine agent** | Agent | `engine-core`: model, filter, decision, explanations, verification | A1, A2 §6 |
| **Simulation & QA agent** | Agent | `engine-sim`, parity and property tests, test data generators, regression suites | A1 §10 |
| **iOS agent** | Agent | SwiftUI app, HealthKit/EventKit/CoreMotion adapters, scheduling, notifications | A2 §7, A3 |
| **Android agent** | Agent | Compose app, Health Connect/Calendar/Activity Recognition adapters, scheduling, notifications | A2 §7, A3 |
| **Backend agent** | Agent | Config, weather proxy, push, research upload, deletion | A2 §8, A4 §4 |
| **Content & UX agent** | Agent | Templates (DE/EN), copy linter, accessibility checks | A3 |
| **Reviewer agent** | Agent (independent instance) | Reviews every PR against requirement IDs, tests and the binding principles; never reviews its own work | all |
| **Tech lead** | Human | Architecture decisions, gate G1, merges to release branches | – |
| **Scientific owner** (authors) | Human | Engine parameters, deviations from A1, gate G2 and G3 | A1, A3 |
| **Compliance reviewer** | Human | Gate G4 and G5, store submissions, DPIA | A4 |

### 2.2 Working agreements

1. **Spec is the contract.** Agents implement what this PRD says. If something is ambiguous, contradictory or infeasible, the agent writes an entry in `docs/questions.md` (question, options, recommended option, impact) and continues with the recommended option behind a flag or stub. It never changes the specification silently.
2. **Protected parameters.** Values and rules in A1 (priors, $p_{\min}$, $\varepsilon_p$, clipping bounds, lateral mode, floor and progression rules) and safety rules in A4 may only be changed with approval of the scientific owner (A1) or compliance reviewer (A4), recorded in an ADR.
3. **Traceability.** Every PR references requirement IDs (e.g. `FR-41`, `ENG-2`) and the tests that cover them. A requirements-coverage report is generated in CI.
4. **Tests first for the engine.** Property and parity tests (A1 §10) are written before or with the implementation; the engine may not be integrated into the apps before gate G2.
5. **No new dependencies** (libraries, SDKs, services) without an ADR. Analytics and advertising SDKs are forbidden.
6. **Small PRs.** ≤ 400 changed lines excluding generated code and tests; one concern per PR.
7. **Determinism.** No wall-clock or global randomness inside `engine-core`; time and PRNG are injected.
8. **Platform parity.** iOS and Android stories are implemented against the same acceptance criteria; documented platform asymmetries (A2 §7) are the only allowed differences.
9. **Status.** The orchestrator publishes a weekly status (done, in progress, blocked, open questions, risks) in `docs/status.md`.

### 2.3 Definition of Done

A story is done when:

- code is merged to `main` after reviewer-agent approval and green CI;
- acceptance criteria are covered by automated tests (unit, property, UI or integration as appropriate);
- requirement IDs are referenced and the coverage report is updated;
- user-facing text is externalised, passes the copy linter and exists in DE and EN;
- accessibility checks pass for new UI;
- no new warnings from static analysis; no secrets in code;
- documentation (README of the module, ADR if applicable) is updated.

## 3. Backlog

Priority: **M** must for pilot, **S** should, **L** later phase. Stories use the format *As a … I want … so that …* followed by acceptance criteria (AC).

### E1 Foundations (M0)

| ID | Story | AC | Prio |
|---|---|---|---|
| E1-1 | As the team we want a monorepo with KMP modules, iOS and Android apps and backend so that all code builds in one CI | CI builds all targets on every PR; lint and unit tests run; artefacts for internal distribution | M |
| E1-2 | As the team we want the event schema (A2 §3) and config schema (A2 §5) as versioned, validated definitions | JSON-schema / Kotlin serialisation with round-trip tests; invalid config rejected with message | M |
| E1-3 | As scientific owner I want the Python reference results archived as fixtures | `engine-sim/fixtures/` contains reference summary metrics for all A1 §10.1 checks | M |
| E1-4 | As tech lead I want ADR-001 (stack) and ADR-002 (plan-ahead scheduling) written | ADRs merged; gate G1 recorded | M |

### E2 Engine core (M1)

| ID | Story | AC | Prio |
|---|---|---|---|
| E2-1 | Implement the person model: barrier dynamics, receptivity, learning states (A1 §4) | Unit tests per equation; K configurable (4 or 6) | M |
| E2-2 | Implement the particle filter with Liu–West and systematic resampling (A1 §5.1) | ESS logic tested; deterministic with seed; N configurable | M |
| E2-3 | Implement observation models incl. Student-t evidence, outcomes, verification, why-not attribution, missingness (A1 §5.2) | T-EA passes; T-MISS passes | M |
| E2-4 | Implement fixed-lag smoothing for late evidence (A1 §5.3) | Late outcome changes posterior at its timestamp; replay identical | M |
| E2-5 | Implement EHG, incremental gain and the candidate algorithm A1.1 | T-EHG, T-FLOOR, T-P1/P2/P3 pass | M |
| E2-6 | Implement clipped Thompson sampling and decision logging (A1 §6.3) | T-CLIP passes; logged q sums to 1 | M |
| E2-7 | Implement plan-ahead `planDay`/`replan` semantics (A1 §6.1) | Superseded decisions logged; no double delivery in a window | M |
| E2-8 | Implement VOI-based touchpoint item selection (A1 §6.4) | Free-time item always chosen for users without calendar in first 14 days; ≤ maxItems | M |
| E2-9 | Implement nightly update incl. Laplace step, baselines, $\nu_h$, monitors (A1 §5.4, §9) | Runs < 30 s on reference device; monitors emit events | M |
| E2-10 | Implement consolidation detector and maintenance mode (A1 §8) | Synthetic consolidated user switches to maintenance; CUSUM reactivates after lapse | M |
| E2-11 | Implement explanations (`Explanation`, reason codes) | Every decision has a reason code; snapshot tests | M |
| E2-12 | Implement walking-bout detector and verification (A2 §4) | Fixture-based tests incl. gaps, multiple bouts, missing minutes | M |
| E2-13 | Implement accumulated gain and progress read models (A1 §7, A3 §7) | $G_t$ non-decreasing in property test; consistency weeks rules incl. earned rest and fresh start | M |
| E2-14 | Fallback policy and numerical guards (A1 §9) | Fault-injection tests produce safe default decisions | M |
| E2-15 | Motive-fit term behind flag (A1 §4.5) | Flag off: bit-identical decisions to build without feature | L |

### E3 Simulator and parity (M1)

| ID | Story | AC | Prio |
|---|---|---|---|
| E3-1 | Port the generative model, personas and baselines of `bue_sim.py` | Population statistics of personas match Python within 2% | M |
| E3-2 | Parity runner for all A1 §10.1 checks with report | Markdown/HTML report; all checks within tolerance; gate G2 | M |
| E3-3 | Regression suite: nightly run of parity on `main` | Alert on any check outside tolerance | M |
| E3-4 | Extend simulator to K = 6 and walking-only portfolio for product defaults | Report for `lateral_mode` = off / below_floor / free (input for OPEN-1) | S |

### E4 Data layer (M2)

| ID | Story | AC | Prio |
|---|---|---|---|
| E4-1 | Encrypted SQLDelight event store shared by both apps | Key in Keychain/Keystore; corruption test; migration test | M |
| E4-2 | Evidence pipeline batching adapter events into `engine.ingest` | Ordering by `validFrom`; idempotent on duplicate events | M |
| E4-3 | Engine state persistence and restore after app kill/reinstall (from log replay) | Restore within 2 s; replay equals stored state | M |
| E4-4 | Raw-data retention job (35 days) | Old raw samples deleted; features kept | M |
| E4-5 | Export and delete all data | Export JSON per A2 entities; delete wipes DB, keys, backend (E12-5) | M |

### E5/E6 Platform adapters (M2)

| ID | Story | AC | Prio |
|---|---|---|---|
| E5-1 | iOS HealthKit adapter (steps, sleep, HRV, RHR) with background delivery | Features produced per A2 §4; handles denied permissions → `ChannelMissing` | M |
| E5-2 | iOS CoreMotion adapter (pedometer, activity) | Verification without wearable works in field test | M |
| E5-3 | iOS EventKit adapter (free/busy only) | No titles/locations persisted (test asserts) | M |
| E6-1 | Android Health Connect adapter incl. background-read feature check and history permission | Works with and without background feature; `ChannelMissing` on denial | M |
| E6-2 | Android Activity Recognition adapter | Transition events produce contextual DP candidates | M |
| E6-3 | Android CalendarContract adapter (free/busy only) | Same privacy assertions as E5-3 | M |
| E6-4 | Android screen-state and (optional) usage-access features | Only with explicit consent; off by default | S |

### E7 Scheduling and notifications (M2)

| ID | Story | AC | Prio |
|---|---|---|---|
| E7-1 | As a user I receive proposals inside my anchor windows even if the app was not opened | Plan-ahead schedules local notifications; ≥ 95% delivered within window in a 7-day device test (NFR-11) | M |
| E7-2 | Replan on new evidence replaces pending notifications | Never two pending proposals; superseded decisions logged | M |
| E7-3 | Notification actions Done / Later / Not today | Actions logged as events; Later replans once within window | M |
| E7-4 | Quiet hours, prompt cap, pause and safety blocks enforced at scheduling | Fuzz test: no notification violates rules | M |
| E7-5 | Silent push wake-ups at decision windows (best effort) | Backend sends wake-ups; app replans; absence does not break E7-1 | S |
| E7-6 | Nightly update scheduling (BGProcessingTask / WorkManager with charging) | Runs nightly in ≥ 80% of nights in device test; otherwise on next open | M |

### E8 Onboarding and safety (M2–M3)

| ID | Story | AC | Prio |
|---|---|---|---|
| E8-1 | Onboarding flow per A3 §2 (goal, anchors, rhythm, data choices, check-in setup) | Median completion ≤ 6 min in usability test (n ≥ 5) | M |
| E8-2 | Safety screening and outcomes (SAF-1…SAF-4) | All branches tested; restricted users never receive level > 3 | M |
| E8-3 | Contextual permission requests, one at a time, with benefit statements (A3 §5) | Denial leads to working app with that channel missing | M |
| E8-4 | Structural barrier checklist (FR-6) | Selected items produce prior shifts (A1 §4.4) | S |
| E8-5 | Illness flag, heat rules, distress handling (SAF-5…SAF-8) | Scenario tests; distress shows resources and reduces demands | M |

### E9 Touchpoint (M3)

| ID | Story | AC | Prio |
|---|---|---|---|
| E9-1 | Daily touchpoint flow (close loop, listen, advise, adjust) | Median ≤ 45 s; success-only loop closure | M |
| E9-2 | Silent briefing card for sensor-only users | No questions shown when maxItems = 0 | M |
| E9-3 | Rest day and plan change in touchpoint | Rest day never displayed as miss; counts as earned rest if available | M |

### E10 Today, progress and engagement (M3)

| ID | Story | AC | Prio |
|---|---|---|---|
| E10-1 | Today screen with plan, fallback, gain, foundation, week dots | Snapshot tests DE/EN; a11y labels | M |
| E10-2 | Progress screen (gain curve, foundation stages, consistency weeks) | Values match engine read models; no decreasing element | M |
| E10-3 | Celebrations for executed steps (in-app only) | One subtle animation; respects reduced motion | S |
| E10-4 | Weekly reflection card | Success-only content; can be disabled | S |

### E11 Explanations and transparency (M3)

| ID | Story | AC | Prio |
|---|---|---|---|
| E11-1 | "Why this?" sheet from reason codes and barrier words | Every reason code has DE/EN templates; copy linter passes | M |
| E11-2 | "Today's picture" with correction | A correction is ingested as evidence and changes the next decision in a test scenario | S |

### E12 Backend (M3)

| ID | Story | AC | Prio |
|---|---|---|---|
| E12-1 | Signed config bundle service with ETag and rollback | App rejects unsigned/invalid bundle; keeps last valid | M |
| E12-2 | Weather proxy with grid-cell caching | No precise coordinates in requests or logs | M |
| E12-3 | Push wake-up service | Content-free pushes; tokens deletable | S |
| E12-4 | Research upload endpoint with pseudonyms | Only consented data; schema-validated; EU storage | M |
| E12-5 | Deletion endpoint | All data for token/pseudonym deleted within 30 days, confirmation returned | M |

### E13 Research logging (M3)

| ID | Story | AC | Prio |
|---|---|---|---|
| E13-1 | Research consent flow and toggle | Separate explicit consent; withdrawal stops upload immediately | M |
| E13-2 | Upload batching with retry and backoff | No data loss across app kills; Wi-Fi preference setting | M |
| E13-3 | Analysis export for causal excursion effects | Script reproduces selection probabilities and outcomes per decision | S |

### E14 Quality (M4)

| ID | Story | AC | Prio |
|---|---|---|---|
| E14-1 | Performance and battery benchmarks on reference devices | NFR-8 and NFR-9 met; report in CI artefacts | M |
| E14-2 | Privacy traffic test (A4 §4) | CI proxy test fails on any unexpected endpoint/field | M |
| E14-3 | Accessibility audit (VoiceOver/TalkBack, dynamic type) | No blocker findings | M |
| E14-4 | Time-zone, DST and clock-change tests | Decisions and day boundaries correct across DST and travel | M |
| E14-5 | Dogfooding (2 weeks, internal) | Bug triage; burden and copy feedback incorporated | M |

### E15 Release and pilot (M5)

| ID | Story | AC | Prio |
|---|---|---|---|
| E15-1 | Store listings, privacy labels, HealthKit/Health Connect declarations | Gate G4; approved for TestFlight and Play closed testing | M |
| E15-2 | Pilot enrolment and study information in app | Ethics approval reference displayed; consent logged | M |
| E15-3 | Pilot monitoring dashboard (research data only) | Weekly metrics of PRD §5.3; safety reports listed | M |

### Later phases (overview)

| Epic | Phase | Content |
|---|---|---|
| E20 MRT study mode | 2 | Protocol contrasts, enrolment codes, audit trail (FR-72) |
| E21 Deep check-ins and tactics | 2 | LLM-assisted conversation, tactic library, safety filter, AI disclosure (A1 §6.4, A4 AI-2) |
| E22 Affect ratings and motive fit | 2 | Post-execution affect rating, motive learning, motive-sensitive configuration (FR-31, FR-54) |
| E30 More action classes | 3 | Movement breaks, strength, sleep wind-down, hydration; second focal behaviour after consolidation |
| E31 BLE cue device | 3 | Hardware spec, pairing, cue/confirm protocol, fading (FR-55) |
| E32 Federated population prior | 3 | DP statistics, aggregation service, prior updates |
| E33 Watch companions | 3 | watchOS / Wear OS proposal surfaces and verification |

## 4. First Tasks for the Orchestrator

1. Read the PRD and all appendices; produce `docs/questions.md` with every ambiguity found (expected: OPEN-1 … OPEN-8 plus implementation questions).
2. Create the repository skeleton (E1-1) and the schemas (E1-2).
3. Ask the Simulation & QA agent to run the Python reference simulator and archive fixtures (E1-3).
4. Start E2 and E3 in parallel; do not start E5–E11 UI integration before gate G2, but adapters (E5/E6) and the data layer (E4) may start in M1 with engine stubs.
