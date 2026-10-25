# 6 Discussion and Outlook

This thesis set out to address a specific weakness of digital health interventions. Most systems treat the person as a stationary target, and so they ignore that the capacity to receive and act on support changes from day to day and within a day. This final chapter summarises what has been achieved (Section 6.1) and discusses what the results imply for theory and design (Section 6.2). It then examines where the work is limited (Section 6.3) and which ethical questions it raises (Section 6.4). Finally, it considers where the engine could be used beyond physical activity (Section 6.5) and how it should be developed further (Section 6.6). Section 6.7 concludes.

## 6.1 Summary of Findings

The thesis developed the Behaviour Understanding Engine around a single decision criterion, the Expected Health Gain: the expected benefit of an action multiplied by the probability that it is actually performed. The four research questions of Section 1.3.3 have been answered as follows.

**RQ1 — Formal framework.** Chapter 3 turned the compact criterion into a fully specified objective (Equations 3.10 and 3.17).

- The probability factor is decomposed into three parts: *attentional receptivity*, the chance that a prompt is noticed; *structural feasibility*, the chance that a sufficient time window exists; and *volitional execution*. Volitional execution is suppressed by latent barriers whose effect grows with the dose requested.
- The benefit factor combines three components: an immediate, concave dose–response value; a dose-independent habit increment; and a difficulty-dependent self-efficacy gain.
- Three analytical results follow. The optimal dose satisfies an elasticity condition (Proposition 3.1). It is non-increasing in every barrier (Proposition 3.2). And receptivity governs *whether and when* to intervene, while barriers govern *how much* to ask for (Proposition 3.3).

**RQ2 — Bayesian barrier model.** Chapters 3 and 4 specified a dynamic latent-state model.

- Its six barriers instantiate the fluctuating facets of COM-B. Each barrier is anchored to evidence channels and has a distinct dose signature.
- Calendars, wearables, smartphone context and a coach-like daily touchpoint enter the model as drivers or as evidence. The engine's own proposals enter as well: executed and missed actions are informative observations, apportioned among competing explanations according to an analytical explaining-away gradient (Equation 4.12).
- Inference uses a particle filter with per-particle parameters, a nightly Laplace update and federated hierarchical priors. Benchmarks showed that this runs in milliseconds per decision, fast enough for on-device operation.

**RQ3 — Smallest Step Strategy.** The engine scales interventions down by a closed-form rule. The required reduction in difficulty equals the execution deficit on the log-odds scale divided by the person's current marginal sensitivity to difficulty (Equation 4.21). Within the admissible range, the engine chooses the dose that maximises the Expected Health Gain. Scaling up again follows from the same model as habit and self-efficacy grow (Corollary 4.1), bounded by demonstrated performance (Equation 4.27). Support is withdrawn once a consolidation criterion indicates that the behaviour has become self-sustaining (Section 4.8.4).

**RQ4 — Performance.** In a simulation study with 200 synthetic persons per condition (Chapter 5), the engine more than doubled the realised health benefit of a fixed daily prompt. It exceeded a twice-daily fixed schedule by 32% and a state-of-the-art contextual bandit without latent structure by 76%, and it reached 92–97% of an oracle with perfect knowledge. Its proposed doses tracked the *true* barrier load, which it never observed directly. Its predictions were calibrated, and its barrier beliefs were moderately calibrated. Two findings went beyond confirming the design:

- *Knowledge of opportunity, not physiology, carried most of the value of sensing.* A single touchpoint question about free time recovered 96% of the benefit of full sensing.
- *Unrestricted lateral steps into other health domains reduced long-run benefit*, because they displaced the repetitions on which habit formation depends. A restricted rule — lateral steps only below the floor of the focal ladder — removed most of this cost.

## 6.2 Theoretical Implications

### 6.2.1 Receptivity Is Two Questions, Not One

The literature has used "receptivity" for both the readiness to *attend* to support and the readiness to *act* on it (Section 2.7). This thesis separated the two formally and showed that they play different roles. Under the factorisation of Equation (3.1), attentional receptivity scales the expected gain of every proposal equally. It therefore determines whether intervening is worthwhile, but not what to propose (Proposition 3.3). The simulation gave this result practical weight. A baseline with *perfect* knowledge of attentional receptivity, but with fixed content, was outperformed even by a fixed small dose without any timing intelligence. Its prompts were seen but rarely acted upon: 12% execution.

The implication for JITAI research is that optimising *when* to deliver support is insufficient as long as *what* is delivered ignores the person's current capacity. Receptivity models (Künzler et al., 2019; Mishra et al., 2021) answer one half of the question. Barrier models answer the other. The engine shows how the two combine in a single objective.

### 6.2.2 COM-B as a Computable, Dynamic Model

COM-B is usually applied as a diagnostic framework at design time. Its own authors present it as a system of interacting components rather than as a quantitative model (Michie et al., 2011; West & Michie, 2020). This thesis offers one way to make it computable. The fluctuating facets of capability, opportunity and motivation become latent states with dynamics, evidence channels and dose-specific effects on execution. The formalisation yielded three insights that a static application of COM-B does not provide:

- **Identifiability.** Barriers can be distinguished from one another only if they differ in their evidence profiles, their dose signatures or their time scales (Section 3.4.8). The barrier with the weakest anchor in the simulation, motivation, was indeed the least well calibrated.
- **Hard versus soft opportunity.** Hard opportunity — whether a window exists — and soft opportunity — whether time pressure lets a person use it — must be modelled separately. Otherwise the model draws wrong inferences from missed actions.
- **Barrier interactions with dose.** It is the *interaction* of barriers with the size of the requested behaviour, not barriers as such, that makes smaller steps effective (Proposition 3.2). This turns the practical wisdom of graded tasks and Tiny Habits into a consequence of the model's structure.

These insights are general. They apply to any attempt to operationalise behaviour-change theory in an adaptive system, whether or not it adopts the specific engine developed here. They also respond directly to the call for dynamic, computational behaviour models in digital interventions (Riley et al., 2011; Hekler et al., 2016).

### 6.2.3 Opportunity Information Deserves More Attention than Physiology

Much of the digital-phenotyping literature concentrates on physiological and behavioural markers of internal states such as stress, fatigue and mood. In the simulation, information about the person's *opportunity* — when they have time, and how much — accounted for almost the entire value of sensing. Wearable physiology without calendar information added little to app-only operation.

The size of this effect depends on the simulated relative strength of barriers and must not be generalised uncritically. The direction of the result is nevertheless plausible and practically important. Opportunity is the barrier that most directly constrains which behaviours are *possible*. Unlike physiological signals, it is available prospectively — from a calendar or from a single question in the morning. If confirmed empirically, this would suggest that JITAI research should invest at least as much in modelling people's time structure as in inferring their internal states. It would also make effective adaptive interventions accessible to people without wearables.

### 6.2.4 The Long Run Must Be Valued Explicitly

The most instructive result of the simulation was the failure of unrestricted lateral steps. A lateral step that is optimal in the moment — easier, immediately valuable, even barrier-reducing — can be suboptimal over weeks, because it forgoes a repetition of the focal behaviour and slows habit formation. Even an oracle with perfect knowledge, using the one-step objective, made this error. The cause is therefore the objective, not the inference.

This connects to a known tension in micro-randomised trial methodology. Interventions are optimised for *proximal* outcomes, while what matters is the *distal* outcome (Nahum-Shani et al., 2018). Proximal effects that diminish over weeks (Klasnja et al., 2019) are one manifestation of this tension. The lateral-step result is another. The thesis's response has three parts:

- represent the long-run value of habit and self-efficacy explicitly in the one-step objective (Equation 3.17);
- calibrate these values against a model of the long run, which the simulator provides (Section 5.6.6);
- restrict actions whose long-run costs are known to be underestimated, such as lateral steps during habit formation.

Section 6.6 discusses how genuinely non-myopic planning could replace parts of this approach.

### 6.2.5 Interventions as Experiments

The engine treats each proposal both as an intervention and as an experiment. A missed two-minute walk is informative in a way that a missed thirty-minute walk is not. The variation of doses across good and bad days is what makes person-specific barrier sensitivities learnable (Section 4.5.2). This dual role dissolves the conventional separation between delivering an intervention and studying it. An engine that randomises with logged probabilities is continuously running a micro-randomised trial on itself (Section 3.7.5). Its deployment can therefore generate evidence on its own components at a scale that dedicated trials rarely reach.

### 6.2.6 Which Step Feels Rewarding

The barrier model answers why a step may not happen. Motive research adds a second question that the Expected Health Gain must eventually answer: which step is likely to feel rewarding to this person, and therefore to be repeated without prompting? Representing implicit motives and motive–incentive fit (Section 3.4.11) connects the engine to a tradition in motivation psychology that explains long-term persistence through affect rather than intention (Gröpel et al., 2016; Wegner & Brinkmann, 2023). The engine's contribution here is methodological. It turns motive–incentive fit, for which intervention studies are still lacking (Brummer et al., 2024), into a personalisation hypothesis that is tested per person and estimable across persons in a micro-randomised trial.

## 6.3 Limitations

The contributions of this thesis must be read in light of the following limitations.

**No empirical data.** All quantitative results come from simulation. The simulator implements the engine's own model, so the engine operated in a well-specified world. Structural deviations — a different link function, barriers outside the ontology, non-linear evidence relations — were not tested. The absolute effect sizes in Chapter 5 should not be read as predictions of real-world effects. The micro-randomised trial of Section 5.7 is the necessary next step.

**Literature-derived parameters.** The population priors and the simulated population were derived from published findings and plausible ranges (Table 4.1), not estimated from data. Several of them have no direct empirical counterpart in the literature: the barrier sensitivities, the barrier-reduction efficacies and the crowding-out factors.

**Simplified simulator.** The simulation used four of six barriers, two behavioural classes and no preparatory actions or delivery bandit. It did not model disengagement from the app. Attrition is the dominant failure mode of real interventions (Section 2.5.2), and policies that prompt more often could suffer more from it.

**One-step objective.** The engine is a contextual-bandit policy with value shaping (assumption A4). Section 5.6.5 showed that this can be wrong in systematic ways. Calibration and restrictions mitigate the problem but do not solve it in general.

**Binary execution and a single focal behaviour.** Partial execution is collapsed into ladder levels, and the treatment of several simultaneous goals is limited to the focal-class construct and the focus constraint.

**Self-report.** The touchpoint, which proved valuable, relies on honest and attentive answers. Social desirability, response fatigue and the question–behaviour effect (Wood et al., 2016) can bias both the inference and the evaluation.

**Terminology.** The "Bayesian barrier model" is defined in this thesis (Section 2.10.4) rather than taken from an established literature. Comparisons with other work must therefore rest on the model's components rather than on its name.

## 6.4 Ethical Considerations

An engine that infers when a person is tired, stressed or short of time, and that uses this knowledge to change their behaviour, carries responsibilities that go beyond those of a reminder app. Section 3.7 built several safeguards into the architecture. Five ethical questions remain open for discussion.

**Influence and autonomy.** The engine is persuasive technology in the precise sense that it is designed to change behaviour. The line between support and manipulation is drawn in the architecture by three commitments. The user's goals are elicited and never inferred. Inferred vulnerability may only lower demands, never raise persuasive pressure. And every proposal can be explained. These commitments are consistent with the prohibition of exploitative AI practices in the EU AI Act (Regulation (EU) 2024/1689) and with the autonomy-supportive stance of Self-Determination Theory (Ryan & Deci, 2000). Whether users *experience* the engine as supportive rather than controlling is, however, an empirical question that the evaluation should measure, for example with perceived autonomy support.

**Dependency.** A system that is good at prompting can create reliance on prompts. The engine is designed to fade (Section 4.8.4), and the simulation showed that it does so naturally as spontaneous behaviour grows. Commercial incentives often push in the opposite direction, because engagement metrics reward continued use. The Expected Health Gain criterion aligns the engine's objective with health rather than with use. An organisation that deploys it must accept that success means that the user needs the product less.

**Engagement without exploitation.** The engagement mechanics of commercial applications — variable rewards, streak anxiety, artificial urgency — are effective at capturing attention, and they are poorly aligned with health. Section 3.8 replaced them with elements that count success rather than failure: a non-decreasing accumulated health gain, consistency streaks in which any step counts, and an optional ambient cue device that signals at the periphery of attention. Whether these elements sustain engagement *and* avoid frustration is an empirical question. The trial design of Section 5.7.4 makes it testable.

**Responsibility for harm.** Small steps are low-risk, but the engine also proposes progressively larger doses. The safety layer relies on onboarding screening and on detecting acute illness from wearable signals. Both can fail. For clinical populations, responsibility must be shared with clinicians, and regulatory classification as a medical device may apply (Regulation (EU) 2017/745).

**Privacy and data asymmetry.** The engine builds an intimate model of a person: when they sleep poorly, when they are stressed, when their days are full. On-device inference, federated learning and the channel-agnostic design limit what leaves the device (Section 3.7.3). The finding that a short daily conversation can substitute for most passive sensing strengthens the privacy case. Users who prefer not to be observed lose little by choosing to be asked instead.

**Equity.** Adaptive systems tend to serve best those whose lives resemble their training data. The engine's dependence on opportunity information is a double-edged sword. People with irregular work, care obligations or no digital calendar are poorly served by calendar-based inference, yet they are often the people with the greatest health needs. The time-window question of the touchpoint offers a route around this problem. Its effectiveness for these groups must be tested explicitly, not assumed.

## 6.5 Transfer to Other Domains

The engine's core logic is not specific to physical activity. It consists of three parts: latent barriers inferred from multi-source evidence; actions scaled along ladders by their expected gain; and outcomes treated as evidence. Any domain in which a person repeatedly faces a choice to perform a beneficial behaviour, and in which the feasibility of that behaviour fluctuates, is a candidate. Table 6.1 summarises the most promising transfers.

**Table 6.1.** Transfer of the Behaviour Understanding Engine to other domains.

| Domain | Focal behaviour | Dominant barriers | Ladder (smallest → full step) | Specific considerations |
|---|---|---|---|---|
| Mental health — behavioural activation | Valued or pleasant activities | Low mood, fatigue, avoidance | 2-min pleasant activity → planned social activity | Graded task assignment is the core of behavioural activation (Dimidjian et al., 2011); the engine automates its calibration. Clinical oversight required; safety escalation essential (Section 3.7.1) |
| Medication adherence | Taking medication as prescribed | Forgetting, routine disruption, side effects, travel | The dose cannot be scaled; scaling applies to *support*: reminder → preparatory action (pill organiser, travel kit) → pharmacist contact | Adherence to long-term therapies is low and multi-causal (World Health Organization, 2003); the barrier model distinguishes forgetting from intentional non-adherence |
| Chronic disease self-management | Glucose monitoring, foot checks, rehabilitation exercises | Fatigue, pain, time, low self-efficacy | 1 exercise → full rehab session | Graded activity is established in rehabilitation; safety screening and clinician-set ceilings |
| Smoking cessation and relapse prevention | Coping response in high-risk moments | Stress, craving, social cues | Brief breathing or urge-surfing → full coping plan | States of vulnerability are central (Battalio et al., 2021); the engine's lateral steps are *the* intervention here |
| Nutrition | Healthier meal choices, added vegetables | Structural: taste, cost, household routines; momentary: time, fatigue, decision load | One added portion → planned healthy meal | Structural barriers and tactics dominate; conversational barrier identification and tactic selection (Yang et al., 2024) combine naturally with the engine's timing and dose decisions (Sections 3.4.10, 3.5.7) |
| Sleep | Wind-down routine, consistent bedtime | Evening workload, screen use, social obligations | 10-min screen-off → full wind-down | Outcomes measurable by wearables; the timing of the touchpoint shifts to the evening |
| Workplace well-being | Micro-breaks, movement, recovery | Meeting density, deadlines | 1-min stretch → 15-min walk | Calendar data central; employer access to data must be excluded by design |
| Learning and skill acquisition | Spaced practice | Time, fatigue, motivation | 1 flashcard → full session | Benefit function from retention models instead of dose–response |
| Sustainable and financial behaviour | Active commuting, saving, energy use | Weather, time, cost, habit | One trip by bike → weekly routine; small automatic transfer → budget review | Benefit defined by environmental or financial value; same habit dynamics |

Two adaptations recur across these domains. First, the **benefit function** must be domain-specific: a dose–response curve for health behaviours, a retention model for learning, an environmental or financial value elsewhere. The architecture accommodates this without change, because benefit enters only through $\bar B$. Second, in some domains the behaviour itself cannot be scaled — a prescribed medication dose is fixed. In these cases, the ladder is built from the *support* rather than from the behaviour. The steps range from a simple reminder to preparatory restructuring of the environment, and finally to human contact. The Smallest Step Strategy then selects the least intensive support that still makes the behaviour likely to happen. This inversion, from "how small a behaviour" to "how much help", generalises the strategy to a wider class of problems.

## 6.6 Extensions

The following extensions follow directly from the limitations and findings of this thesis. They are ordered by their expected contribution.

**1. A conversational touchpoint.** Agentic coaching systems already demonstrate conversational barrier identification and tactic delivery grounded in COM-B and the BCT Taxonomy (Yang et al., 2024). The simulation identified the daily touchpoint, and especially its time-window question, as one of the most valuable components. A natural extension is a conversational interface in which the person describes their day in their own words ("long day of meetings, but I'm free after four"). A language model would translate this description into the structured observations of Section 4.3: item ratings, time windows and barrier attributions. The engine would remain the decision core. The language model would serve only as interface and would neither choose actions nor give health advice beyond the action library. This division preserves the interpretability, safety constraints and causal analysability of the engine. It also makes the coach analogy of Section 3.2.4 literal. The risks — misinterpretation, invented content, inappropriate responses to distress — require dedicated evaluation.

**2. Non-myopic planning.** The lateral-step result shows the limits of one-step value shaping. Because the engine possesses a full generative model, model-based reinforcement learning is a direct option: policies can be optimised by planning in the simulator over the joint dynamics of barriers, habit and self-efficacy. Approximate dynamic programming or Monte Carlo tree search over a short horizon, combined with the one-step policy as a default, would let the engine evaluate, for example, how much a lateral step today costs in habit next month. The particle posterior provides the belief state that such planning requires.

**3. Robustness to misspecification.** The engine should be tested against simulators that deviate structurally from its own model. Examples are alternative link functions, unmodelled barriers, non-stationary parameters and engagement decay. It should also be equipped with model criticism: posterior predictive checks on its own outcome stream, and automatic inflation of volatility when calibration deteriorates. The under-coverage of barrier intervals in Chapter 5 suggests that the latter is a cheap and effective first step.

**4. Learning transfer between behaviours.** Whether lateral steps strengthen or crowd out the focal behaviour — the transfer coefficient $\zeta_m$ and the licensing factor $\varpi^{\rightarrow}$ — is the open empirical question of Section 3.3.7. Contrast 3 of the proposed trial estimates it. If transfer exists, the meta-habit becomes a lever for multi-behaviour change, and the focus constraint can be relaxed in a principled way.

**5. Better opportunity models.** Given the dominant role of opportunity information, the inference of free time deserves dedicated modelling. This could include learning a person's typical free windows from their phone use and activity patterns, modelling calendar reliability, and integrating commuting and travel. Each improvement here benefits every user, with or without a wearable.

**6. Hybrid human–engine coaching.** The engine's posterior identifies who is struggling, why, and with what certainty. In programmes that include human coaches, this information can be used to prioritise human contact, for example as the top rung of the support ladder. It allocates scarce human attention to the moments and persons where it adds most.

**7. Continuous outcomes and multiple goals.** Replacing binary execution with completion fractions, and the single focal class with a portfolio of goals with explicit trade-offs, would bring the model closer to how people actually pursue health.

**8. Motive-sensitive personalisation.** The motive profile of Section 3.4.11 opens several research questions. Does motive-matched framing increase engagement and execution? Do affiliation-motivated users benefit from process-focused, numberless configurations? Does the incongruence cost under load predict which steps survive difficult days? The automated coding of picture-story responses also offers a low-burden route to eliciting implicit motives at scale. Its use in a health application requires validation and transparent consent.

**9. Learning across deployments.** Each deployment produces micro-randomised data. These data can inform the population priors of subsequent deployments, through meta-analytic hierarchical models and off-policy evaluation, so that the engine improves not only per person but across studies and populations.

## 6.7 Conclusion

Digital health interventions have long been designed as if people were the same every day. This thesis started from the observation that they are not: the capacity to receive and act on support varies with sleep, stress, schedules and mood, and the barriers that block a healthy behaviour on a given day are mostly invisible. The Behaviour Understanding Engine makes these barriers the central object of modelling. It *senses today's barriers* by fusing calendars, wearables, a brief daily conversation and the fate of its own proposals in a Bayesian model grounded in COM-B. It *finds the smallest step that still happens* by maximising the Expected Health Gain — benefit times the probability of action — and by scaling its proposals down when the day is hard and up as capacity grows. And it *learns the person until change sticks*: each outcome refines its model, the habit it builds gradually makes its prompts unnecessary, and it fades out as the behaviour sustains itself.

In simulation, this design more than doubled the realised health benefit of conventional fixed prompting and came close to the performance of an oracle with perfect knowledge. The simulation also revealed where the design was wrong: unrestricted switching to other health domains undermines the habit that the engine exists to build. It further showed what matters most: knowing when a person has time is worth more than knowing how they slept. Both lessons emerged because the engine was built as a formal, testable model rather than a collection of heuristics. That property is also what makes the next step possible: a micro-randomised trial in which the engine, by design, generates the evidence needed to confirm, correct or refute the claims of this thesis with real people.
