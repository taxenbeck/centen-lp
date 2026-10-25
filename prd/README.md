# PRD – Behaviour Understanding Engine App (iOS & Android)

Product requirements for implementing the Behaviour Understanding Engine as a mobile app, written for an agentic development team.

| File | Content |
|---|---|
| [PRD.md](PRD.md) | Main document: vision, principles, users, goals and metrics, scope and phases, functional and non-functional requirements, architecture and tech decision, risks, open questions |
| [A1_engine_specification.md](A1_engine_specification.md) | Engine maths and algorithms, defaults, acceptance and property tests |
| [A2_data_model_and_interfaces.md](A2_data_model_and_interfaces.md) | Entities, event log, feature catalogue, action-class schema, engine API, platform adapters, backend API |
| [A3_ux_and_content.md](A3_ux_and_content.md) | Screens, touchpoint, notifications, copy rules, engagement elements |
| [A4_safety_privacy_compliance.md](A4_safety_privacy_compliance.md) | Intended purpose, safety rules, GDPR, data flows, store and AI-Act constraints |
| [A5_delivery_plan_and_backlog.md](A5_delivery_plan_and_backlog.md) | Milestones, agent roles, working agreements, definition of done, epics and stories |

**Sources.** Reference thesis `../thesis/`, reference simulator `../thesis/simulation/bue_sim.py`, paper `../paper/`.

**Key decisions.** Kotlin Multiplatform engine core with native SwiftUI/Compose apps; MVP focal behaviour walking; all sensing profiles P0–P3; engine fully on device; lateral-step rule as feature flag (default `below_floor`, under review).

Version 1.0 draft, 20 October 2026 – Tobias Axenbeck, Wencke Nottmeyer.
