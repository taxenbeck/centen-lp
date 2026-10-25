# 2 Theoretical Background and Literature Review

This chapter reviews the bodies of work on which the Behaviour Understanding Engine is built. It proceeds from general theories of why people do or do not perform health behaviours (Sections 2.1–2.4), through the specific challenges of delivering behaviour change digitally (Sections 2.5–2.7), to the experimental and algorithmic methods that make adaptive interventions learnable (Sections 2.8–2.10) and the sensing technologies that supply their evidence (Section 2.11). Section 2.12 synthesises the review and identifies the gap that the engine addresses. Throughout, the emphasis lies on what each strand contributes to three questions: *What determines whether a person performs a behaviour at a given moment? How can those determinants be observed or inferred? How should an intervention be chosen given that knowledge?*

## 2.1 Foundations of Health Behaviour Change

### 2.1.1 Social-cognitive and reasoned-action models

The dominant twentieth-century theories of health behaviour conceptualise behaviour as the outcome of deliberate decision-making. The **Theory of Planned Behaviour** (TPB; Ajzen, 1991) holds that behaviour is determined by intention, which in turn is determined by attitudes towards the behaviour, subjective norms and perceived behavioural control; perceived control is also assumed to affect behaviour directly to the extent that it reflects actual control. **Social Cognitive Theory** (Bandura, 1977, 1997) places *self-efficacy* — the belief in one's capability to execute a course of action — at the centre of behaviour change, and identifies mastery experiences, i.e. successful performance, as its most powerful source. Bandura's account is directly relevant to the present work: if successful execution increases self-efficacy and failed attempts decrease it, then the probability of future execution depends on the history of past outcomes, and the choice of what to ask a person to do today has consequences for what they will be able to do tomorrow.

The **Transtheoretical Model** (Prochaska & DiClemente, 1983) introduced the idea that people move through qualitatively distinct stages (precontemplation, contemplation, preparation, action, maintenance) and that interventions should be matched to stage. Although the stage construct has been widely criticised for its arbitrary boundaries and weak predictive validity, the underlying insight — that the *appropriate* intervention depends on the person's current state — anticipates the adaptive-intervention paradigm.

The **Health Action Process Approach** (HAPA; Schwarzer, 2008) addresses the intention–behaviour gap by distinguishing a *motivational phase*, in which intentions are formed, from a *volitional phase*, in which intentions must be translated into action and maintained. Volitional factors such as action planning, coping planning and maintenance self-efficacy are posited to bridge the gap. HAPA thereby shifts attention from the question of *whether* a person wants to change to the question of *what prevents* a motivated person from acting in a particular situation.

### 2.1.2 The intention–behaviour gap

The empirical motivation for this shift is robust. Intentions explain only a modest proportion of variance in subsequent behaviour, and experimentally induced changes in intention produce considerably smaller changes in behaviour (Sheeran, 2002). For physical activity specifically, Rhodes and de Bruijn (2013) estimated that nearly half of intenders fail to act. Sheeran and Webb (2016) organise the reasons into three problems of self-regulation: *getting started* (failing to notice opportunities, failing to seize them, second thoughts), *staying on track* (competing goals, depletion of self-regulatory resources, unfavourable contexts) and *getting finished*. Each of these failure modes is situational: it depends on what the person encounters at a particular moment. Interventions that operate only on intentions — by informing, persuading or motivating — therefore leave the larger part of the variance untouched.

### 2.1.3 Dual-process accounts and habit

Dual-process models distinguish reflective, deliberate processes from automatic, impulsive ones. In the context of health behaviour, the most consequential automatic process is **habit**, defined as a process by which a stimulus generates an impulse to act as a result of a learned stimulus–response association (Gardner, Lally, & Wardle, 2012). Habits are formed through context-dependent repetition: when a behaviour is repeatedly performed in a stable context, control over the behaviour gradually transfers from deliberate intention to the contextual cue (Wood & Neal, 2007). In a frequently cited field study, Lally et al. (2010) modelled the growth of self-reported automaticity as an asymptotic function of repetitions and found a median of 66 days to reach 95% of the asymptote, with a range from 18 to 254 days; importantly, missing a single opportunity did not materially affect the habit formation process.

Two implications follow for the design of the engine. First, the long-term value of an executed action is not exhausted by its immediate physiological effect; it also includes its contribution to automaticity, which lowers the future cost of the behaviour. Second, because occasional lapses do not reset habit growth, but extended interruptions do, a strategy that preserves *some* execution on difficult days — even at greatly reduced dose — has a structural advantage over a strategy that demands full execution and accepts frequent zero-days.

### 2.1.4 Self-regulatory capacity as a fluctuating resource

Several lines of research suggest that the capacity to exercise self-control fluctuates within persons. The strength model of self-control proposed that self-control draws on a limited resource that is depleted by use (Baumeister et al., 1998); however, a large preregistered multi-lab replication found an effect size close to zero (Hagger et al., 2016), and the resource interpretation is now contested. Independently of this debate, there is consistent evidence that executive functions — working memory, inhibitory control, task switching — underpin successful self-regulation and are impaired by acute stress, sleep deprivation and cognitive load (Hofmann et al., 2012). For the purposes of this thesis it is not necessary to adopt a particular mechanistic account. It suffices that the *probability* of executing an effortful behaviour varies with observable correlates of fatigue, stress and load — a proposition that is empirically testable and that the engine treats as a learnable relation rather than a fixed assumption.

### 2.1.5 Limitations of classical theories for dynamic interventions

Riley et al. (2011) argued that the health behaviour theories described above are "not up to the task" of guiding mobile interventions, because they were developed to explain between-person differences at a single time point, are largely static and linear, and do not specify the temporal dynamics through which their constructs change and influence behaviour. Mobile interventions, by contrast, require *within-person, dynamic* models that predict how a person's state evolves over hours and days and how it responds to intervention. Hekler et al. (2016) and Spruijt-Metz and Nilsen (2014) made similar arguments and called for computational models — including control-systems formulations — that can be fitted to intensive longitudinal data. The Behaviour Understanding Engine can be read as one answer to this call: it retains the constructs of established theory but embeds them in a dynamic, probabilistic model that is updated in real time. Pfeffer et al. (2023) give a recent overview of the models used to explain and change health behaviour and physical activity.

### 2.1.6 Implicit motives and motive–incentive fit

The theories above explain behaviour largely through *explicit*, consciously represented constructs such as intentions, attitudes and self-efficacy. Motivation psychology adds a second, partly independent system. *Implicit motives* are relatively stable, affectively based preferences for certain classes of incentives: achievement (mastering challenges and improving against a standard of excellence), affiliation or intimacy (establishing and maintaining warm relationships), and power (having impact on others). They are measured indirectly, typically with picture-story methods, and correlate only weakly with self-reported (explicit) motives (McClelland et al., 1989). Implicit motives energise behaviour through the anticipated and experienced *affect* that motive-relevant incentives produce. A person therefore keeps returning to activities that have repeatedly felt rewarding in the currency of their motive.

Research in sport and exercise psychology has applied this framework to physical activity (Wegner & Brinkmann, 2023). In three samples of athletes, the implicit achievement motive consistently predicted how often people engaged in sport, whereas the explicit achievement motive did not (Gröpel et al., 2016). The authors attribute this to the affective reward of challenge and skill growth. The central concept is **motive–incentive fit**. Activity is maintained when its context offers incentives that match the person's dominant motive: personal records and mastery feedback for the achievement-motivated, togetherness for the affiliation-motivated, influence and recognition for the power-motivated. Conversely, pursuing goals that do not fit one's implicit motives is assumed to demand additional self-control (Schüler et al., 2019). Recent work suggests that people with a strong affiliation motive regulate themselves differently from achievement- and power-motivated people. They appear to orient more towards the process and their well-being in the situation than towards goal attainment, and they may profit from social, shared forms of regulation (Marion-Jetten et al., 2025).

The evidence base is still narrow. A scoping review identified seven observational studies on implicit motives and physical activity, and no intervention study. The association was most consistent for the achievement motive and mixed for affiliation and power (Brummer et al., 2024). The self-regulation differences reported by Marion-Jetten et al. (2025) were small and cross-sectional. For the purposes of this thesis, motive–incentive fit is therefore a theoretically well-founded and testable *hypothesis* for personalisation, not an established mechanism. It adds a dimension to the questions of when and how much: *which kind* of step is likely to feel rewarding to a particular person. Section 3.4.11 shows how the engine can represent it.

The affective pathway also links to a broader finding: the affective response to exercise predicts future physical activity (Rhodes & Kates, 2015). Whether a step felt good is thus not only a matter of user experience but evidence about the person's future behaviour.

## 2.2 The COM-B Model and the Behaviour Change Wheel

### 2.2.1 Structure of COM-B

The **COM-B model** (Michie et al., 2011) was developed as part of a synthesis of nineteen frameworks of behaviour change and has become the most widely used integrative model in the field. It proposes that behaviour (B) is the outcome of an interacting system of three components:

- **Capability (C)** — the individual's psychological and physical capacity to engage in the activity, including the necessary knowledge, skills, strength and stamina. COM-B distinguishes *physical capability* from *psychological capability* (comprehension, reasoning, attention, memory).
- **Opportunity (O)** — all factors lying outside the individual that make the behaviour possible or prompt it. COM-B distinguishes *physical opportunity* (time, resources, locations, physical barriers) from *social opportunity* (cultural norms, social cues, interpersonal influences).
- **Motivation (M)** — the brain processes that energise and direct behaviour. COM-B distinguishes *reflective motivation* (evaluations, plans, intentions) from *automatic motivation* (emotions, impulses, habits).

In the model's graphical representation, capability and opportunity influence motivation as well as behaviour directly, and behaviour feeds back on all three components. West and Michie (2020) emphasise that the components should be understood as jointly necessary conditions at the moment of behaviour: for a behaviour to occur, the person must have the capability and opportunity to perform it and must be more motivated to perform it than any competing behaviour at that moment.

### 2.2.2 COM-B as a dynamic state model

Although COM-B is usually applied as a diagnostic tool at the design stage of an intervention, its components map naturally onto momentary states. Table 2.1 illustrates how each sub-component has both trait and state facets and identifies plausible sources of evidence about its state facet. This mapping provides the theoretical backbone of the barrier ontology developed in Section 3.4.

**Table 2.1.** COM-B sub-components with trait and state facets and candidate evidence sources.

| COM-B sub-component | Stable (trait) facet | Fluctuating (state) facet | Candidate evidence |
|---|---|---|---|
| Physical capability | Fitness, mobility, chronic conditions | Physical fatigue, acute illness, soreness | Sleep duration/efficiency, resting HR, HRV, prior-day load |
| Psychological capability | Knowledge, skills, executive function | Attention, cognitive load, acute stress | HRV, calendar density, phone-use patterns, EMA |
| Physical opportunity | Work schedule, access to facilities | Available time window, weather, location | Calendar free slots, location, weather API, travel |
| Social opportunity | Norms, social support | Presence of others, social obligations | Calendar event types, co-location, EMA |
| Reflective motivation | Values, goals, outcome expectations | Momentary goal priority, competing goals | Goal-check-ins, EMA, engagement history |
| Automatic motivation | Habit strength, trait affect | Mood, cravings, momentary fatigue-driven aversion | EMA, HRV, time of day, execution history |

The COM-B literature does not itself provide such a dynamic formalisation, nor does it specify how sub-components combine quantitatively. A pragmatic interpretation, adopted later in this thesis, is that each fluctuating facet can be represented as a latent barrier intensity in $[0,1]$ and that the components combine in a way that approximates a conjunctive ("weakest link") structure, which in a logistic model corresponds to additive contributions on the log-odds scale with barrier-specific weights.

### 2.2.3 The Behaviour Change Wheel

The **Behaviour Change Wheel** (BCW; Michie et al., 2011) embeds COM-B at its hub and surrounds it with nine *intervention functions* — education, persuasion, incentivisation, coercion, training, restriction, environmental restructuring, modelling and enablement — and seven *policy categories*. The BCW supplies a matrix linking COM-B components to the intervention functions likely to address deficits in them; for example, deficits in physical opportunity call for environmental restructuring or enablement, whereas deficits in reflective motivation call for education, persuasion or incentivisation. For an adaptive system, this matrix suggests a principled way to restrict the action space conditional on the inferred barrier: if the dominant barrier on a given day is time scarcity, persuasion is unlikely to help, and an enablement action — e.g. identifying a five-minute slot in the calendar and proposing a micro-behaviour for it — is more appropriate.

## 2.3 The Behaviour Change Technique Taxonomy and Mechanisms of Action

### 2.3.1 BCT Taxonomy v1

Intervention functions are broad categories; the active ingredients of interventions are specified at the level of **behaviour change techniques** (BCTs). The **BCT Taxonomy v1** (BCTTv1; Michie et al., 2013) is a consensus-based, hierarchically structured taxonomy of 93 distinct techniques organised into 16 groupings, such as *Goals and planning* (e.g. 1.1 goal setting (behaviour), 1.2 problem solving, 1.4 action planning), *Feedback and monitoring* (e.g. 2.2 feedback on behaviour, 2.3 self-monitoring of behaviour), *Shaping knowledge*, *Natural consequences*, *Associations* (e.g. 7.1 prompts/cues), *Repetition and substitution* (e.g. 8.1 behavioural practice/rehearsal, 8.3 habit formation, 8.7 graded tasks), *Reward and threat* and *Self-belief* (e.g. 15.1 verbal persuasion about capability). Each BCT is defined as an observable, replicable and irreducible component of an intervention designed to alter or redirect causal processes that regulate behaviour.

BCTTv1 serves two functions in this thesis. First, it provides a controlled vocabulary for annotating the engine's action library, so that each intervention option is described by the techniques it instantiates; this ensures interpretability, comparability with the literature and the possibility of reporting interventions in a replicable way. Second, specific BCTs correspond directly to elements of the engine's logic. *Graded tasks* (8.7), defined as setting easy-to-perform tasks and making them increasingly difficult but achievable until the behaviour is performed, is effectively the BCT that the Smallest Step Strategy operationalises algorithmically. *Prompts/cues* (7.1), *action planning* (1.4), *problem solving* (1.2) and *habit formation* (8.3) are the other techniques most relevant to momentary support.

### 2.3.2 Mechanisms of action and the BCT ontology

A taxonomy of techniques does not specify *how* those techniques work. Carey et al. (2019) synthesised links between BCTs and their theorised **mechanisms of action** (MoAs) — constructs such as beliefs about capabilities, intention, behavioural cueing, environmental context and resources — as described in published intervention literature, and subsequent triangulation work assessed the evidence for these links. The Human Behaviour-Change Project (Michie et al., 2017) extends this work into a formal ontology (the Behaviour Change Intervention Ontology) with the long-term aim of using machine reasoning to predict intervention effects from structured descriptions of intervention, context, population and behaviour. These developments are important for the present work because they supply prior knowledge about which BCTs act on which determinants. In the engine, BCT–MoA links can be encoded as informative priors on the parameters that couple barrier types to action classes, so that the system does not need to learn from scratch that, say, a problem-solving prompt is more useful against opportunity barriers than against fatigue.

### 2.3.3 Limitations

BCTTv1 describes *what* is delivered, not *when*, *how much* or *to whom*. Its definitions are agnostic to dose and timing, and its reliability depends on trained coders. Moreover, meta-analytic attempts to identify individually effective BCTs have produced heterogeneous results, which is consistent with the hypothesis that the effect of a technique depends strongly on the state of the person at delivery. The engine addresses this by treating BCT annotations as structural features of actions whose state-dependent effects are learned rather than assumed.

## 2.4 Minimal Behaviours: Fogg's Behaviour Model, Shaping and Implementation Intentions

### 2.4.1 The Fogg Behaviour Model

The **Fogg Behaviour Model** (FBM; Fogg, 2009) states that a behaviour occurs when motivation, ability and a prompt (originally termed "trigger") converge at the same moment, summarised as $B = MAP$. The model is usually depicted as a two-dimensional space with motivation on the vertical axis and ability on the horizontal axis, separated by a convex *action line*: prompts succeed for combinations of motivation and ability that lie above the line and fail below it. Two properties of the FBM are directly relevant here. First, it is explicitly *momentary*: motivation and ability are assessed at the time of the prompt, not as stable traits. Second, it implies a *compensatory* relation between motivation and ability — when motivation is low, a behaviour can still occur if it is made sufficiently easy. In *Tiny Habits*, Fogg (2019) turns this into a design method: anchor a very small version of the target behaviour to an existing routine, perform it reliably, and let it grow.

The FBM is a design heuristic rather than a quantitative model; it does not specify the shape of the action line, how ability is measured, or how motivation changes over time. Nevertheless, it can be read as a qualitative precursor to the probability factor in Equation (1.1): if the action line is interpreted as a decision boundary of a probabilistic classifier, the probability of execution becomes a smooth function of motivation and ability, and scaling down the behaviour corresponds to moving to the right on the ability axis.

### 2.4.2 Shaping and graded tasks

The principle of reinforcing successive approximations to a target behaviour — **shaping** — originates in operant conditioning research (Peterson, 2004) and is codified in BCTTv1 as *graded tasks* (8.7). In clinical practice, graded activity and graded exposure are established components of rehabilitation and cognitive-behavioural therapy. The common logic is that a behaviour that is too difficult is not performed and therefore cannot be reinforced, whereas a behaviour that is sufficiently easy is performed, reinforced and can subsequently be extended. What clinical shaping leaves to the judgement of the therapist — how large the next step should be and when to reduce the demand — must be made explicit in an automated system.

### 2.4.3 Implementation intentions

**Implementation intentions** are if–then plans that link an anticipated situational cue to a goal-directed response ("If it is 12:30 and I have finished lunch, then I will walk around the block"). Gollwitzer (1999) proposed that such plans delegate the initiation of action to the situational cue, thereby reducing reliance on deliberate control at the critical moment. A meta-analysis of 94 independent tests reported a medium-to-large effect on goal attainment ($d = 0.65$; Gollwitzer & Sheeran, 2006). Implementation intentions are relevant to the engine in two ways: as an intervention option (an action-planning BCT that can be proposed at low-barrier moments to prepare for high-barrier ones), and as a structural template for micro-actions, since a well-specified if–then plan anchored to a calendar event is a natural form for a "smallest step".

## 2.5 Digital Behaviour Change Interventions and the Engagement Problem

### 2.5.1 Effectiveness

Early meta-analyses of internet-delivered interventions found that more extensive use of theory and more BCTs were associated with larger effects, and that additional delivery modes such as text messages increased effectiveness (Webb et al., 2010). Smartphone-based interventions have since become the dominant modality. Systematic reviews of mHealth physical activity interventions report statistically significant but modest short-term effects that attenuate over time (Mönninghoff et al., 2021). The heterogeneity of effects across studies is large, which is compatible with — though not proof of — the view that effects depend strongly on whether support reaches people at the right time and in the right form.

### 2.5.2 Engagement as a precondition and as a problem

Engagement is the pathway through which a DBCI can have any effect at all. Perski et al. (2017) conceptualise engagement as having both a behavioural dimension (extent of use) and an experiential dimension (attention, interest, affect), and Yardley et al. (2016) introduced the notion of *effective engagement* — engagement sufficient to achieve the intended outcomes — as distinct from maximal engagement. Nahum-Shani et al. (2022) further distinguish engagement with the intervention from engagement with the target behaviour in the real world, arguing that the goal of a digital intervention is ultimately the latter.

This distinction is crucial for the design of the EHG criterion. An algorithm that maximises taps on notifications optimises engagement with the *technology*; an algorithm that maximises executed health actions weighted by their value optimises engagement with the *behaviour*. The former can be achieved through attention-capturing designs that may even be counterproductive, for example by inducing alert fatigue. The latter requires modelling both the probability that a prompt is noticed (receptivity) and the probability that the behaviour is then executed (barrier-conditioned execution), as in Equation (1.3).

The empirical picture of engagement is unfavourable. Baumel et al. (2019) reported median 30-day retention of 3.3% for mental health apps; Eysenbach's (2005) law of attrition states that a substantial proportion of users will stop using an eHealth application over time, and that attrition is itself an outcome that must be explained. A plausible contributor to attrition, consistent with Social Cognitive Theory, is the cumulative effect of failure experiences: when an application repeatedly proposes goals that the user, on many days, cannot meet, each prompt becomes a reminder of failure rather than a support for success.

### 2.5.3 Engagement features: progress feedback, gamification and streaks

Commercial applications respond to the engagement problem with features designed to bring users back: progress visualisations, points, badges, leaderboards and, most prominently, *streaks* — counts of consecutive days on which a behaviour was performed. These features differ in what they reward, and the difference matters for an engine whose objective is behaviour rather than use.

**Progress feedback.** Monitoring progress towards a goal has a robust effect on goal attainment. A meta-analysis of 138 experimental studies found that interventions that increased the frequency of progress monitoring improved goal attainment with an average effect of $d = 0.40$ (Harkin et al., 2016). The effect was larger when progress was physically recorded and when it was made visible. Progress feedback thus corresponds to the BCT *feedback on behaviour* (2.2), and its effect depends on what is counted as progress. A display that makes small achievements visible supports self-efficacy, whereas a display that foregrounds a gap to a distant target can undermine it.

**Gamification.** A meta-analysis of randomised trials of gamified interventions for physical activity reported a small-to-medium effect during the intervention (Hedges' $g = 0.42$; approximately 1,600 additional steps per day in the subset reporting steps). The effect at follow-up, on average 14 weeks after the intervention ended, was small ($g = 0.15$ after sensitivity analyses) (Mazeas et al., 2022). Gamification therefore works, but its effects decay, and they depend on the specific mechanics used.

**Streaks.** Streaks are motivating while they last, but the evidence on what happens when they end is sobering. In a series of studies, Silverman and Barasch (2023) showed that people come to value the streak itself, beyond the behaviour it tracks, and that breaking a streak reduces subsequent engagement with the behaviour more than an equivalent lapse without a streak. A conventional streak thus converts a single missed day — which has little effect on habit formation (Lally et al., 2010) — into a salient failure experience. The *fresh-start effect* points to a constructive alternative: temporal landmarks such as a new week or month increase aspirational behaviour (Dai et al., 2014), which suggests framing lapses as occasions for a new beginning rather than as resets to zero.

**Commitment and cues.** In behavioural economics, a *commitment device* is an arrangement by which a person voluntarily restricts future choices or attaches consequences to them in order to follow through on an intention (Rogers et al., 2014). Physical prompts, by contrast, are cues (BCT 7.1). Cues placed in the context in which the behaviour should occur can support the formation of context-dependent habits (Wood & Neal, 2007). Design traditions such as *calm technology* (Weiser & Brown, 1996) argue that such cues should inform at the periphery of attention rather than demand it.

The common lesson for this thesis is that engagement features are not neutral. They either reinforce success experiences or manufacture failure experiences, and they either respect or compete for attention. Section 3.8 derives design rules from this distinction.

## 2.6 Just-in-Time Adaptive Interventions

### 2.6.1 Definition and components

A **just-in-time adaptive intervention** (JITAI) is an intervention design that aims to provide the right type and amount of support, at the right time, by adapting to an individual's changing internal and contextual state (Nahum-Shani et al., 2018). The JITAI framework identifies six key components:

1. **Distal outcome** — the ultimate goal of the intervention (e.g. increased weekly physical activity, reduced HbA1c).
2. **Proximal outcomes** — short-term goals that the intervention options are intended to achieve and that are hypothesised to mediate the distal outcome (e.g. steps in the 30 minutes after a prompt).
3. **Decision points** — the times at which an intervention decision is made (e.g. five pre-specified times per day, or every time a sensor detects a sedentary bout).
4. **Intervention options** — the set of possible types, sources, amounts and delivery modes of support, explicitly including the option of providing nothing.
5. **Tailoring variables** — information about the individual used to decide when and which option to provide.
6. **Decision rules** — the functions that map tailoring variables to intervention options at each decision point.

The framework also articulates the conditions under which support should be provided: when the person is in a **state of vulnerability** (elevated risk for an adverse health outcome) or a **state of opportunity** (a period in which a positive change is particularly achievable), *and* is **receptive** — able to receive, process and use the support. Nahum-Shani et al. (2015) complement this with a pragmatic framework for building dynamic health behaviour models that can inform decision rules, emphasising the need to specify the temporal dynamics of tailoring variables.

### 2.6.2 Mapping to the Behaviour Understanding Engine

The JITAI framework maps directly onto the architecture developed in this thesis, and the engine can be understood as a specific, formally grounded instantiation of it. Table 2.2 makes the mapping explicit and highlights where the engine extends the canonical framework.

**Table 2.2.** Correspondence between JITAI components and the Behaviour Understanding Engine.

| JITAI component | Canonical description | Instantiation in the BUE | Extension |
|---|---|---|---|
| Distal outcome | Long-term health goal | Cumulative realised health benefit $\sum_t B_t(a_t)Y_t$ | Benefit includes habit/self-efficacy value |
| Proximal outcome | Short-term mediator | Execution $Y_t$ and engagement $R_t$ | Two-stage outcome, both modelled |
| Decision points | When to decide | Context-triggered and scheduled points | Points can be suppressed by low $\rho_t$ |
| Intervention options | What to provide, incl. nothing | BCT-annotated actions $a=(c,d)$ with dose ladder | Dose as explicit, continuous decision variable |
| Tailoring variables | Information used for decisions | Posterior over $(\rho_t,\mathbf{b}_t,\boldsymbol\theta)$ | Latent, inferred rather than directly observed |
| Decision rules | Mapping to options | $\arg\max_a \mathrm{EHG}_t(a)$ with Thompson sampling | Derived from a utility, learned online |

### 2.6.3 Empirical evidence for JITAIs

Hardeman et al. (2019) systematically reviewed JITAIs for physical activity and found that, while the number of studies was growing, few reported all JITAI components, decision rules were rarely grounded in theory or empirical data, and most interventions tailored on a small number of directly measured variables such as step count or sedentary time. Very few used receptivity as a tailoring variable. Wang and Miller (2020) meta-analysed JITAIs across health behaviours and found moderate-to-large effects relative to waitlist and minimal-intervention controls, and smaller but significant effects relative to non-JITAI active interventions; they also noted substantial heterogeneity and the methodological limitations of the underlying studies.

Two observations from this literature motivate the present thesis. First, tailoring variables are almost always *observed* quantities (current step count, location, time), not *inferred* latent states. This restricts adaptation to what can be measured directly and ignores the fact that the determinants of behaviour identified by COM-B are, for the most part, not directly observable. Second, decision rules are typically static if–then rules specified by designers before deployment. They encode assumptions about who benefits from what, but they do not learn from the outcomes of their own decisions within individuals.

## 2.7 Receptivity, Interruptibility and Opportune Moments

### 2.7.1 From interruptibility to receptivity

Research on *interruptibility* in human–computer interaction predates mHealth by more than a decade. Ho and Intille (2005) showed that delivering messages at activity transitions — e.g. when a person stands up after sitting — was perceived as less burdensome than delivering them at random times, establishing that the cost of an interruption depends on the momentary state of the recipient. Mehrotra et al. (2016) studied people's *receptivity* to mobile notifications in the wild and found that the response to a notification depends on its content and sender as well as on the recipient's context, and that the relevant factors differ between the decision to *attend* to a notification and the decision to *act* on it. Pielot et al. (2017) moved "beyond interruptibility" by predicting opportune moments to engage users with content, showing that phone-usage features can identify moments of boredom in which users are more willing to engage.

In mHealth, Sarker et al. (2014) assessed the *availability* of users to engage in just-in-time interventions in the natural environment, modelling availability from physiological stress, activity, location and time features and demonstrating that availability is predictable from passively sensed data. Choi et al. (2019) proposed a *multi-stage receptivity model* that distinguishes between successive stages of a person's response to a just-in-time intervention — from perceiving the notification, through attending to its content, to performing the recommended action — and showed that different contextual factors influence different stages. This multi-stage view is important because it implies that "receptivity" is not a single quantity: being reachable is necessary but not sufficient for being able to act.

### 2.7.2 Receptivity in health interventions

Künzler et al. (2019) explored the state of receptivity for physical activity interventions delivered by the *Ally* smartphone app over six weeks and operationalised receptivity through several engagement measures, notably whether the participant responded to an intervention within a short time window ("just-in-time response"). They found that receptivity was associated with time of day, day of the week, phone battery level, device interaction, physical activity and personal characteristics, and they demonstrated that machine-learning models could predict receptivity above chance. In a subsequent study, Mishra et al. (2021) deployed static and adaptive receptivity models in the natural environment and compared them against a control condition that delivered interventions at random times; the model-based conditions achieved relative improvements of up to approximately 40% in just-in-time responses, and the adaptive model, which updated with each participant's own data, outperformed the static model over time.

These studies establish three propositions on which the engine relies: receptivity varies substantially within persons; it is partially predictable from passively sensed context; and person-specific adaptation improves prediction. They also exhibit a limitation that the present thesis addresses. In both studies, receptivity was operationalised primarily as engagement with the *prompt* (opening, responding, rating), and the receptivity model was used to decide *when* to deliver a fixed intervention. Neither study modelled the probability that the *health behaviour* would be executed as a function of latent barriers, and neither adapted the *magnitude* of the requested behaviour to the inferred state.

### 2.7.3 A two-stage conception of receptivity

Synthesising this literature, the thesis adopts a two-stage conception. **Attentional receptivity** $\rho_t$ denotes the probability that a prompt delivered at $t$ is noticed and processed, and depends primarily on device state, ongoing activity and situational interruptibility. **Behavioural feasibility** $\pi_a(\mathbf{b}_t)$ denotes the probability that the proposed behaviour is executed given that the prompt has been processed, and depends on the COM-B barriers. The product $\rho_t\,\pi_a(\mathbf{b}_t)$ constitutes the execution probability in Equation (1.3). This decomposition is identifiable when engagement $R_t$ and execution $Y_t$ are observed separately, which is the case in most app-based designs (prompt-open events are logged; execution is inferred from sensors or self-report).

## 2.8 Micro-Randomised Trials and Causal Excursion Effects

### 2.8.1 Design

Developing a JITAI requires answering causal questions of the form: *Does delivering intervention option $a$ at a decision point, rather than not delivering it, improve the proximal outcome — and does this effect depend on context?* Standard randomised controlled trials, which randomise individuals once to an intervention package, cannot answer this question. The **micro-randomised trial** (MRT; Klasnja et al., 2015) addresses it by randomising each participant repeatedly — at each decision point — to intervention options with known probabilities. Each participant may be randomised hundreds or thousands of times over the course of a study, which yields within-person contrasts at high temporal resolution and allows the estimation of time-varying and context-dependent effects with moderate sample sizes. MRTs are one component of the broader *Multiphase Optimisation Strategy* (MOST), which also comprises factorial experiments and sequential multiple assignment randomised trials (SMARTs) for optimising adaptive interventions at slower time scales (Collins et al., 2007).

### 2.8.2 Causal excursion effects

The primary estimand of an MRT is the **causal excursion effect** (Boruvka et al., 2018). Let $A_t \in \{0,1\}$ denote randomised treatment at decision point $t$, $I_t$ an availability indicator (participants are randomised only when available, e.g. not driving), $S_t$ a vector of candidate moderators, and $Y_{t+1}$ the proximal outcome. Using potential-outcome notation, the effect of an "excursion" from the treatment protocol at $t$ is

$$
\beta(t; s) \;=\; \mathbb{E}\!\left[\,Y_{t+1}\big(\bar{A}_{t-1}, 1\big) - Y_{t+1}\big(\bar{A}_{t-1}, 0\big) \;\middle|\; S_t = s,\; I_t = 1\right],
\tag{2.1}
$$

where $\bar{A}_{t-1}$ denotes the treatment history, which is itself random under the MRT's randomisation policy. The effect is thus marginal over the past randomisation distribution and conditional on the moderators of interest. Boruvka et al. (2018) proposed a weighted and centred least-squares estimator that is consistent for $\beta(t;s)$ even when the model for the outcome's baseline mean is misspecified. For binary proximal outcomes such as execution $Y_t$, Qian et al. (2021) defined the excursion effect on the log relative-risk scale,

$$
\beta(t; s) \;=\; \log \frac{\mathbb{E}\big[Y_{t+1}(\bar{A}_{t-1},1) \mid S_t = s, I_t = 1\big]}{\mathbb{E}\big[Y_{t+1}(\bar{A}_{t-1},0) \mid S_t = s, I_t = 1\big]},
\tag{2.2}
$$

and derived a corresponding estimator. Moderation analyses, in which $S_t$ includes contextual or latent-state estimates, are the natural empirical test of the receptivity hypothesis: if the excursion effect of a prompt is larger when the inferred barrier load is low, the receptivity construct has predictive and causal relevance.

### 2.8.3 Findings from HeartSteps and related trials

HeartSteps, a physical activity JITAI for sedentary adults, is the most extensively studied MRT. In its first trial, contextually tailored activity suggestions increased step counts in the 30 minutes following delivery compared with no suggestion, but the effect diminished with time in the study and depended on the participant's location, being larger when participants were at home or at work (Klasnja et al., 2019). Daily planning prompts did not significantly change daily step counts. Bidargaddi et al. (2018) conducted an MRT of push notifications in a mental health app and found that the effect of a notification on subsequent engagement depended on time of day and day of week. These findings demonstrate empirically what the receptivity hypothesis predicts: identical interventions have context-dependent and time-varying effects. They also reveal a phenomenon — the decay of proximal effects over weeks — that is consistent with habituation and alert fatigue and that any adaptive system must account for, for example by including the burden of prompts in its objective.

## 2.9 Sequential Decision-Making: Contextual Bandits and Reinforcement Learning in mHealth

### 2.9.1 Problem formulation

Once the decision problem of a JITAI is formulated — at each decision point, observe a context, choose an action, observe a reward — it becomes a sequential decision problem amenable to reinforcement learning (RL). The full RL formulation models the effect of current actions on future states through a Markov decision process (MDP). The **contextual bandit** is a simplification in which actions are assumed to affect only the immediate reward, not the future context distribution. Tewari and Murphy (2017) systematically examined the transfer of contextual bandits from online advertising to mobile health and identified the specific challenges of the health setting: few decision points per person, noisy and delayed rewards, non-stationarity due to habituation and life events, the need for interpretability and safety, and the requirement that the data collected by the algorithm remain usable for causal inference.

### 2.9.2 Thompson sampling

**Thompson sampling** (TS) is a Bayesian approach to the exploration–exploitation dilemma. The learner maintains a posterior over the parameters $\boldsymbol\theta$ of the reward model; at each decision point it draws a sample $\tilde{\boldsymbol\theta}_t \sim p(\boldsymbol\theta \mid \mathcal{H}_t)$ and acts greedily with respect to the sample,

$$
a_t \;=\; \arg\max_{a \in \mathcal{A}} \; \mathbb{E}\!\left[r_t \mid a, \mathbf{x}_t, \tilde{\boldsymbol\theta}_t\right].
\tag{2.3}
$$

Equivalently, each action is selected with the posterior probability that it is optimal. TS enjoys strong empirical performance and near-optimal regret guarantees in many settings (Chapelle & Li, 2011; Russo et al., 2018; Lattimore & Szepesvári, 2020). Its suitability for mHealth stems from three properties: it naturally incorporates informative priors, which is essential when each user contributes only a few decision points per day; it produces stochastic action-selection probabilities that can be recorded and used for causal inference, as in an MRT; and it is computationally light when the posterior is conjugate or can be approximated.

### 2.9.3 Algorithms deployed in mHealth

Several adaptations of TS have been developed for mobile health. **Action-centred bandits** (Greenewald et al., 2017) model the reward as the sum of an arbitrary, possibly non-stationary baseline and a treatment effect that is linear in context,

$$
r_t \;=\; f_t(\mathbf{x}_t) \;+\; A_t\, \mathbf{g}(\mathbf{x}_t)^{\!\top} \boldsymbol\beta \;+\; \varepsilon_t,
\tag{2.4}
$$

and learn only $\boldsymbol\beta$, which makes the algorithm robust to unmodelled changes in baseline behaviour — an important property given that daily step counts are driven by many factors unrelated to the intervention. **Personalized HeartSteps** (Liao et al., 2020) combined a Bayesian linear model of the treatment effect, informative priors derived from the first HeartSteps trial, and a "proxy value" term that approximates the delayed negative effect of treatment on future responsiveness, thereby partially relaxing the bandit assumption to account for treatment burden. **IntelligentPooling** (Tomkins et al., 2021) used a hierarchical Bayesian model with random effects to share information across users while allowing personalisation, addressing the cold-start problem. Most recently, the **Oralytics** trial deployed an online RL algorithm to optimise the delivery of engagement prompts for oral self-care behaviours; Trella et al. (2025) describe the design decisions required for such deployment, including Bayesian pooling across users, constraints on action-selection probabilities to preserve the ability to conduct post-hoc causal analyses, and monitoring procedures to ensure the algorithm's reliability in a clinical trial.

### 2.9.4 What existing algorithms do not model

These algorithms represent the state of the art in learning adaptive interventions, and the engine adopts several of their design principles: Bayesian reward models, Thompson sampling, hierarchical pooling, and clipping of action probabilities. They also share three features that differentiate them from the approach of this thesis. First, the context $\mathbf{x}_t$ consists of *observed* features; latent states such as fatigue or time scarcity are represented, if at all, through observed proxies entering a linear model. Second, the action space is typically binary (send a prompt or not) or a small set of message types; the *size* of the requested behaviour is not a decision variable. Third, the reward is typically a single proximal outcome (e.g. step count after a prompt), so that the decomposition of non-response into lack of receptivity versus specific barriers is not represented. The EHG framework can be understood as a *structured* reward model for Thompson sampling in which the reward is decomposed into benefit and execution probability, and the execution probability is further decomposed through latent states.

### 2.9.5 Conversational and agentic LLM coaching

Large language models (LLMs) have made conversational coaching at scale technically feasible, and a first generation of systems combines them with behavioural-science frameworks. A representative example is the agentic workflow of Yang et al. (2024) for personalised nutrition coaching. It consists of two agents. A *barrier identification agent* uses multi-turn questioning in the style of motivational interviewing to identify the most prominent barrier from a taxonomy of 28 barriers, which was derived from the literature, from existing products and from user research. A *strategy execution agent* then retrieves tactics for that barrier from a mapping of more than 50 strategies and 100 tactics, grounded in COM-B, the BCT Taxonomy and the EAST framework, and delivers them conversationally. In an evaluation with LLM-simulated patients built from 153 vignettes, two experts judged barrier identification to be correct in more than 90% of 50 conversations. An LLM judge preferred the workflow over the base model in two thirds of comparisons, and a small hands-on study ($n = 6$) found the advice personalised and actionable. Behavioural outcomes were not measured.

This line of work is complementary to the approach of this thesis. Agentic coaching excels at eliciting *what kind* of barrier a person faces, in rich and largely stable categories such as "decision fatigue", "cost" or "family food preferences". It also excels at selecting *which tactic* addresses it. It does not maintain a quantitative, time-varying model of the person, it does not learn from the outcomes of its advice, and it does not decide *when* or *how much* to ask. The Behaviour Understanding Engine has the opposite profile. Sections 3.4.10 and 3.5.7 show how the two can be combined: structural barriers and tactics elicited in conversation become part of the engine's person model and action space, while the engine retains control over timing, dose and learning.

## 2.10 Bayesian Models of Latent Barriers and Dynamic States

### 2.10.1 Bayesian inference as a model of belief updating

Bayesian inference provides a normative account of how beliefs about an unobserved quantity should be revised in the light of evidence. Given a prior $p(\mathbf{z})$ over a latent state $\mathbf{z}$ and a likelihood $p(\mathbf{o} \mid \mathbf{z})$ of observing evidence $\mathbf{o}$, the posterior is

$$
p(\mathbf{z} \mid \mathbf{o}) \;=\; \frac{p(\mathbf{o} \mid \mathbf{z})\, p(\mathbf{z})}{\int p(\mathbf{o} \mid \mathbf{z}')\, p(\mathbf{z}')\, d\mathbf{z}'}.
\tag{2.5}
$$

Three properties make this framework attractive for modelling a person's barriers. First, it supports the *fusion of heterogeneous evidence*: if observations from different sources are conditionally independent given the latent state, their likelihoods multiply, so that calendar data, physiological measurements and behavioural outcomes each contribute according to their informativeness. Second, it *quantifies uncertainty*, which is essential both for exploration (Section 2.9.2) and for safe decision-making — an engine that is uncertain whether a user is exhausted should behave differently from one that is confident. Third, it supports *hierarchical modelling* (Gelman et al., 2013), in which person-level parameters are drawn from a population distribution; individuals with few observations are thereby shrunk towards the population mean, and individuals with many observations are allowed to deviate from it.

### 2.10.2 Dynamic latent-state models

Because barriers change over time, a static posterior is insufficient; the latent state must be tracked. **State-space models** formalise this by combining a *transition model* $p(\mathbf{z}_t \mid \mathbf{z}_{t-1})$, which describes how the state evolves between observations, with an *observation model* $p(\mathbf{o}_t \mid \mathbf{z}_t)$. The filtering distribution is updated recursively in a predict–update cycle (Särkkä, 2013):

$$
\underbrace{p(\mathbf{z}_t \mid \mathbf{o}_{1:t-1}) = \int p(\mathbf{z}_t \mid \mathbf{z}_{t-1})\, p(\mathbf{z}_{t-1} \mid \mathbf{o}_{1:t-1})\, d\mathbf{z}_{t-1}}_{\text{prediction}},
\qquad
\underbrace{p(\mathbf{z}_t \mid \mathbf{o}_{1:t}) \;\propto\; p(\mathbf{o}_t \mid \mathbf{z}_t)\, p(\mathbf{z}_t \mid \mathbf{o}_{1:t-1})}_{\text{update}}.
\tag{2.6}
$$

For linear-Gaussian models, the recursion is solved exactly by the **Kalman filter**; for discrete latent states, by the forward algorithm of **hidden Markov models**; for general nonlinear and non-Gaussian models, by approximations such as the extended or unscented Kalman filter, **particle filters** (sequential Monte Carlo) or variational methods (Murphy, 2012). **Dynamic Bayesian networks** generalise these models to factored state spaces, in which the latent state consists of several variables with sparse dependencies — a natural representation for a vector of COM-B barriers that each evolve at their own rate and are each informed by a different subset of sensors.

The transition model encodes substantive assumptions about behavioural dynamics. A first-order autoregressive transition, $\mathbf{z}_t = \boldsymbol\mu + \boldsymbol\Phi(\mathbf{z}_{t-1} - \boldsymbol\mu) + \boldsymbol\eta_t$, expresses that states revert towards a person-specific baseline $\boldsymbol\mu$ with persistence $\boldsymbol\Phi$ and innovation noise $\boldsymbol\eta_t$. Diagonal entries of $\boldsymbol\Phi$ close to one describe slowly changing states (e.g. accumulated fatigue over a stressful week); entries close to zero describe states that are essentially independent from one decision point to the next (e.g. momentary interruptibility). Such models are the backbone of the idiographic, intensive-longitudinal analysis of psychological processes and have been applied to ecological momentary assessment data on affect and stress.

### 2.10.3 Control-systems and computational models of behaviour change

A related line of work approaches adaptive interventions from control engineering. Rivera et al. (2007) proposed using engineering control principles, such as model predictive control, to inform the design of adaptive interventions, treating the person as a dynamical system whose outputs (behaviour) respond to inputs (intervention dose) and disturbances (life events). Hekler et al. (2018) provide a tutorial on applying system identification and control systems engineering to optimise mHealth interventions, and dynamical models based on Social Cognitive Theory have been fitted to physical activity data in which constructs such as self-efficacy and outcome expectancy are represented as states with inflows and outflows. These models share with the present work the view that the person is a dynamic system with latent states; they differ in that they are typically deterministic or linear-Gaussian, focus on slow time scales (days to weeks), and do not explicitly model the momentary feasibility of a specific proposed action.

### 2.10.4 Towards a Bayesian barrier model

The term *Bayesian barrier model* does not denote an established, canonical model in the behavioural science literature. Barriers are widely studied — perceived barriers are a core construct of the Health Belief Model and of most physical activity research — but they are typically measured once by questionnaire and treated as stable between-person predictors. Bayesian methods, in turn, are widely used for analysis but rarely as the *operational core* of a deployed intervention that maintains beliefs about an individual's momentary barriers. This thesis therefore uses the term in a specific sense: a *Bayesian barrier model* is a dynamic latent-state model in which (i) the latent variables correspond to theory-defined barrier constructs, here the fluctuating facets of COM-B; (ii) each data source is linked to these constructs through an explicit observation model; (iii) the outcomes of the engine's own proposals — engagement and execution — enter as additional observations whose likelihood depends on both the barriers and the proposed action; and (iv) the posterior over barriers is used to predict the execution probability of candidate actions. Component (iii) is what turns the model from a sensing system into a *behaviour understanding* system: every proposal becomes an experiment whose outcome is informative about the person.

## 2.11 Passive Sensing as Evidence: Wearables, Calendars and Behavioural Traces

### 2.11.1 Digital phenotyping

**Digital phenotyping** refers to the moment-by-moment quantification of the individual-level human phenotype in situ using data from personal digital devices (Onnela & Rauch, 2016). Smartphones and wearables provide passive streams — accelerometry, location, phone use, heart rate, sleep — that can be collected without burdening the user, complemented by active data from **ecological momentary assessment** (EMA), i.e. repeated brief self-reports in the natural environment (Shiffman et al., 2008). EMA provides direct access to subjective states such as mood, perceived stress or energy but imposes burden, which limits its frequency and itself affects engagement. In the engine, EMA is therefore treated as an optional, high-information but costly observation channel whose use must be justified by its expected information gain.

### 2.11.2 Heart-rate variability and sleep

**Heart-rate variability** (HRV), the variation in time between successive heartbeats, reflects autonomic nervous system activity, with vagally mediated components such as the root mean square of successive differences (RMSSD) commonly interpreted as indices of parasympathetic activity (Shaffer & Ginsberg, 2017). The neurovisceral integration model (Thayer & Lane, 2000) links vagally mediated HRV to prefrontal inhibitory control and emotion regulation, providing a theoretical rationale for interpreting low HRV as a marker of reduced self-regulatory capacity. A meta-analysis of stress and HRV found that psychological stress is consistently associated with reduced HRV, particularly reduced high-frequency power and increased low-to-high-frequency ratio (Kim et al., 2018). Consumer wearables increasingly provide nightly HRV and resting heart rate, which are less affected by motion artefacts than daytime measures and are therefore suitable as daily indicators of recovery.

**Sleep** duration and quality are measured by wearables with moderate validity relative to polysomnography — reasonably accurate for total sleep time, less accurate for sleep staging. Sleep deprivation impairs attention and executive function and is a plausible determinant of next-day physical capability and motivation. However, evidence from daily-diary and device-based studies on the within-person effect of sleep on next-day physical activity is mixed (Atoui et al., 2021). This illustrates a general principle for the engine: the relation between a physiological signal and a barrier must be treated as a person-specific parameter to be learned, with a population prior reflecting the strength of evidence, rather than as a fixed rule.

### 2.11.3 Calendars and digital schedules

Electronic calendars are a rich and under-used source of evidence about *opportunity*. The density of scheduled events, the length of free intervals between them, the time of the first and last events of the day, and event types (meetings, travel, social events) all bear on whether a time window for a given behaviour exists. In the HCI literature, calendar information has been used to model the cost of interruptions in the workplace (Horvitz et al., 2004). In health interventions, by contrast, calendar data have rarely been used as a tailoring variable, although they are among the few data sources that provide *prospective* information: unlike sensors, which describe the past and present, a calendar describes the constraints of the coming hours. This makes calendars particularly valuable for *planning* decisions — for example, identifying that the only feasible window for activity today is between 12:30 and 12:45 — and for anticipating time-scarcity barriers before they materialise.

### 2.11.4 Behavioural traces as the most informative evidence

The most direct evidence about whether a person can and will perform a behaviour is whether they performed it when it was last proposed in a similar situation. Execution outcomes can be measured passively for some behaviours (steps, active minutes, sleep onset) and require confirmation for others (hydration, mindfulness exercises). The engine treats these outcomes not merely as rewards but as likelihood terms: a missed proposal on a day with a dense calendar and normal HRV shifts posterior mass towards the time-scarcity barrier, whereas a missed proposal on a free day with low HRV and short sleep shifts it towards fatigue. This *explaining-away* behaviour — the attribution of an outcome among competing causes in proportion to their prior plausibility and their predicted effect on that outcome — is a characteristic property of Bayesian networks and the mechanism through which hypothesis H3 is expected to hold.

## 2.12 Synthesis and Research Gap

The reviewed literature converges on a set of well-supported propositions. Behaviour is determined by the joint presence of capability, opportunity and motivation (COM-B), each of which has momentary as well as stable components. Intentions are insufficient; situational barriers explain a large share of the intention–behaviour gap. Small, easy, cue-anchored behaviours are more likely to be performed and to become habitual, and successful performance builds self-efficacy. Momentary receptivity to digital support varies within persons and is partially predictable from passive data. The effects of identical prompts depend on context and decay over time. Bayesian sequential decision algorithms can learn personalised intervention policies online, and hierarchical models allow learning from few observations per person.

Table 2.3 contrasts representative approaches with respect to the properties that the Behaviour Understanding Engine aims to combine.

**Table 2.3.** Comparison of representative approaches (✓ = addressed, ◐ = partially addressed, – = not addressed).

| Approach | Theory-based barrier constructs | Latent state inference | Receptivity modelled | Execution outcome as evidence on barriers | Dose adapted to state | Online person-level learning |
|---|---|---|---|---|---|---|
| Conventional goal–reminder apps | – | – | – | – | – | – |
| Rule-based JITAIs (Hardeman et al., 2019) | ◐ | – | ◐ | – | – | – |
| Receptivity models (Künzler et al., 2019; Mishra et al., 2021) | – | – | ✓ | – | – | ✓ |
| Personalized HeartSteps (Liao et al., 2020) | – | – | ◐ | – | – | ✓ |
| Oralytics (Trella et al., 2025) | – | – | ◐ | – | – | ✓ |
| Control-systems models (Rivera et al., 2007; Hekler et al., 2018) | ✓ | ✓ | – | – | ✓ | ◐ |
| Tiny Habits / graded tasks (Fogg, 2019) | ◐ | – | – | – | ✓ (manual) | – |
| Agentic LLM coaching (Yang et al., 2024) | ✓ | ◐ | – | – | – | – |
| **Behaviour Understanding Engine (this thesis)** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

The table reveals the research gap. Existing approaches address individual elements — receptivity prediction, online personalisation, theory-based constructs, dynamic modelling, graded behaviours — but no approach combines them into a single decision framework in which (i) theory-defined barriers are latent states inferred from multi-source evidence, (ii) the outcomes of proposals update beliefs about those barriers, and (iii) both the timing and the *magnitude* of the requested behaviour are chosen by maximising an explicit trade-off between benefit and execution probability. Closing this gap requires answering the research questions formulated in Section 1.3.3: a formal definition of the EHG components (RQ1), a Bayesian barrier model with explicit observation models (RQ2), a decision rule for scaling interventions (RQ3), and an evaluation methodology (RQ4). Chapter 3 begins with the first of these.
