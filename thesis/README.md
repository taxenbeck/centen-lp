# Thesis: A Receptivity-Driven Behaviour Understanding Engine for Personalised Health Promotion

**Language:** English · **Format:** Markdown + LaTeX (`$…$`, `$$…$$`) · **Target length:** ~40 pages (~16,000–18,000 words)

## File map

| File | Content | Status |
|---|---|---|
| `00_front_matter.md` | Title, abstract, notation | Final abstract |
| `01_introduction.md` | Chapter 1 – Introduction | Full text |
| `02_background_literature.md` | Chapter 2 – Theoretical background & literature review | Full text |
| `03_architecture.md` | Chapter 3 – Architecture & EHG framework | Full text |
| `04_algorithms_state_update.md` | Chapter 4 – Bayesian barrier model, state updates, Smallest Step Strategy | Full text |
| `05_evaluation_simulation.md` | Chapter 5 – Evaluation & simulation scenarios | Full text with simulation results |
| `06_discussion_outlook.md` | Chapter 6 – Discussion & outlook | Full text |
| `references.md` | Reference list (APA 7) | Covers all chapters |
| `simulation/` | Simulation code for Chapter 5 | `bench_fast_loop.py` (§4.9.3), `bue_sim.py` (simulator, engine, baselines), `analyse.py` (tables, figures), `results_summary.md` |
| `figures/` | Figures 3.1–3.2 (PDF, from Mermaid) and 5.1–5.5 (PNG) | – |
| `build/` | PDF build pipeline (pandoc + XeLaTeX), see `build/README.md` | Output: `../thesis.pdf` |

## Chapter structure

1. **Introduction**
   1.1 Problem Statement and Relevance of Digital Behaviour Change Interventions
   1.2 The Fundamental Weakness of Existing mHealth Systems: Ignoring Receptivity
   1.3 Objective and Core Scientific Hypothesis
   1.4 Contributions
   1.5 Structure of the Thesis
2. **Theoretical Background and Literature Review**
   2.1 Foundations of Health Behaviour Change
   2.2 The COM-B Model and the Behaviour Change Wheel
   2.3 The Behaviour Change Technique Taxonomy and Mechanisms of Action
   2.4 Minimal Behaviours: Fogg's Behaviour Model, Shaping and Implementation Intentions
   2.5 Digital Behaviour Change Interventions and the Engagement Problem
   2.6 Just-in-Time Adaptive Interventions
   2.7 Receptivity, Interruptibility and Opportune Moments
   2.8 Micro-Randomised Trials and Causal Excursion Effects
   2.9 Sequential Decision-Making: Contextual Bandits and Reinforcement Learning in mHealth
   2.10 Bayesian Models of Latent Barriers and Dynamic States
   2.11 Passive Sensing as Evidence: Wearables, Calendars and Behavioural Traces
   2.12 Synthesis and Research Gap
3. **Architecture and Development of the Behaviour Understanding Engine**
   3.1 Design Requirements
   3.2 System Overview: The Sense–Infer–Decide–Act–Learn Loop
   3.3 The Expected Health Gain Framework
   3.4 The Human Model: Traits, States and a COM-B Barrier Ontology
   3.5 The Action Space: A BCT-Annotated, Graded Intervention Library
   3.6 Data Sources and Observation Channels
   3.7 Safety, Privacy and Ethical Constraints by Design
   3.8 Engagement without Attention Capture
4. **Algorithmic Implementation and State Updating**
   4.1 The Bayesian Barrier Model: Generative Structure
   4.2 Prior Specification and Hierarchical Population Pooling
   4.3 Evidence Models for Calendar, Physiological and Behavioural Data
   4.4 Posterior Inference and Temporal Filtering
   4.5 Learning the Execution Probability from Executed and Missed Actions
   4.6 The Smallest Step Strategy
   4.7 Exploration under Uncertainty: Thompson Sampling over EHG
   4.8 Progression, Habit Consolidation and Dose Re-escalation
   4.9 Complete Algorithm and Computational Complexity
5. **Evaluation and Simulation Scenarios**
   5.1 Evaluation Strategy
   5.2 A Generative Simulation Environment with Synthetic Personas
   5.3 Baseline Policies
   5.4 Outcome Metrics
   5.5 Scenarios
   5.6 Results
   5.7 Design of an Empirical Micro-Randomised Validation Trial
   5.8 Threats to Validity
6. **Discussion and Outlook**
   6.1 Summary of Findings
   6.2 Theoretical Implications
   6.3 Limitations
   6.4 Ethical Considerations
   6.5 Transfer to Other Domains
   6.6 Extensions
   6.7 Conclusion
