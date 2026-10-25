# Appendix A4: Safety, Privacy and Compliance

Part of the [BUE PRD](PRD.md). This appendix states product requirements derived from safety considerations and the regulatory frame as understood by the authors. **It is not legal advice.** Before the pilot and before any public release, the intended purpose, data protection documents and store submissions must be reviewed by qualified legal and regulatory counsel. Items marked **[REVIEW]** require that review.

---

## 1. Intended Purpose and Claims

| ID | Requirement |
|---|---|
| SAF-0 | **Intended purpose (draft) [REVIEW]:** "The app supports healthy adults in building everyday physical activity habits by suggesting small, personalised activity steps. It is not intended to diagnose, prevent, monitor, treat or alleviate any disease or injury." |
| SAF-0a | The app positions itself as a lifestyle and wellbeing product. Under the EU Medical Device Regulation (EU) 2017/745, software is a medical device only if the manufacturer intends it for a medical purpose (see MDCG 2019-11). Marketing texts, store listings, onboarding and notifications must therefore not make disease-related claims (e.g. "lowers blood pressure", "treats depression", "for diabetics"). |
| SAF-0b | Health benefits may be described in general, evidence-based terms ("regular walking is good for your health"), without individual risk statements. |
| SAF-0c | Use in clinical populations, rehabilitation or prescription contexts (e.g. a German DiGA) is out of scope and would require a conformity assessment as a medical device. |

## 2. Safety Rules

| ID | Rule |
|---|---|
| SAF-1 | **Eligibility:** 18+ (self-declared age band); otherwise onboarding ends with a friendly explanation. |
| SAF-2 | **Pre-activity screening** based on the PAR-Q+ general questions (heart condition, chest pain at rest or during activity, dizziness/loss of consciousness, other chronic condition, prescribed medication for a chronic condition, bone/joint problems worsened by activity, medical advice to only do supervised activity). Use of the official PAR-Q+ text requires checking its licence terms **[REVIEW]**. |
| SAF-3 | **Screening outcome:** all "no" → `CLEAR`. Any "yes" → the app recommends talking to a doctor before increasing activity and sets `RESTRICTED_LIGHT` (walking capped at level 3 = 10 min, normal pace wording only) until the user confirms medical clearance. Answers indicating acute symptoms (chest pain at rest, loss of consciousness) → `BLOCKED_SEEK_ADVICE`: no proposals; the app shows advice to seek medical assessment and offers to resume after confirmation. |
| SAF-4 | **Re-screening** every 6 months and whenever the user reports a new condition in settings. |
| SAF-5 | **Illness flag:** the user can mark "I'm unwell" (in the touchpoint or settings); proposals pause for the selected period (default 2 days); consistency gets automatic rest days. |
| SAF-6 | **Heat and weather:** heat warnings or extreme conditions from the weather service remove outdoor levels > 5 minutes and add a safety hint; severe warnings block outdoor proposals. |
| SAF-7 | **Symptoms during activity:** every proposal detail view contains a short line: "Stop and seek help if you feel chest pain, severe breathlessness or dizziness." |
| SAF-8 | **Distress signals:** if touchpoint answers indicate persistently very low mood/high stress (e.g. ≥ 5 of 7 days at the extreme) or the user selects "I'm not doing well", the app does not respond with micro-interventions; it acknowledges, reduces demands and shows localised support resources (e.g. crisis lines). The app does not diagnose. |
| SAF-9 | **Inferred vulnerability only lowers demands.** No model output may increase dose, frequency or persuasive intensity because a user appears vulnerable, tired or stressed. Enforced by test T-SAFE (A1 §10.2). |
| SAF-10 | **Hard caps:** ≤ 3 prompts/day; no prompts in quiet hours or sleep windows; no prompts while driving (Android activity "in vehicle"; iOS when known). |
| SAF-11 | **Incident handling:** users can report "This suggestion was not OK for me"; reports are reviewed within 5 working days during the pilot; serious incidents stop the pilot cohort until reviewed. |

## 3. Data Protection (GDPR)

| ID | Requirement |
|---|---|
| PRIV-1 | Health-related data (activity, sleep, HRV, check-in answers) are special-category data (Art. 9 GDPR). Processing on the device for the app's function and any upload require **explicit consent**, given separately for: (a) app use with selected data sources, (b) research upload (pilot/MRT), (c) optional telemetry. Each consent can be withdrawn at any time in settings. |
| PRIV-2 | **Privacy by design and default** (Art. 25): all optional sources default to off until the user chooses them; research and telemetry default to off. |
| PRIV-3 | A **data protection impact assessment** (Art. 35) is carried out before the pilot **[REVIEW]**. |
| PRIV-4 | **Data minimisation:** features instead of raw data (A2 DATA-2); calendar content never stored; location rounded to a ≈ 10 km grid for weather; no advertising IDs; no third-party analytics or advertising SDKs. |
| PRIV-5 | **Rights:** export (machine-readable, from the device), deletion (device + backend via `/v1/deletion`), correction (settings, belief correction FR-61). |
| PRIV-6 | **Hosting:** backend in the EU; processors under data processing agreements; push providers (APNs/FCM) receive only tokens and content-free wake-ups. |
| PRIV-7 | **Pseudonymisation of research data:** study pseudonym generated on device; mapping to identities (if any, e.g. for compensation) held separately by the study team. |
| PRIV-8 | **Retention:** research data per study protocol; telemetry counters 12 months; server logs 14 days. |

## 4. What Leaves the Device

| Data | When | Destination |
|---|---|---|
| App version, locale | Config fetch | Config service |
| Rounded grid cell | Weather fetch | Weather proxy |
| Push token, wake-up times (local), time zone | If silent wake-ups enabled | Push service |
| `DecisionMade` (posterior summary, candidates, probabilities; no raw features), outcomes, touchpoint answers, settings changes, safety events (type only) | Only with research consent | Research upload |
| Aggregated counters (crash-free sessions, delivery reliability, latency percentiles) | Only with telemetry consent | Telemetry |
| DP-noised sufficient statistics | Phase 3, separate consent | Federated aggregation |

Nothing else is transmitted. This table is a test artefact: a network-traffic test in CI asserts that no other endpoints or fields are used.

## 5. Platform Store Requirements

| Platform | Requirement **[REVIEW]** |
|---|---|
| Apple App Store | HealthKit data may not be used for advertising or data mining and may not be shared with third parties without consent; personal health information may not be stored in iCloud; health research requires informed consent and ethics board approval (App Review Guideline 5.1.3). Purpose strings for HealthKit, motion, calendar and notifications must be specific. |
| Google Play | Health Connect permissions declaration in the Play Console with justification per data type; health apps declaration; privacy policy link; prominent disclosure for sensitive permissions (e.g. usage access if used). |

## 6. AI-Specific Constraints

| ID | Requirement |
|---|---|
| AI-1 | The EU AI Act (Regulation (EU) 2024/1689) prohibits AI systems that use manipulative or deceptive techniques, or exploit vulnerabilities, in ways that materially distort behaviour and cause significant harm (Art. 5). The product's design rules (PRD §3, A3 §6, SAF-9) are the operational safeguard; the risk classification is documented **[REVIEW]**. |
| AI-2 | When a language model is used for deep check-ins (Phase 2), users are clearly informed that they interact with an AI system; the model never decides proposals, cannot change goals, and its outputs pass the copy rules and a safety filter (self-harm, medical advice). |
| AI-3 | Every engine decision is explainable (FR-28) and logged (FR-27); users can see why a suggestion was made. |
| AI-4 | Fairness monitoring by sensing profile, age band and gender in the pilot (NFR-10). |

## 7. Research Ethics

- Pilot (Phase 1) and MRT (Phase 2) require approval by an ethics committee **[OPEN-5]**, informed consent with study information inside the app, and the option to withdraw at any time without losing app functionality.
- Randomisation (clipped Thompson sampling, protocol contrasts) is described in the study information in plain language.
- Study data management follows the approved protocol; analysis code uses logged selection probabilities (causal excursion effects).
