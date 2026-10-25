# A Receptivity-Driven Behaviour Understanding Engine for Personalised Health Promotion

*Development of a Bayesian, barrier-aware decision engine that senses today's obstacles, selects the smallest step that will still happen, and learns the person until change sticks*

---

## Abstract

Digital behaviour change interventions for physical activity, sleep, nutrition and stress management reach millions of users. Yet their effects are typically small, decay within weeks and are undermined by steep attrition. This thesis argues that a central and largely unaddressed cause is the failure of existing systems to model *receptivity*: a person's momentary capacity to receive, process and act upon support, which fluctuates between days and within a single day as fatigue, time pressure, motivation and context change.

We develop the *Behaviour Understanding Engine* (BUE), a decision system built around the *Expected Health Gain* of an action, $\mathrm{EHG}_t(a) = \mathbb{E}[B_t(a)]\cdot P(Y_t = 1 \mid a, \mathbf{s}_t)$: expected benefit times the probability of execution.

- **Execution probability.** It is decomposed into attentional receptivity, calendar-based feasibility and volitional execution. Volitional execution is suppressed by six latent barriers derived from the COM-B model, and their effect grows with the size of the requested behaviour.
- **Benefit.** It combines a concave dose–response value with dose-independent habit gains and difficulty-dependent self-efficacy gains.
- **Analytical results.** We prove that the optimal dose is non-increasing in every barrier, and that receptivity determines *whether* to intervene while barriers determine *how much* to ask for.
- **Inference.** A Bayesian barrier model, implemented as a particle filter with hierarchical, federated priors, fuses evidence from calendars, wearables, smartphone context and a coach-like daily touchpoint. It also treats the engine's own executed and missed proposals as evidence, apportioned among competing explanations. No data channel is mandatory.
- **Smallest Step Strategy.** A BCT-annotated action library supports it with a closed-form scaling rule, chance-constrained execution floors, progression bounded by demonstrated performance, and fading once the behaviour sustains itself.

In a simulation study with 200 synthetic persons per condition over 90 days, the engine more than doubled the realised health benefit of a fixed daily prompt (+102%). It also exceeded a twice-daily fixed schedule (+32%) and a contextual bandit without latent barriers (+76%), and reached 92–97% of an oracle with perfect knowledge. Its proposed doses tracked the true barrier load within 96% of persons, and its predictions were well calibrated. Information about free time proved far more valuable than physiological sensing: a single touchpoint question about time windows recovered 96% of the benefit of full sensing. Unrestricted lateral steps into other health domains reduced long-run benefit by displacing habit-building repetitions, which led to a revised rule that permits them only below the floor of the focal ladder.

Engagement is designed to reinforce success rather than to capture attention. The engine provides a non-decreasing display of accumulated health gain, consistency streaks in which any step counts, and an optional ambient cue device. An optional implicit-motive profile adds motive–incentive fit as a further dimension of personalisation: on difficult days the engine favours steps that are not only smaller but also more congruent with the person's motives. Structural barriers and tactics elicited in conversation, following recent agentic coaching work, extend the person model and the action space. The thesis closes with the design of a micro-randomised validation trial, a discussion of ethical safeguards, transfer to domains such as behavioural activation, medication adherence and chronic disease self-management, and extensions including a conversational touchpoint and non-myopic planning.

**Keywords:** just-in-time adaptive interventions; receptivity; COM-B; behaviour change techniques; Bayesian filtering; contextual bandits; micro-randomised trials; mHealth

---

## Notation

The following notation is used consistently throughout the thesis.

| Symbol | Meaning |
|---|---|
| $u \in \{1,\dots,N\}$ | User index (omitted where unambiguous) |
| $t \in \{1,\dots,T\}$ | Decision point (moment at which the engine may intervene) |
| $\mathcal{A}$ | Action space, including the null action $a_\varnothing$ (no prompt) |
| $a = (c, d)$ | Action of behavioural class $c$ at dose level $d \in \{1,\dots,D_c\}$ |
| $\mathbf{x}_t$ | Observed context at $t$ (calendar, wearable, time, location, device state) |
| $\mathbf{b}_t \in [0,1]^K$ | Latent barrier intensities (e.g. fatigue, time scarcity, low motivation) |
| $\rho_t \in [0,1]$ | Momentary receptivity: probability that a prompt is attended to and processed |
| $\mathbf{s}_t = (\mathbf{x}_t, \mathbf{b}_t, \rho_t)$ | Full user state at $t$ |
| $\boldsymbol{\theta}_u$ | Person-level (trait) parameters |
| $R_t \in \{0,1\}$ | Engagement indicator: prompt was attended to |
| $Y_t \in \{0,1\}$ | Execution indicator: proposed action was carried out |
| $B_t(a)$ | (Random) health benefit of executing action $a$ at $t$ |
| $\mathrm{EHG}_t(a)$ | Expected Health Gain of action $a$ at $t$ |
| $\mathcal{H}_t$ | History of observations, actions and outcomes up to $t$ |
| $\sigma(\cdot)$ | Logistic function, $\sigma(z) = 1/(1+e^{-z})$ |
| $p_{\min}$, $\varepsilon_p$ | Floor on the conditional execution probability $\pi_a$ and its chance-constraint tolerance (Smallest Step Strategy) |
| $\tau_c(d)$, $g_c(d)$ | Physical quantity (e.g. minutes) and dimensionless difficulty of dose level $d$ of class $c$ |
| $P_t(a)$ | Marginal execution probability of proposal $a$, $P_t(a) = \mathbb{E}[\rho_t\,\pi_a]$ |
| $\pi_a = \Phi_t(a)\,\tilde\pi_a$ | Execution probability given engagement: structural feasibility × volitional execution |
| $\Phi_t(a)$ | Probability that a sufficiently long free window exists (calendar-derived) |
| $\gamma_{ck}(d)$ | Sensitivity of class $c$ at dose $d$ to barrier $k$, $\gamma^{(0)}_{ck} + \gamma^{(1)}_{ck} g_{ck}(d)$ |
| $e_t$, $h_{c,t}$ | Self-efficacy and habit strength for class $c$, both in $[0,1]$ |
| $\bar B_t(a)$, $\tilde B_t(a)$ | Expected benefit given execution; effective benefit $\bar B_t(a) + \ell_t$ |
| $b^{\text{imm}}_c(d)$ | Immediate (dose–response) health value |
| $\nu_h$, $\nu_e$ | Marginal values of habit strength and self-efficacy |
| $\ell_t$ | Failure cost of an attempted but missed proposal |
| $\kappa_t$ | Prompt-burden cost |
| $\rho^\ast_t$ | Receptivity threshold above which a proposal is preferred to $a_\varnothing$ |
| $c^\star$ | Focal behavioural class (target of habit formation) |
| $m_t$ | Meta-habit: superordinate daily self-care routine, in $[0,1]$ |
| $\nu_m$ | Marginal value of the meta-habit |
| $\eta_{ck}$ | Efficacy of class $c$ in reducing barrier $k$ |
| $\nu_{b_k,t}$ | Marginal value of reducing barrier $k$ |
| $\varsigma_t$ | Substitution/licensing penalty for lateral actions |
| $a^{\downarrow}_t$, $a^{\rightarrow}_t$ | Best downward (focal-class) and best lateral (non-focal) proposal |
| $q_{\min}$, $\bar h$ | Focus-constraint quota and habit-consolidation threshold |
| $\boldsymbol\xi_t = (e_t, \{h_{c,t}\}, m_t)$ | Learning-history states (layer L2) |
| $\mathbf{z}_t = (\mathbf{b}_t, \rho_t, \boldsymbol\xi_t)$ | Full latent state |
| $b^{\text{fat}}, b^{\text{load}}, b^{\text{time}}, b^{\text{env}}, b^{\text{soc}}, b^{\text{mot}}$ | The six barriers of the COM-B barrier ontology ($K = 6$) |
| $u_{k,t}$ | Logit of barrier $k$, $b_{k,t} = \sigma(u_{k,t})$ |
| $\mu_{k,t}$, $T_k$, $s_k$ | Time-varying baseline, time constant and stationary volatility of barrier $k$ |
| $\mathbf{w}_t$ | Known causal drivers of barrier baselines (e.g. prior sleep, meeting load) |
| $\boldsymbol\theta_\rho$, $\boldsymbol\varphi(\mathbf{x}_t)$, $\vartheta$, $v_t$ | Receptivity coefficients, feature map, load coupling, latent residual |
| $I_t \in \{0,1\}$ | Availability (decision point admissible) |
| $\mathcal{A}^{\text{beh}}, \mathcal{A}^{\text{prep}}, \mathcal{A}^{\text{info}}$ | Behavioural, preparatory and informational actions |
| $\mathcal{A}^{\text{safe}}_t$ | Safe action set after safety, frequency, focus and $p_{\min}$ filters (Eq. 3.30) |
| $\mathbf{q}_c(d)$, $q^0_{cj}$ | Dose vector over $J$ dose dimensions; reference quantity of dimension $j$ |
| $\mathbf{M}$ | Barrier–dose-dimension matrix ($K \times J$) |
| $W^{\text{nom}}$, $U$, $F_U$ | Nominal free window, unscheduled demand and its distribution |
| $\hat Y_t$, $\text{se}_c$, $\text{sp}_c$ | Verified execution signal; sensitivity and specificity of verification |
| $\tilde x_t$ | Robust personal-baseline deviation score of a sensor feature |
| $\mathrm{VOI}_t$, $\kappa^{\text{EMA}}_t$ | Value of information of an EMA query; its burden |
| $S^{\text{med}}_t$, $S^{\text{freq}}_t$, $S^{\text{focus}}_t$ | Medical, frequency and focus admissibility indicators |
| $[\pi_{\text{lo}}, \pi_{\text{hi}}]$ | Clipping interval for action-selection probabilities |
| $\mathcal{C}_u$ | Sensing configuration: set of channels consented to by user $u$ (profiles P0–P3) |
| $n_{\max}$, $\mathcal{Q}$, $Q^\ast_t$, $\kappa_q$ | Max. touchpoint questions; item pool; selected items; burden of item $q$ |
| $\boldsymbol\psi = (\boldsymbol\mu_{\text{pop}}, \mathbf{B}, \boldsymbol\Sigma_{\text{pop}})$, $\mathbf{c}_u$ | Population hyperparameters; onboarding covariates |
| $\tilde{\boldsymbol\theta}_u$, $\mathbf{m}_u$, $\mathbf{S}_u$ | Unconstrained person parameters; Gaussian posterior mean and covariance |
| $\lambda_{jk}$, $\omega_{jk}$, $M_{jt}$ | Evidence loadings; missingness loadings; missingness indicator |
| $a_{uq}$, $c_q$ | Response-style intercept and loading of self-report item $q$ |
| $Y^{\text{sp}}_t$, $\pi^{\text{sp}}_t$, $B^{\text{sp}}_t$ | Spontaneous focal behaviour, its probability and benefit |
| $\varpi^{\downarrow}$, $\varpi^{\rightarrow}$ | Crowding-out factors (anchoring down; licensing) |
| $\Delta\mathrm{EHG}_t(a)$ | Incremental Expected Health Gain net of spontaneous behaviour |
| $N$, $w^{(s)}_t$ | Number of particles; particle weights |
| $\upsilon$, $\upsilon_d$ | Nightly forgetting factor; daily discount factor |
| $d^{\text{floor}}_t(c)$, $d^{\text{dem}}_{c,t}$ | Highest dose meeting the floor; demonstrated level |
| $q_t(a)$ | Thompson-sampling selection probability |
| $\boldsymbol\iota_u$, $\iota_{uj}$ | Structural barrier profile; strength of structural barrier $j$ (Section 3.4.10) |
| $\mathcal{A}^{\text{tact}}$, $P^{\text{adopt}}_t$ | Structural tactics; probability that a tactic is adopted |
| $G_t$ | Accumulated realised health gain (engagement display, Eq. 3.31) |
| $\Delta e^{\text{fb}}$ | Self-efficacy increment from viewing progress feedback |
| $\mathbf{n}_u$ | Implicit motive profile (achievement, affiliation, power) |
| $\mathbf{m}_c$ | Incentive profile of action class, template or engagement element |
| $f_{uc} = \mathbf{n}_u^\top \mathbf{m}_c$ | Motive–incentive fit |
| $\beta^{\text{fit}}$, $\lambda^{\text{inc}}$ | Effect of fit on attractiveness; self-control cost of incongruence under load (Eq. 3.21a) |
