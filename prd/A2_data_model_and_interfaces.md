# Appendix A2: Data Model and Interfaces

Part of the [BUE PRD](PRD.md). Defines the on-device data model, the event log, the feature catalogue, the action-class schema, the engine API, the platform adapters and the backend API. Field names are normative; types are given in Kotlin notation.

---

## 1. Principles

| ID | Requirement |
|---|---|
| DATA-1 | **Event-sourced.** The append-only event log is the single source of truth. Engine state, progress metrics and UI state are derived and can be rebuilt by replay. |
| DATA-2 | **Features, not raw data.** Adapters convert raw platform data to features immediately. Raw samples are kept at most 35 days (for baselines and late verification), then deleted. Calendar titles, descriptions, locations and attendee identities are never read into persistent storage. |
| DATA-3 | **Versioned.** Every event carries `schemaVersion`; every decision carries `engineVersion` and `configVersion`. |
| DATA-4 | **Time.** All timestamps are UTC instants plus the IANA time zone at the time of the event. Day boundaries follow the user's local day with a configurable day start (default 04:00). |
| DATA-5 | **Encryption.** The local database is encrypted with a key held in the iOS Keychain / Android Keystore. |

## 2. Core Entities

```kotlin
data class UserProfile(
    val userId: String,               // random UUID, generated on device
    val createdAt: Instant,
    val locale: String,               // "de-DE", "en-GB", …
    val ageBand: AgeBand,             // 18-29, 30-44, 45-59, 60+
    val activityLevelSelfReport: Int, // 1..5
    val structuralBarriers: Set<StructuralBarrierId>,
    val sensingChoices: SensingChoices,
    val consents: Consents
)

data class SensingChoices(
    val activity: Boolean, val sleepHrv: Boolean, val calendar: Boolean,
    val touchpoint: Boolean, val touchpointMaxItems: Int /*0..3*/,
    val locationType: Boolean, val weather: Boolean
)  // derived profile: P0 / P1 / P2 / P3 (for analytics only)

data class Goal(
    val focalClass: ClassId,          // MVP: "walk"
    val weeklyTargetMinutes: Int,     // user-owned
    val focusQuotaPerWeek: Int,       // default 4
    val createdAt: Instant
)

data class Anchor(
    val anchorId: String, val label: String,   // "after lunch"
    val typicalTime: LocalTime, val windowMinutes: Int /*default 60*/,
    val days: Set<DayOfWeek>
)

data class Settings(
    val quietHours: List<LocalTimeRange>, val touchpointTime: LocalTime?,
    val maxPromptsPerDay: Int /*0..3, default 2*/, val consistencyK: Int /*3..5, default 4*/,
    val pausedUntil: Instant?, val hideNumbers: Boolean
)

data class SafetyState(
    val screeningResult: ScreeningResult,  // CLEAR, RESTRICTED_LIGHT, BLOCKED_SEEK_ADVICE
    val illnessUntil: Instant?, val heatWarningUntil: Instant?,
    val distressFlag: DistressFlag?        // see A4
)
```

## 3. Event Log

Every event has the envelope:

```json
{
  "eventId": "uuid",
  "type": "ProposalDelivered",
  "ts": "2026-10-20T10:35:12Z",
  "tz": "Europe/Berlin",
  "schemaVersion": 1,
  "payload": { }
}
```

| Event type | Payload (main fields) | Producer |
|---|---|---|
| `FeatureObserved` | `featureId`, `value`, `validFrom`, `validTo`, `source`, `quality` | Adapter |
| `ChannelMissing` | `channel`, `period`, `reason` (not worn, permission revoked, no data) | Adapter |
| `DecisionPointCreated` | `dpId`, `anchorId?`, `trigger` (scheduled/contextual), `windowStart`, `windowEnd` | Scheduler |
| `DecisionMade` | `dpId`, `decisionId`, `candidates[]` with `q` (clipped) and `qRaw`, `chosen`, `plannedDeliveryAt`, `posteriorSummary`, `explanation`, `engineVersion`, `configVersion`, `rngPosition`, `mode` (plan/replan/live) | Engine |
| `DecisionSuperseded` | `decisionId`, `byDecisionId`, `reason` | Engine |
| `ProposalDelivered` | `decisionId`, `channel` (push/in-app/cue), `templateId`, `deliveredAt` | App |
| `ProposalEngaged` | `decisionId`, `how` (opened, action button, in-app view), `at` | App |
| `ProposalResponse` | `decisionId`, `response` (done/later/not_today), `at` | App |
| `WhyNotAnswered` | `decisionId`, `reason` (no_time/tired/stressed/weather/others/not_feel_like/skip) | App |
| `ExecutionVerified` | `decisionId?`, `classId`, `minutes`, `start`, `end`, `source` (sensor/confirmation), `confidence` | Verifier |
| `SpontaneousBout` | `classId`, `minutes`, `start`, `end`, `source` | Verifier |
| `TouchpointCompleted` | `items[]` (`itemId`, `answer`), `durationSec`, `skipped` | App |
| `AffectRated` | `executionRef`, `rating` (1–5) | App (Phase 2) |
| `SettingsChanged`, `GoalChanged`, `AnchorChanged` | diff | App |
| `SafetyEvent` | `kind` (screening, illness, heat, distress), `state`, `until` | App/Engine |
| `NightlyUpdateRun` | `durationMs`, `monitors` (calibration, ESS, coverage), `consolidation` | Engine |
| `EngineFallback` | `reason`, `stateHash` | Engine |

`posteriorSummary` contains per barrier mean and 10/90% quantiles, $\rho$ mean, $\Phi$ per candidate, $h, e, m$, ESS. It is what the research upload contains (no raw features).

## 4. Feature Catalogue (MVP)

| featureId | Source (iOS / Android) | Unit / transform | Role | Barrier / target |
|---|---|---|---|---|
| `sleep_duration_last_night` | HealthKit sleepAnalysis / Health Connect SleepSession | hours | Driver | fatigue |
| `hrv_nocturnal_z` | HK heartRateVariabilitySDNN / HC HeartRateVariabilityRmssd (night window) | robust z vs. 28-day median/MAD (log scale) | Evidence | fatigue (−), load (−) |
| `rhr_z` | HK restingHeartRate / HC RestingHeartRate | robust z | Evidence | fatigue (+) |
| `hrv_day_z` | as above, daytime samples if available | robust z | Evidence | load (−) |
| `meeting_density_today` | EventKit / CalendarContract busy events 08–19 h | share of busy time 0–1 | Driver | load, time |
| `free_windows` | calendar | list of (start, end) minus 5-min buffers | Context | Φ |
| `social_event_overlap` | calendar attendee count ≥ 2 overlapping DP window | 0/1 | Driver | social |
| `weather_precip_prob`, `heat_index`, `daylight` | backend weather proxy | – | Driver | environment; safety (heat) |
| `phone_interaction_recency` | app lifecycle (iOS); screen on/off (Android) | minutes | Context | receptivity |
| `app_switch_rate` | Android only (UsageStats with consent) [S] | per 10 min | Evidence | load (+) |
| `activity_transition` | Android Activity Recognition; iOS CMMotionActivity when app runs | categorical | Context | receptivity, contextual DP |
| `touch_energy`, `touch_stress`, `touch_timep`, `touch_motiv` | touchpoint | 1–5 → [0,1] | Evidence | fatigue, load, time, motivation |
| `touch_free_time_<period>` | touchpoint | none / ~10 / ~20+ min | Context | Φ |
| `walk_bouts` | HK stepCount + walkingSpeed / HC Steps, ExerciseSession; CMPedometer | bouts ≥ 2 min with cadence ≥ 60 steps/min | Outcome | execution, spontaneous |
| `location_type` | coarse: home/work/other via user-defined places (optional) [S] | categorical | Context | environment, receptivity |

**Walking bout detector.** Merge step samples into minute bins; a bout is ≥ 2 consecutive minutes with cadence ≥ 60 steps/min allowing gaps ≤ 1 min. Proposal verification: bout minutes ≥ 0.8 × proposed minutes starting within 90 min after delivery. The detector is shared code in `engine-core` (pure function on minute bins).

## 5. Action-Class Schema (configuration)

Action classes are data, versioned in the config service and cached on device.

```yaml
class: walk
version: 3
domain: physical_activity
role: focal_candidate            # focal_candidate | lateral | preparatory | informational
anchor_required: true
ladder:                          # dose vectors: duration, intensity, complexity, outdoor, visibility, equipment
  - {d: 1, minutes: 2,  q: [2, 1, 0, 1, 0, 0]}
  - {d: 2, minutes: 5,  q: [5, 1, 0, 1, 0, 0]}
  - {d: 3, minutes: 10, q: [10, 1, 0, 1, 0, 0]}
  - {d: 4, minutes: 20, q: [20, 1, 0, 1, 0, 0]}
  - {d: 5, minutes: 30, q: [30, 1, 0, 1, 0, 0]}
tau0: 5
benefit: {w: 1.0, lambda: 0.07}
bct: ["7.1", "8.7", "1.4", "8.3", "2.2"]
incentives: {achievement: 0.6, affiliation: 0.2, power: 0.2}
priors:
  delta: {logmean: -0.223, logsd: 0.25}
  gamma0: {fatigue: [0.5, 0.4], load: [0.4, 0.4], time: [0.3, 0.4], environment: [0.4, 0.4], social: [0.3, 0.4], motivation: [0.8, 0.4]}
  gamma1: {fatigue: [0.8, 0.4], load: [0.3, 0.4], time: [1.0, 0.4], environment: [0.5, 0.4], social: [0.3, 0.4], motivation: [0.2, 0.4]}
  eta: {load: {mean: 0.10, sd: 0.10}}
verification: {mode: sensor_or_confirmation, rule: "bout_minutes >= 0.8*minutes within 90 min"}
contraindications: [illness_flag, heat_warning, screening_blocked]
screening_caps: {RESTRICTED_LIGHT: 3}     # max ladder level
templates: [walk_after_anchor_v1, walk_window_v1, walk_small_step_v1]
```

`gamma0`/`gamma1` entries are `[median, log-sd]`. The `breathe` class (lateral, ladder 1/3/5/10 min, `tau0: 2`, BCT 11.2, 4.1, 8.1; reduces load) uses the same schema.

## 6. Engine API (`engine-core`)

```kotlin
interface BehaviourEngine {
    // lifecycle
    fun initialise(profile: UserProfile, goal: Goal, anchors: List<Anchor>,
                   config: EngineConfig, seed: Long): EngineState
    fun restore(state: ByteArray, config: EngineConfig): EngineState
    fun serialise(): ByteArray

    // evidence
    fun ingest(events: List<Event>)                 // features, outcomes, settings, safety
    // decisions
    fun planDay(now: Instant, dps: List<DecisionPoint>): List<Decision>
    fun replan(now: Instant): List<DecisionChange>   // returns superseded + new decisions
    fun decideNow(now: Instant, dp: DecisionPoint): Decision   // live contextual DP
    fun touchpointItems(now: Instant, maxItems: Int): List<TouchpointItem>
    // nightly
    fun nightly(now: Instant): NightlyReport
    // read models
    fun explain(decisionId: String): Explanation
    fun todaySummary(now: Instant): TodaySummary     // belief words + ranges for FR-61
    fun progress(now: Instant): Progress              // G_t, foundation stage, consistency weeks
}

data class Decision(
    val decisionId: String, val dpId: String,
    val action: Action,                     // NullAction(reason) | Proposal(classId, level, minutes)
    val plannedDeliveryAt: Instant?,
    val fallback: Proposal?,                // pre-agreed smaller step for the plan
    val selectionProbabilities: Map<ActionKey, Double>,
    val explanation: Explanation
)

data class Explanation(
    val dominantBarriers: List<BarrierWord>,   // e.g. FATIGUE_HIGHER, TIME_TIGHT
    val feasibleWindowMinutes: Int?,
    val reasonCode: ReasonCode,                // GOOD_DAY_STEP_UP, HARD_DAY_SMALL_STEP, NO_GOOD_MOMENT, SAFETY, PAUSED, MAINTENANCE …
    val doseRationale: DoseRationale           // floor-bound, progression-bound, optimum
)
```

The app turns `Explanation` into localised text via templates (A3 §6). The engine never produces free text.

## 7. Platform Adapters (app shell)

| Adapter | iOS | Android | Notes |
|---|---|---|---|
| Health | HealthKit: `HKObserverQuery` + `enableBackgroundDelivery` (best effort; step count at most hourly), anchored object queries | Health Connect client; background reads only if `FEATURE_READ_HEALTH_DATA_IN_BACKGROUND` available and permission granted; history permission for > 30 days | Fallback: read on app open and before planning |
| Motion | `CMPedometer` (history up to 7 days), `CMMotionActivityManager` | Activity Recognition Transition API | Verification without wearable |
| Calendar | EventKit (full read access) | `CalendarContract.Instances` with `READ_CALENDAR` | Only free/busy, times, all-day flag, attendee count |
| Scheduling | `UNUserNotificationCenter` local notifications; `BGAppRefreshTask` / `BGProcessingTask` | `AlarmManager.setWindow` (inexact) + `WorkManager`; no exact-alarm permission needed | Plan-ahead (PRD FR-41) |
| Push | APNs silent push (best effort) | FCM data message | Wake-up only, no content |
| Storage | SQLite (SQLDelight) + Keychain key | SQLite (SQLDelight) + Keystore key | Shared schema |
| BLE (Phase 3) | CoreBluetooth | Android BLE | Cue device protocol TBD |

Adapter contract: every adapter emits `FeatureObserved` / `ChannelMissing` events with `quality` and never calls the engine directly; the app's `EvidencePipeline` batches events and calls `engine.ingest`.

## 8. Backend API (MVP)

Base URL per environment; EU region; TLS 1.3; requests authenticated with an anonymous installation token (no account required in the MVP). **[OPEN]** Account/login for multi-device use is Phase 3.

| Endpoint | Method | Purpose | Data sent by device |
|---|---|---|---|
| `/v1/config` | GET | Action classes, templates, population prior, flags, minimum app version (signed bundle, ETag) | app version, locale |
| `/v1/weather` | GET | Forecast and warnings for a rounded location (≈ 10 km grid) | grid cell id |
| `/v1/push/register` | POST | Register APNs/FCM token for silent wake-ups at decision windows | token, wake-up times (local), time zone |
| `/v1/research/upload` | POST | Consented, pseudonymised decision logs (`DecisionMade` without raw features, outcomes, touchpoint answers) | study pseudonym, batch |
| `/v1/telemetry` | POST | Opt-in aggregated counters (crash-free, delivery reliability, latency) | counters only |
| `/v1/deletion` | POST | Delete all server-side data for the installation/pseudonym | token |
| `/v1/federated/stats` | POST | Phase 3: clipped, noised sufficient statistics | DP-noised statistics |

The config bundle is signed; the app verifies the signature before use and keeps the last valid bundle.

## 9. Repository Layout (proposal)

```text
bue/
  engine-core/          # KMP: model, filter, decision, verification, explanations
  engine-sim/           # KMP: simulator port, parity and property tests
  shared-data/          # KMP: SQLDelight schema, event log, repositories
  app-ios/              # SwiftUI app, HealthKit/EventKit adapters
  app-android/          # Compose app, Health Connect/Calendar adapters
  backend/              # config, weather proxy, push, research upload
  config/               # action classes, templates, priors (versioned YAML)
  docs/adr/             # architecture decision records
  docs/prd/             # this PRD
```
