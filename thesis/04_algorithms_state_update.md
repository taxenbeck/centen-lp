# 4 Algorithmic Implementation and State Updating

Chapter 3 specified *what* the Behaviour Understanding Engine represents and *what* it optimises. This chapter specifies *how* it computes. It begins with the complete generative model that underlies all inference (Section 4.1), its prior structure (Section 4.2) and its observation models (Section 4.3). It then develops the inference procedure that turns data into beliefs (Section 4.4) and the learning of the execution model, including spontaneous behaviour and crowding-out (Section 4.5). Sections 4.6–4.8 turn beliefs into decisions: the Smallest Step Strategy, exploration by Thompson sampling, and progression towards self-sustaining behaviour. Section 4.9 assembles the complete algorithm and analyses its computational cost.

## 4.1 The Bayesian Barrier Model: Generative Structure

The engine's inference is grounded in a single *generative model*: a joint probability distribution over everything the engine reasons about, from the person's parameters to the outcome of a proposal. A generative formulation has three advantages over discriminative alternatives that predict execution directly from features. First, it makes the explaining-away of execution outcomes among competing barriers (Section 2.11.4) a consequence of probability calculus rather than a heuristic. Second, it handles missing channels and missing observations naturally, because a missing observation simply contributes no likelihood term (or, if missingness is informative, a missingness term; Section 4.3.5). Third, the same model that is used for inference can be run forward to *simulate* users, which provides the ground-truth environment for the evaluation in Chapter 5.

### 4.1.1 Variables and Levels

The model has three levels.

- **Population level.** Hyperparameters $\boldsymbol\psi = (\boldsymbol\mu_{\text{pop}}, \mathbf{B}, \boldsymbol\Sigma_{\text{pop}})$ describe the distribution of person parameters in the population, including how it depends on onboarding covariates $\mathbf{c}_u$ (Section 4.2).
- **Person level.** Parameters $\boldsymbol\theta_u$ (Table 3.8) are constant within a person over the time scale of weeks.
- **Decision-point level.** At each decision point $t$, the model contains the latent barrier logits $\mathbf{u}_t \in \mathbb{R}^K$ (with $\mathbf{b}_t = \sigma(\mathbf{u}_t)$), the latent receptivity residual $v_t$ (with $\rho_t$ given by Equation 3.21), the learning-history states $\boldsymbol\xi_t$, the observed drivers $\mathbf{w}_t$, context $\mathbf{x}_t$ and evidence $\mathbf{o}_t$, the action $a_t$, and the outcomes $R_t$, $Y_t$, the verification signal $\hat Y_t$ and spontaneous behaviour $Y^{\text{sp}}_t$.

### 4.1.2 Joint Distribution

Conditional on the actions chosen by the engine (which are functions of the history and of the engine's own randomisation, and therefore do not contribute likelihood terms for the person's parameters), the joint distribution for user $u$ over $T$ decision points factorises as

$$
\begin{aligned}
&p\big(\boldsymbol\theta_u, \mathbf{u}_{1:T}, v_{1:T}, \mathbf{o}_{1:T}, R_{1:T}, Y_{1:T}, \hat Y_{1:T}, Y^{\text{sp}}_{1:T} \,\big|\, a_{1:T}, \mathbf{x}_{1:T}, \mathbf{w}_{1:T}, \boldsymbol\psi\big) \\
&\quad=\; p(\boldsymbol\theta_u \mid \boldsymbol\psi, \mathbf{c}_u)\; \prod_{t=1}^{T} \Big[\, \underbrace{p(\mathbf{u}_t \mid \mathbf{u}_{t-1}, Y_{t-1}, a_{t-1}, \mathbf{w}_t, \boldsymbol\theta_u)}_{\text{barrier dynamics (3.20)}}\; \underbrace{p(v_t \mid v_{t-1}, \boldsymbol\theta_u)}_{\text{receptivity residual}} \\
&\qquad\times\; \underbrace{\prod_{j \in \mathcal{C}_u} p(o_{jt}, M_{jt} \mid \mathbf{u}_t, \boldsymbol\theta_u)}_{\text{evidence and missingness}}\; \underbrace{p(R_t \mid \rho_t, a_t)}_{\text{engagement}}\; \underbrace{p(Y_t \mid R_t, a_t, \mathbf{b}_t, \boldsymbol\xi_t, \Phi_t, \boldsymbol\theta_u)}_{\text{execution}} \\
&\qquad\times\; \underbrace{p(Y^{\text{sp}}_t \mid a_t, \mathbf{b}_t, \boldsymbol\xi_t, \boldsymbol\theta_u)}_{\text{spontaneous behaviour}}\; \underbrace{p(\hat Y_t \mid Y_t, Y^{\text{sp}}_t)}_{\text{verification}} \,\Big],
\end{aligned}
\tag{4.1}
$$

where $\mathcal{C}_u$ is the user's sensing configuration (Section 3.2.4) and $M_{jt}$ indicates whether observation $j$ is missing. The learning-history states $\boldsymbol\xi_t$ do not appear as separate random variables: given the outcome history, they are deterministic functions defined by the recursions of Equations (3.7), (3.8) and (3.15). Under outcome uncertainty, they are evaluated in expectation over the posterior of past outcomes (Section 3.4.6), which corresponds to a Rao–Blackwellisation of the model: the low-variance deterministic part is computed exactly, and only the genuinely stochastic part is sampled.

### 4.1.3 The Generative Story

Read forward, Equation (4.1) describes a process by which a simulated person lives through their days.

1. **Draw the person.** $\boldsymbol\theta_u \sim p(\boldsymbol\theta \mid \boldsymbol\psi, \mathbf{c}_u)$. This fixes, among other things, how strongly fatigue suppresses intense activity for this person, how volatile their days are and how well slow breathing relieves their stress.
2. **Evolve the day.** Between decision points, the barrier logits follow the Ornstein–Uhlenbeck dynamics of Equation (3.20), driven by circadian and weekly rhythms, by the night's sleep and the day's schedule (drivers $\mathbf{w}_t$), by random events (innovations) and by the effects of actions the person has executed. The receptivity residual evolves as a short-memory autoregressive process.
3. **Emit evidence.** The wearable, phone, calendar and touchpoint emit noisy, possibly missing observations whose distribution depends on the current barriers (Section 4.3).
4. **Respond to the engine.** If the engine proposes an action, the person notices it with probability $\rho_t$. If noticed, the person executes it with probability $\Phi_t(a)\,\tilde\pi_a(\mathbf{b}_t; \boldsymbol\theta_u)$. Independently of any prompt, the person may perform the focal behaviour spontaneously, with a probability that grows with habit strength.
5. **Leave traces.** The sensors and the app register an imperfect record of what happened: verification signals with class-specific sensitivity and specificity, confirmations and the occasional "why not?" answer.
6. **Learn.** Executed behaviour updates habit strength, self-efficacy and the meta-habit, which shift the probabilities of future execution.

Inference inverts this process. Given the traces, the engine asks which persons and which days would most plausibly have produced them.

### 4.1.4 Conditional Independence Structure and Its Consequences

Three conditional independences, visible in Figure 3.2 and in Equation (4.1), drive the design of the inference algorithms.

- **Evidence channels are conditionally independent given the barriers.** Sleep data and calendar density are correlated in the raw data, because both depend on how demanding the person's life currently is. Given the barriers, however, they are independent. Their likelihoods therefore multiply, and adding a channel adds a factor without changing the others. This is what makes channel agnosticism (Section 3.2.4) cheap to implement.
- **Outcomes depend on barriers only through the proposed action.** The likelihood of a miss is $1 - \Phi_t(a)\tilde\pi_a(\mathbf{b}_t)$, whose sensitivity to each barrier is governed by the action's dose profile (Equation 3.22). Proposals of different doses are therefore differently informative about different barriers, which is the formal basis of the identifiability argument of Section 3.4.8.
- **Person parameters are constant within a day.** Within the fast loop, $\boldsymbol\theta_u$ can be treated as fixed, apart from posterior uncertainty, and only the low-dimensional state $(\mathbf{u}_t, v_t)$ needs to be filtered. Parameters are updated in the nightly loop (Section 4.4.4). This separation of time scales reduces the dimension of the online filtering problem from several hundred to seven.

### 4.1.5 What the Model Does Not Contain

Three simplifications are deliberate. First, there is no latent variable for *intention* or *plan*: the effect of planning is represented through the preparatory actions of Section 3.5.4 and their effect on $\Phi_t$ and $b^{\text{time}}$. Second, there is no explicit model of *weekly goals* or quotas from the user's perspective; the focus constraint is a constraint on the engine, not a variable in the person. Third, the model contains no *social network*: the behaviour of others affects the person only through the social-opportunity barrier and its evidence. Each could be added without changing the inference architecture; Section 6.6 discusses the most promising.

## 4.2 Prior Specification and Hierarchical Population Pooling

The engine must be useful from the first day, when it knows nothing about the person, and it must become personal as data accumulate. Both requirements are met by the prior: an informative population prior provides the day-one model, and its hierarchical structure determines how quickly and how far the individual model departs from it. This section specifies the prior on the person parameters, the hyperprior on the population, the treatment of sign constraints, the elicitation of informative components from the literature, and the federated procedure by which the population prior is learned.

### 4.2.1 Reparameterisation of Constrained Parameters

Many parameters of the human model are constrained: barrier sensitivities are non-negative, the difficulty sensitivity is positive, barrier-reduction efficacies lie in $[0, 1)$, time constants and volatilities are positive, and certain observation loadings have a known sign (Table 3.15). To place a single multivariate Gaussian hierarchy over all parameters, each constrained parameter is mapped to an unconstrained one:

$$
\gamma^{(\cdot)}_{ck} = \exp\big(\tilde\gamma^{(\cdot)}_{ck}\big), \quad
\delta_c = \exp(\tilde\delta_c), \quad
\eta_{ck} = \eta_{\max}\,\sigma(\tilde\eta_{ck}), \quad
T_k = \exp(\tilde T_k), \quad
\lambda_{jk} = \operatorname{sgn}_{jk}\exp(\tilde\lambda_{jk}),
\tag{4.2}
$$

where $\operatorname{sgn}_{jk} \in \{-1, +1\}$ is the prior sign from Table 3.15 for loadings whose sign is theoretically fixed. Loadings marked "○" (uncertain sign) remain unconstrained and Gaussian. The log-normal form for sensitivities has a substantive advantage beyond enforcing positivity: it makes effects multiplicative across persons, which matches the observation that individual differences in, for instance, sensitivity to fatigue span orders of magnitude rather than fixed increments. Let $\tilde{\boldsymbol\theta}_u \in \mathbb{R}^P$ denote the vector of all unconstrained person parameters; for the reference configuration, $P \approx 150$.

### 4.2.2 Hierarchical Prior with Covariate-Stratified Means

The person parameters are given a hierarchical Gaussian prior whose mean depends on onboarding covariates:

$$
\tilde{\boldsymbol\theta}_u \mid \boldsymbol\psi, \mathbf{c}_u \;\sim\; \mathcal{N}\!\big(\boldsymbol\mu_{\text{pop}} + \mathbf{B}\,\mathbf{c}_u,\; \boldsymbol\Sigma_{\text{pop}}\big),
\qquad
\boldsymbol\Sigma_{\text{pop}} = \operatorname{diag}(\boldsymbol\tau)\,\boldsymbol\Omega\,\operatorname{diag}(\boldsymbol\tau).
\tag{4.3}
$$

The covariates $\mathbf{c}_u$ are a small set of onboarding variables with plausible relevance to the parameters: age band, current activity level, chronotype, type of work schedule (regular, shift, irregular), caregiving responsibilities and the sensing profile. The regression matrix $\mathbf{B}$ allows the prior mean to differ systematically between groups — for example, the barrier baseline $\mu_{\text{time}}$ for parents of young children, or the circadian profile for late chronotypes — which addresses the cold-start inequity discussed in Section 3.7.4. The covariance is decomposed into scales $\boldsymbol\tau$ and a correlation matrix $\boldsymbol\Omega$, which allows the prior to encode that, for instance, persons with high sensitivity to fatigue tend also to have high sensitivity to cognitive load.

To keep $\mathbf{B}$ and $\boldsymbol\Omega$ estimable, both are structured. $\mathbf{B}$ is sparse, with non-zero entries only for covariate–parameter pairs that are theoretically motivated. $\boldsymbol\Omega$ is block-diagonal across parameter groups (execution model, barrier dynamics, observation model, receptivity model), with full correlation only within groups.

### 4.2.3 Hyperpriors and Literature Elicitation

The population hyperparameters receive the following hyperpriors:

$$
\begin{gathered}
\boldsymbol\mu_{\text{pop}} \sim \mathcal{N}(\mathbf{m}_0, \mathbf{S}_0), \qquad
\mathbf{B}_{ij} \sim \mathcal{N}(0, s_B^2), \\
\tau_p \sim \text{Half-Normal}(0, s_{\tau,p}^2), \qquad
\boldsymbol\Omega_{\text{block}} \sim \text{LKJ}(\eta_{\text{LKJ}} = 2).
\end{gathered}
\tag{4.4}
$$

The LKJ distribution with shape 2 places mild preference on weak correlations (Lewandowski et al., 2009). The hyperprior means $\mathbf{m}_0$ and scales $\mathbf{S}_0$ encode prior knowledge from the literature. Table 4.1 summarises the elicitation for the most consequential parameters.

**Table 4.1.** Elicitation of the population prior for key parameters (values on the natural scale; the prior is placed on the unconstrained scale via Equation 4.2).

| Parameter | Prior centre | Prior width | Basis |
|---|---|---|---|
| Baseline execution probability of an engaged walking proposal at median dose and median barriers, $\sigma(\alpha + \beta_{\text{walk}} - \delta g_{\text{med}})$ | 0.5 | 90% interval 0.25–0.75 | Proximal effects and engagement rates in HeartSteps and Ally (Klasnja et al., 2019; Künzler et al., 2019); intention–behaviour gap (Rhodes & de Bruijn, 2013) |
| Dose sensitivity $\delta_c$ | 0.8 | factor 2 (log-normal) | Ability axis of the Fogg Behaviour Model; graded-task practice |
| Barrier sensitivities $\gamma^{(0)}_{ck}, \gamma^{(1)}_{ck}$ for primary dimensions | 0.5–1.0 | factor 3 | Weakly informative; identified mainly from data |
| Barrier sensitivities for non-primary dimensions ($M_{kj} = 0$) | 0.05 | factor 3 | Theory: barrier does not act on this dimension |
| Habit coefficient $\zeta_h$ | 1.5 | ±1.0 (normal) | Habit strength predicts behaviour beyond intention (Gardner, Lally, & Wardle, 2012; Wood & Neal, 2007) |
| Self-efficacy coefficient $\zeta_e$ | 1.0 | ±0.75 | Social Cognitive Theory (Bandura, 1997) |
| Meta-habit transfer $\zeta_m$ | 0 | ±0.5 | No direct evidence; neutral (Section 3.3.7) |
| Motive–incentive fit $\beta^{\text{fit}}$ | 0.3 | 90% interval 0.0–0.8 (truncated at 0) | Motive–incentive fit in sport (Gröpel et al., 2016); thin evidence outside sport (Brummer et al., 2024) |
| Incongruence cost $\lambda^{\text{inc}}$ | 0.2 | 90% interval 0.0–0.6 (truncated at 0) | Self-control demands of motive-incongruent goals (Schüler et al., 2019) |
| Barrier reduction $\eta_{\text{breath},\text{load}}$ | 0.3 | 90% interval 0.05–0.6 | Acute effects of slow breathing (Laborde et al., 2022; Zaccaro et al., 2018) |
| Barrier reduction $\eta_{\text{walk},\text{load}}$ | 0.1 | 90% interval 0.0–0.3 | Weak prior; acute exercise and affect |
| Time constants $T_{\text{fat}}, T_{\text{load}}, T_{\text{time}}, T_{\text{env}}, T_{\text{soc}}, T_{\text{mot}}$ | 24 h, 3 h, 24 h, 4 h, 3 h, 72 h | factor 2 | Table 3.7 |
| Habit learning rate $\alpha_h$ | ≈0.035 per repetition | factor 2 | Median of ~66 days to 95% of asymptote with daily repetition (Lally et al., 2010): $1 - (1-\alpha_h)^{66} \approx 0.9$ |
| Loadings of nocturnal RMSSD on $b^{\text{fat}}$, $b^{\text{load}}$ | negative, moderate | factor 3 | Stress–HRV association (Kim et al., 2018) |

Two remarks on the table. First, the habit learning rate illustrates how literature findings are translated into priors: Lally et al. (2010) report the time to reach 95% of the *person's* asymptotic automaticity; under the recursion of Equation (3.7) with daily repetitions in a consistent context and an asymptote of 1, reaching 90–95% in about 66 repetitions implies $\alpha_h \approx 0.035$–$0.045$. The worked examples of Sections 3.3.6 and 3.3.7 used a larger, illustrative value ($\alpha_h\chi_t = 0.09$) for readability; the qualitative conclusions drawn there do not depend on it. Second, the priors for the barrier sensitivities are deliberately wide: they are the parameters for which individual differences are expected to be largest and for which the literature provides little quantitative guidance. They are learned primarily from each person's own outcomes, with the population hierarchy providing stability.

Before deployment, the prior is assessed by *prior predictive checks* (Gelman et al., 2013): simulated users are drawn from the prior, run through the generative model under a simple prompting policy, and their simulated execution rates, day-to-day variability and engagement trajectories are compared with published ranges. Priors that generate implausible behaviour — for example, execution rates near zero or one for most users — are revised.

### 4.2.4 Shrinkage and the Speed of Personalisation

The hierarchical prior determines how the engine's model of a person evolves from the population model to an individual one. Under a Gaussian approximation of the likelihood, with $\hat{\boldsymbol\theta}_u$ the person-specific estimate from $n_u$ decision points and $\mathbf{J}_u$ its per-observation Fisher information, the posterior mean is the precision-weighted combination

$$
\mathbb{E}\big[\tilde{\boldsymbol\theta}_u \mid \mathcal{H}_u\big] \;\approx\; \big(\boldsymbol\Sigma_{\text{pop}}^{-1} + n_u\mathbf{J}_u\big)^{-1}\Big(\boldsymbol\Sigma_{\text{pop}}^{-1}\big(\boldsymbol\mu_{\text{pop}} + \mathbf{B}\mathbf{c}_u\big) + n_u\mathbf{J}_u\,\hat{\boldsymbol\theta}_u\Big).
\tag{4.5}
$$

Equation (4.5) makes the personalisation dynamics transparent. Parameters for which the population is homogeneous (small $\tau_p$) remain close to the population value for a long time; parameters for which the population is heterogeneous (large $\tau_p$) are personalised quickly. Parameters that the person's data are informative about (large $\mathbf{J}_u$) personalise quickly; parameters that are weakly identified — for example the social-constraint sensitivity of a user without calendar access — stay near their prior. This is exactly the graceful behaviour required by Section 3.4.8 and by the channel-agnosticism requirement FR11. It also shows why exploration matters: the information $\mathbf{J}_u$ about dose-interaction parameters $\gamma^{(1)}_{ck}$ is near zero if the engine always proposes the same dose, so a policy that never varies doses would never personalise them (Section 4.7).

### 4.2.5 Federated Learning of the Population Prior

The population hyperparameters $\boldsymbol\psi$ are learned from the community of users, without centralising their data (Section 3.7.3). The procedure is a federated variant of empirical Bayes. Each device $u$ maintains a Gaussian approximation $\mathcal{N}(\mathbf{m}_u, \mathbf{S}_u)$ of its *likelihood-only* contribution — the posterior divided by the prior, computed in natural parameters — so that the prior is not double-counted when aggregated. Weekly, the server updates the population moments by the expectation–maximisation fixed point for a Gaussian hierarchy:

$$
\hat{\boldsymbol\mu}_{\text{pop}} = \frac{1}{N}\sum_{u=1}^{N}\big(\bar{\mathbf{m}}_u - \hat{\mathbf{B}}\mathbf{c}_u\big),
\qquad
\hat{\boldsymbol\Sigma}_{\text{pop}} = \frac{1}{N}\sum_{u=1}^{N}\Big[\big(\bar{\mathbf{m}}_u - \hat{\boldsymbol\mu}_{\text{pop}} - \hat{\mathbf{B}}\mathbf{c}_u\big)\big(\cdot\big)^{\!\top} + \bar{\mathbf{S}}_u\Big],
\tag{4.6}
$$

where $\bar{\mathbf{m}}_u$ and $\bar{\mathbf{S}}_u$ are the person-level posterior mean and covariance under the current hyperparameters, and $(\cdot)$ repeats the preceding factor. $\hat{\mathbf{B}}$ is obtained by regressing the $\bar{\mathbf{m}}_u$ on the covariates under the sparsity pattern of Section 4.2.2, and the block structure of $\boldsymbol\Omega$ is enforced by projecting $\hat{\boldsymbol\Sigma}_{\text{pop}}$. Devices contribute only the sufficient statistics $(\bar{\mathbf{m}}_u, \bar{\mathbf{S}}_u, \mathbf{c}_u)$. To protect against reconstruction of individual parameters from these statistics, each contribution is clipped in norm and Gaussian noise calibrated to a differential-privacy budget is added before aggregation (Dwork & Roth, 2014). The hyperprior of Equation (4.4) regularises the update when the number of contributing users is small, so that the population model moves smoothly from the literature-elicited prior towards the empirical population as the user base grows.

## 4.3 Evidence Models for Calendar, Physiological and Behavioural Data

The observation models specify the likelihood terms $p(o_{jt}, M_{jt} \mid \mathbf{u}_t, \boldsymbol\theta_u)$, $p(R_t \mid \cdot)$, $p(Y_t \mid \cdot)$ and $p(\hat Y_t \mid \cdot)$ of Equation (4.1). They are the point at which data meet theory: each specifies how a barrier would manifest in a particular data stream if it were present. This section first states the rule that decides whether a feature enters the model as a driver or as evidence, and then specifies the models for continuous passive features, self-report, calendar-derived feasibility, engagement and execution, and missingness. It closes with the analytical form of the explaining-away mechanism.

### 4.3.1 Drivers versus Evidence

A feature can enter the model in two places: as a *driver* $\mathbf{w}_t$ in the baseline of the barrier dynamics (Equation 3.20) or as *evidence* $\mathbf{o}_t$ in an observation model. The choice is not cosmetic. A driver is a cause of the barrier; conditioning on it shifts the prior for the barrier, and its effect persists through the dynamics. Evidence is a consequence or correlate of the barrier; it is explained by the barrier, and it competes with other evidence in a likelihood. Using the same feature in both roles would count it twice. The rule adopted is:

> A feature enters as a **driver** if it is (i) causally upstream of the barrier according to theory and (ii) determined before the decision point to which it applies. All other features enter as **evidence**.

Under this rule, last night's sleep duration and yesterday's activity load are drivers of $b^{\text{fat}}$, and today's meeting density is a driver of $b^{\text{time}}$ and $b^{\text{load}}$. Nocturnal RMSSD and resting heart rate, which reflect the person's recovery state rather than causing it, are evidence for $b^{\text{fat}}$ and $b^{\text{load}}$. Self-report items, phone-use fragmentation and daytime HRV are evidence. Table 3.15 specifies the *signs* of all feature–barrier relations irrespective of role; the rule assigns each feature to exactly one role.

### 4.3.2 Continuous Passive Features

Each continuous passive feature is pre-processed into a personal-baseline deviation score $\tilde x_{jt}$ (Equation 3.28) and modelled as a linear function of the barrier logits with heavy-tailed noise:

$$
\tilde x_{jt} \;=\; \lambda_{j0} \;+\; \sum_{k=1}^{K} \lambda_{jk}\,\big(u_{k,t} - \mu_{k}\big) \;+\; \epsilon_{jt},
\qquad \epsilon_{jt} \sim t_{\nu_j}\!\big(0, \varsigma_j^2\big).
\tag{4.7}
$$

The loadings $\lambda_{jk}$ are constrained to zero where Table 3.15 has a blank, sign-constrained where it has "+" or "−" (Equation 4.2), and unconstrained where it has "○". Barrier logits enter as deviations from the person's baseline $\mu_k$, consistent with the baseline-relative pre-processing of the feature. The Student-$t$ noise with $\nu_j \approx 4$ degrees of freedom makes the filter robust to the outliers that are common in consumer sensor data — a night with a loose strap, an HRV value corrupted by an arrhythmic beat — which would otherwise produce large spurious updates.

### 4.3.3 Self-Report

Self-report items (Section 3.6.6) are rated on a 0–10 scale. They are rescaled to $[-1, 1]$ and modelled as

$$
r_{qt} \;=\; a_{uq} \;+\; c_{q}\,\big(b_{k(q),t} - \bar b_{k(q)}\big) \;+\; \epsilon_{qt}, \qquad \epsilon_{qt} \sim \mathcal{N}\big(0, \varsigma_q^2\big),
\tag{4.8}
$$

where $k(q)$ is the barrier that item $q$ targets, $c_q$ its loading (negative for energy and motivation items, positive for stress and time-pressure items), and $a_{uq}$ a person-specific intercept that absorbs *response style* — the tendency of some people to rate everything as 7 and others to use the full range. Without the person-specific intercept, a habitually low-rating user would be inferred to be permanently exhausted. The measurement error $\varsigma_q$ is item-specific and is learned; its prior reflects the moderate reliability of single items (Section 3.6.6). Although the rating is ordinal, the Gaussian approximation is adequate for the 11-point scale and keeps the update cheap; an ordered-logit model is a drop-in alternative.

**The "why not?" item.** When a missed proposal is followed by the question "What got in the way?", the answer is a categorical observation $r^{\text{why}}_t \in \{\text{time}, \text{energy}, \text{mood}, \text{situation}, \text{other}\}$. Its model follows directly from the execution model. The logit reduction caused by barrier $k$ for action $a = (c, d)$ is $\gamma_{ck}(d)\,b_{k,t}$ (Equation 3.3); a person who is asked why they did not act is assumed to name a barrier with probability proportional to its share of the total reduction, with a residual "other" category:

$$
P\big(r^{\text{why}}_t = k \mid Y_t = 0, R_t = 1, a_t, \mathbf{b}_t\big) \;=\; (1 - \epsilon_{\text{why}})\,\frac{\gamma_{c k}(d)\,b_{k,t}}{\sum_{k'} \gamma_{c k'}(d)\,b_{k',t}} \;+\; \frac{\epsilon_{\text{why}}}{|\mathcal{K}^{\text{why}}|},
\tag{4.9}
$$

where categories are mapped to barriers (time → $b^{\text{time}}$ and $\Phi$; energy → $b^{\text{fat}}$; mood → $b^{\text{mot}}$ and $b^{\text{load}}$; situation → $b^{\text{env}}$ and $b^{\text{soc}}$) and $\epsilon_{\text{why}}$ is a small lapse probability. Equation (4.9) is an *attribution model*: the person's stated reason is treated as a noisy report of the dominant cause. Because it is derived from the execution model rather than specified independently, it introduces no new parameters except the lapse rate, and the answer updates exactly the barriers that the execution model says should be updated. Attributions elicited in a deep check-in (Section 3.5.7) enter in the same way, with a lower lapse rate, and in addition update the structural barrier profile $\boldsymbol\iota_u$.

**Affect ratings.** The optional post-execution affect rating (Section 3.6.6) is rescaled to $[-1, 1]$ and modelled like Equation (4.8), with the class attractiveness $\beta_c + \beta^{\text{fit}} f_{uc}$ as its latent mean and a person-specific response-style intercept. Ratings of classes with different incentive profiles $\mathbf{m}_c$ thus inform both the class attractiveness and, through $f_{uc}$, the motive profile $\mathbf{n}_u$. The motive profile is updated slowly in the nightly step, with a Dirichlet prior centred on the elicited profile, or on the uniform profile if none was elicited.

**Self-reported time windows.** In configurations without calendar access, the time-window item ("When could you take ten minutes today?") returns a set of day periods. Each selected period contributes a nominal free window whose length distribution is learned from subsequent behaviour; "hardly at all" sets $\Phi_t$ for durations above a few minutes close to zero. The resulting $\Phi_t$ enters the execution model exactly as the calendar-derived one does.

### 4.3.4 Engagement, Execution, Spontaneous Behaviour and Verification

The outcome models follow the two-stage structure of Section 3.3.1, extended by spontaneous behaviour and imperfect verification. For $a_t \neq a_\varnothing$:

$$
\begin{aligned}
R_t \mid \rho_t &\sim \operatorname{Bernoulli}(\rho_t), \\
Y_t \mid R_t, a_t, \mathbf{b}_t, \boldsymbol\xi_t &\sim \operatorname{Bernoulli}\big(R_t\,\Phi_t(a_t)\,\tilde\pi_{a_t}(\mathbf{b}_t;\boldsymbol\theta_u)\big), \\
Y^{\text{sp}}_t \mid a_t, \mathbf{b}_t, \boldsymbol\xi_t &\sim \operatorname{Bernoulli}\big(\pi^{\text{sp}}_t(a_t)\big), \\
\hat Y_t \mid Y_t, Y^{\text{sp}}_t &\sim \operatorname{Bernoulli}\big(\text{se}_c\,\mathbb{1}[Y_t \vee Y^{\text{sp}}_t] + (1 - \text{sp}_c)\,\mathbb{1}[\neg(Y_t \vee Y^{\text{sp}}_t)]\big).
\end{aligned}
\tag{4.10}
$$

The spontaneous-behaviour probability $\pi^{\text{sp}}_t(a_t)$ and its dependence on the action are specified in Section 4.5.3. The verification model expresses that a sensor registers a qualifying bout if the behaviour occurred — prompted or not — with sensitivity $\text{se}_c$, and registers a spurious bout with probability $1 - \text{sp}_c$. For self-report verification, confirmation and spontaneous behaviour are distinguished by the confirmation itself, which refers to the proposal; the model is then the same with self-report-specific sensitivity and specificity. When $R_t$ is observed but $Y_t$ is not (e.g. the bout is ambiguous), all terms are marginalised over $Y_t$ and $Y^{\text{sp}}_t$; there are only four combinations, so this is exact and cheap.

### 4.3.5 Informative Missingness

For each channel $j$ in the configuration, the indicator $M_{jt}$ that an expected observation is missing — a night without wearable data, a skipped touchpoint, an unanswered item — is modelled as

$$
P\big(M_{jt} = 1 \mid \mathbf{u}_t\big) \;=\; \sigma\Big(\omega_{j0} + \sum_k \omega_{jk}\,\big(u_{k,t} - \mu_k\big)\Big),
\tag{4.11}
$$

with loadings $\omega_{jk}$ whose prior is centred on zero but whose posterior can learn, for example, that this user skips the touchpoint on days of high load. A missing observation then contributes the factor $P(M_{jt} = 1 \mid \mathbf{u}_t)$ to the likelihood instead of the observation density, and a present observation contributes $P(M_{jt} = 0 \mid \mathbf{u}_t)\,p(o_{jt} \mid \mathbf{u}_t)$. If the missingness loadings are zero, the model reduces to the missing-at-random case, in which missing observations are simply ignored. Missingness that is caused by the user's configuration (a channel that is not consented) is *not* modelled in this way: an unconsented channel produces no indicator at all, because its absence carries no information about the day.

### 4.3.6 Explaining Away: The Analytical Mechanism

The central claim of hypothesis H3 is that execution outcomes, interpreted through the model, are apportioned among competing explanations. Equation (4.10) makes this precise. Consider an engaged proposal ($R_t = 1$) of action $a = (c, d)$ that is not executed. The log-likelihood of the miss is $\log\big(1 - \Phi_t(a)\,\tilde\pi_a\big)$, and its gradient with respect to the logit of barrier $k$ is

$$
\frac{\partial}{\partial u_{k,t}} \log\big(1 - \Phi_t\,\tilde\pi_a\big) \;=\; \underbrace{\frac{\Phi_t\,\tilde\pi_a}{1 - \Phi_t\,\tilde\pi_a}}_{\text{surprise}}\;\cdot\;\underbrace{(1 - \tilde\pi_a)}_{\text{headroom}}\;\cdot\;\underbrace{\gamma_{ck}(d)}_{\text{dose signature}}\;\cdot\;\underbrace{b_{k,t}(1 - b_{k,t})}_{\text{plausibility}} \;\geq\; 0.
\tag{4.12}
$$

Each factor has a clear interpretation. *Surprise*: a miss of an action that was expected to succeed is more informative than a miss of one that was expected to fail, and a miss at a moment without a feasible window ($\Phi_t \approx 0$) is not informative about any barrier at all. *Dose signature*: the miss is attributed to barrier $k$ in proportion to how strongly that barrier acts on this particular dose; a missed 30-minute walk raises $b^{\text{time}}$ much more than a missed 2-minute walk does. *Plausibility*: the logistic derivative $b(1-b)$, evaluated under the current posterior, weights each barrier by how much room there is to revise it; combined with the prior, the update concentrates on barriers that the passive evidence has already made plausible. An executed proposal produces the mirror-image update with the opposite sign, scaled by $(1 - \tilde\pi_a)$ instead of the surprise term: success of a demanding proposal is strong evidence that its sensitive barriers are low.

The gradient also shows why explaining away emerges in the *posterior* even though each barrier's gradient is non-negative: the total shift in log-odds needed to explain the miss is shared among barriers, so evidence that makes one barrier more plausible (e.g. a dense calendar raising $b^{\text{time}}$) reduces the share of the miss that must be explained by the others (e.g. $b^{\text{mot}}$). This is the formal content of the illustration in Table 3.9, where the 12:35 miss left the motivation estimate unchanged.

## 4.4 Posterior Inference and Temporal Filtering

The generative model is nonlinear (logistic links, log-normal parameters), non-Gaussian (binary outcomes, heavy-tailed sensor noise, categorical self-report) and potentially multimodal (a miss can be explained by time *or* by fatigue). Exact inference is intractable. This section develops the inference architecture: a particle filter for the momentary state in the fast loop, a nightly parameter update with fixed-lag smoothing in the slow loop, and Monte Carlo evaluation of the Expected Health Gain on the resulting posterior samples.

### 4.4.1 Choice of Inference Method

Three families of approximate filters were considered. *Gaussian filters* (extended or unscented Kalman filters, assumed-density filtering) are fast and deterministic but represent the posterior by a single mean and covariance. They cannot represent the bimodal posteriors that arise precisely when explaining away is at work — after a miss, "time-constrained but rested" and "free but exhausted" may both be plausible, and a Gaussian approximation would place its mass between them, on a state that explains the data poorly. *Variational methods* share this limitation in their common mean-field form. *Sequential Monte Carlo* (particle filtering) represents the posterior by a weighted set of samples and can represent multimodality and arbitrary likelihoods at a cost linear in the number of particles (Gordon et al., 1993; Doucet & Johansen, 2011). Since the online state is only seven-dimensional ($\mathbf{u}_t \in \mathbb{R}^6$ and $v_t$), a particle filter with a modest number of particles is accurate and feasible on a smartphone (Section 4.9). The particle representation has a second advantage specific to this application: Thompson sampling (Section 4.7) requires posterior samples, which the particle filter provides directly.

### 4.4.2 Particle Representation

The posterior at decision point $t$ is represented by $N$ weighted particles

$$
p\big(\mathbf{u}_t, v_t, \tilde{\boldsymbol\theta}_u \mid \mathcal{H}_t\big) \;\approx\; \sum_{s=1}^{N} w_t^{(s)}\,\delta\big(\mathbf{u}_t - \mathbf{u}_t^{(s)}\big)\,\delta\big(v_t - v_t^{(s)}\big)\,\delta\big(\tilde{\boldsymbol\theta}_u - \tilde{\boldsymbol\theta}^{(s)}\big),
\qquad \sum_s w_t^{(s)} = 1.
\tag{4.13}
$$

Each particle carries its own parameter vector $\tilde{\boldsymbol\theta}^{(s)}$, drawn each morning from the nightly parameter posterior (Section 4.4.4). Parameter uncertainty is thereby propagated into every quantity computed from the particles, which is required both for honest EHG estimates and for Thompson sampling, which must explore over parameters, not only over states. The learning-history states $\boldsymbol\xi_t$ are shared across particles within a day, because they depend on the outcome history only, which is common to all particles.

### 4.4.3 The Fast-Loop Filter

At each decision point and at each arrival of new evidence, the filter performs the following steps.

**Prediction.** Each particle's state is propagated through the barrier dynamics over the elapsed interval $\Delta_t$ using its own parameters:

$$
\mathbf{u}^{(s)}_t \;=\; \boldsymbol\mu^{(s)}_{t} + \mathbf{E}^{(s)}_{\Delta_t}\big(\mathbf{u}^{(s)}_{t-1} - \boldsymbol\mu^{(s)}_{t-1}\big) - \boldsymbol\eta^{(s),\text{logit}}_{c_{t-1}}\,\mathbb{E}[Y_{t-1}] + \mathbf{L}^{(s)}_{\Delta_t}\,\boldsymbol\epsilon^{(s)},
\qquad \boldsymbol\epsilon^{(s)} \sim \mathcal{N}(\mathbf{0}, \mathbf{I}_K),
\tag{4.14}
$$

where $\mathbf{E}_{\Delta} = \operatorname{diag}\big(e^{-\Delta/T_k}\big)$ and $\mathbf{L}_{\Delta}$ is the Cholesky factor of the innovation covariance accumulated over $\Delta$, which includes the correlations of Section 3.4.4. The receptivity residual is propagated analogously. Using the expected rather than sampled previous outcome is a Rao–Blackwellised choice that reduces variance when the outcome is uncertain.

**Update.** Each particle's weight is multiplied by the likelihood of all observations that arrived since the last update — passive features (4.7), self-report (4.8–4.9), engagement and outcomes (4.10), missingness (4.11) — restricted to the channels in the user's configuration:

$$
w^{(s)}_t \;\propto\; w^{(s)}_{t-1}\;\prod_{j \in \mathcal{C}_u} p\big(o_{jt}, M_{jt} \mid \mathbf{u}^{(s)}_t, \tilde{\boldsymbol\theta}^{(s)}\big)\; p\big(R_{t'}, \hat Y_{t'}, r^{\text{why}}_{t'} \mid \mathbf{u}^{(s)}_{t'}, v^{(s)}_{t'}, a_{t'}, \tilde{\boldsymbol\theta}^{(s)}\big).
\tag{4.15}
$$

Outcomes refer to the decision point $t'$ at which the corresponding action was proposed, which may lie before the current time; they are applied to the particle states at $t'$ by the fixed-lag mechanism described below.

**Resampling and rejuvenation.** When the effective sample size $\mathrm{ESS} = 1 / \sum_s (w^{(s)}_t)^2$ falls below $N/2$, particles are resampled with systematic resampling. Because the parameters are static within a day, resampling progressively depletes the diversity of $\tilde{\boldsymbol\theta}^{(s)}$; to counter this, resampled parameters are rejuvenated by the kernel-shrinkage method of Liu and West (2001), which perturbs each parameter vector towards the weighted mean with a small kernel while preserving the first two moments of the parameter posterior.

**Fixed-lag smoothing for late evidence.** Each particle stores its trajectory over a lag window of $L$ hours (e.g. $L = 24$). Evidence that arrives late — a wearable sync, a confirmation at the evening touchpoint of a walk at noon, a "why not?" answer the next morning — is applied by reweighting particles according to the likelihood evaluated on their stored state at the evidence's event time. Because the stored trajectories are the ancestral lines of the current particles, this reweighting propagates correctly to the current state (Doucet & Johansen, 2011). Evidence older than the lag window is passed to the nightly update instead.

### 4.4.4 The Nightly Parameter Update

Person parameters are updated once per night, when the device is idle. The update combines the previous parameter posterior with the evidence of the past day under an assumed-density approach: the posterior over $\tilde{\boldsymbol\theta}_u$ is maintained as a Gaussian $\mathcal{N}(\mathbf{m}_u, \mathbf{S}_u)$, and each night it is updated by a Laplace approximation of

$$
p\big(\tilde{\boldsymbol\theta}_u \mid \mathcal{H}_{\text{tonight}}\big) \;\propto\; \mathcal{N}\big(\tilde{\boldsymbol\theta}_u;\, \mathbf{m}_u, \mathbf{S}_u / \upsilon\big)\;\; \frac{1}{N}\sum_{s=1}^{N} p\big(\mathcal{D}_{\text{day}} \mid \mathbf{u}^{(s)}_{\text{day}}, \tilde{\boldsymbol\theta}_u\big),
\tag{4.16}
$$

where $\mathcal{D}_{\text{day}}$ are the day's observations and $\mathbf{u}^{(s)}_{\text{day}}$ are smoothed state trajectories drawn from the particle system's ancestral lines. The average over smoothed trajectories is a Monte Carlo approximation of the marginal likelihood of the parameters, which accounts for the uncertainty in the latent states rather than conditioning on a single best estimate. The factor $\upsilon \in (0, 1]$ is a forgetting factor that inflates the prior covariance slightly each night ($\upsilon \approx 0.99$), which allows the parameters to track slow drifts in the person — a new job, a change of season — instead of converging permanently. The maximisation required for the Laplace approximation is performed by a few Newton iterations warm-started at $\mathbf{m}_u$, which converge quickly because the daily update is small. Every week, the likelihood-only contribution of the past weeks is exported for the federated population update (Section 4.2.5), and the new population prior enters as a correction of the prior term.

The nightly update also recomputes the deterministic quantities that depend on parameters and outcomes: the expected learning-history states $\boldsymbol\xi$, the personal sensor baselines (Equation 3.28), the marginal values $\nu_{b_k}$ (Equation 3.16) and the spontaneous-behaviour model (Section 4.5.3).

### 4.4.5 Monte Carlo Evaluation of the Expected Health Gain

Given the particle posterior, the EHG of each admissible action is computed per particle and averaged:

$$
\mathrm{EHG}^{(s)}_t(a) \;=\; \rho^{(s)}_t\Big[\Phi_t(a)\,\tilde\pi_a\big(\mathbf{b}^{(s)}_t; \boldsymbol\theta^{(s)}\big)\,\tilde B^{(s)}_t(a) - \ell_t\Big] - \kappa_t,
\qquad
\widehat{\mathrm{EHG}}_t(a) \;=\; \sum_{s=1}^{N} w^{(s)}_t\,\mathrm{EHG}^{(s)}_t(a).
\tag{4.17}
$$

Evaluating the product $\rho\,\pi\,\tilde B$ on each particle before averaging retains the posterior correlations between receptivity, barriers and parameters (Section 3.3.2). The per-particle values serve three purposes: their weighted mean ranks actions; their weighted distribution supports the chance constraint of the Smallest Step Strategy (Section 4.6); and a single particle drawn by weight provides the Thompson sample (Section 4.7). The Monte Carlo standard error of $\widehat{\mathrm{EHG}}_t(a)$ is $\sqrt{\sum_s (w^{(s)}_t)^2\,\mathrm{Var}_s}$; with $N = 1{,}000$ particles and the parameter ranges of Chapter 3 it is about one order of magnitude smaller than the typical difference between neighbouring ladder levels, which is sufficient for ranking.


## 4.5 Learning the Execution Probability from Executed and Missed Actions

The execution model $\tilde\pi_a(\mathbf{b}_t; \boldsymbol\theta_u)$ of Equation (3.3) is the heart of the probability factor of the Expected Health Gain. Its parameters — the person's propensity $\alpha_u$, class attractiveness $\beta_c$, dose sensitivity $\delta_c$, barrier sensitivities $\gamma^{(0)}_{ck}, \gamma^{(1)}_{ck}$ and the coefficients $\zeta_e, \zeta_h, \zeta_m$ — are learned from the person's own history of executed and missed proposals within the nightly update of Section 4.4.4. This section addresses three questions that are specific to this learning problem: how the model is identified despite its latent inputs, which proposals are most informative, and how spontaneous behaviour and crowding-out are incorporated so that the engine learns the *incremental* value of its proposals rather than taking credit for what the person would have done anyway.

### 4.5.1 Identification with Latent Inputs

Learning $\tilde\pi_a$ is an errors-in-variables problem: its inputs $\mathbf{b}_t$ are not observed but inferred. The joint model handles this correctly — the nightly update of Equation (4.16) averages the likelihood over smoothed barrier trajectories — but it raises the question of identification. Three potential non-identifiabilities must be resolved.

**Receptivity versus execution.** A non-executed proposal may be unseen or seen and declined. Because engagement $R_t$ is observed separately (Section 3.6.5), the two stages of the outcome model are separately identified. When $R_t$ is unobserved — for instance, for a watch haptic that cannot register "opened" — the model marginalises over it, and identification of the split rests on the receptivity features and on decision points where $R_t$ is observed.

**Feasibility versus volition.** The structural feasibility $\Phi_t(a)$ is computed from the calendar or from self-reported time windows (Equations 3.27 and Section 4.3.3), not learned from outcomes. Its separation from the volitional term is therefore imposed by design.

**Scale of barriers versus sensitivities.** In the linear predictor of Equation (3.3), each barrier enters as a product $\gamma_{ck}(d)\,b_{k,t}$. Without further constraints, a barrier that is "twice as intense" with sensitivities "half as large" would fit the outcome data equally well. The scale of each barrier is fixed by its *anchor*: for each barrier $k$, one evidence loading — the reference indicator — is fixed in magnitude, as is standard for the identification of latent factor models. For the self-report items, the loading $c_q$ of the item that targets barrier $k$ serves as reference ($|c_q| = 1$ on the rescaled item); in configurations without self-report, the strongest passive indicator of Table 3.15 takes this role, and in profile P0 the prior on the baseline $\mu_k$ and volatility $s_k$ fixes the scale. With the scale fixed, the barrier sensitivities are interpretable as the logit reduction caused by a barrier at its reference intensity.

### 4.5.2 Which Proposals Are Informative

The information that a single outcome provides about a parameter of the logistic model is proportional to $\tilde\pi_a(1 - \tilde\pi_a)$ times the squared derivative of the linear predictor with respect to that parameter. Two consequences follow. First, proposals with execution probabilities near one half are the most informative, while near-certain successes and near-certain failures teach little. This creates a tension with the execution floor $p_{\min}$, which excludes the most uncertain proposals from below; Section 4.7 shows how Thompson sampling resolves this tension within the admissible set. Second, the information about the dose-interaction parameters $\gamma^{(1)}_{ck}$ is proportional to the variance of $g_{ck}(d)\,b_{k,t}$ across the proposals made — that is, to the *joint* variation of doses and barrier states. An engine that always proposes the same dose, or that always scales down to the same level on bad days, never learns how this person's sensitivity to a barrier changes with dose. The variation in doses that arises from the Smallest Step Strategy across good and bad days, combined with the exploration of Thompson sampling, is what makes these parameters learnable.

### 4.5.3 Spontaneous Behaviour and Crowding-Out

Chapter 3 assumed that proposals do not reduce behaviour the person would have performed spontaneously (assumption A3). This assumption is convenient but false in general, and it becomes increasingly false as the engine succeeds: the whole point of habit formation is that the behaviour eventually happens without prompts. An engine that does not model spontaneous behaviour will credit itself with walks that would have happened anyway, and it will keep prompting long after prompts have stopped adding value.

The spontaneous-behaviour model specifies the probability that the focal behaviour $c^\star$ is performed within the execution window of decision point $t$ *without* a prompt, at a typical spontaneous dose $d^{\text{sp}}$ with benefit $B^{\text{sp}}_t$:

$$
\pi^{\text{sp}}_t(a_\varnothing) \;=\; \sigma\Big(\alpha^{\text{sp}}_u + \mathbf{c}^{\text{sp}\top}\mathbf{f}(\text{time}_t) + \zeta^{\text{sp}}_h\,h_{c^\star,t} - \sum_k \gamma^{\text{sp}}_k\,b_{k,t}\Big).
\tag{4.18}
$$

Habit strength enters with a positive coefficient $\zeta^{\text{sp}}_h$: this is the defining property of a habit, a behaviour that is triggered by its context rather than by deliberate intention or external prompts (Wood & Neal, 2007). The model is learned from sensor-detected bouts outside the execution windows of proposals, and from bouts within windows of decision points at which the engine chose the null action.

A proposal can change the probability of spontaneous behaviour. Two mechanisms are distinguished by a crowding-out factor $\varpi(a) \in [0, 1]$, with $\pi^{\text{sp}}_t(a) = \big(1 - \varpi(a)\big)\,\pi^{\text{sp}}_t(a_\varnothing)$:

- **Anchoring down.** A downward proposal of the focal behaviour whose dose is below the person's typical spontaneous dose ($\tau_{c^\star}(d) < \tau_{c^\star}(d^{\text{sp}})$) may replace a longer spontaneous session by the shorter proposed one. The factor $\varpi^{\downarrow}$ captures this.
- **Licensing.** A lateral proposal may reduce the perceived need to perform the focal behaviour (Section 3.3.7). The factor $\varpi^{\rightarrow}$ captures this.

Assuming that a prompted execution of the focal behaviour replaces any spontaneous one within the same window, the *incremental* expected gain of a focal proposal relative to the null action is

$$
\Delta\mathrm{EHG}_t(a) \;=\; P_t(a)\Big[\tilde B_t(a) - \big(1 - \varpi^{\downarrow}(a)\big)\,\pi^{\text{sp}}_t(a_\varnothing)\,B^{\text{sp}}_t\Big] \;-\; \varpi^{\downarrow}(a)\,\pi^{\text{sp}}_t(a_\varnothing)\,B^{\text{sp}}_t \;-\; \rho_t\,\ell_t \;-\; \kappa_t,
\tag{4.19}
$$

and for a lateral proposal, whose execution does not replace the focal behaviour,

$$
\Delta\mathrm{EHG}_t(a) \;=\; \mathrm{EHG}_t(a) \;-\; \varpi^{\rightarrow}\,\pi^{\text{sp}}_t(a_\varnothing)\,B^{\text{sp}}_t.
\tag{4.20}
$$

Three properties of these expressions are important. First, they reduce to Equation (3.10) when $\pi^{\text{sp}} = 0$, so the framework of Chapter 3 is the special case of a person who never performs the behaviour unprompted. Second, Equation (4.20) gives the licensing penalty $\varsigma_t$ of Equation (3.17) a generative interpretation: $\varsigma_t = \varpi^{\rightarrow}\,\pi^{\text{sp}}_t(a_\varnothing)\,B^{\text{sp}}_t$ (expressed per unit of execution probability), i.e. the expected value of the focal behaviour that the lateral proposal displaces. It is largest precisely when the person would probably have performed the focal behaviour anyway. Third, as habit strength grows, $\pi^{\text{sp}}$ rises and the incremental value of focal prompts falls. The engine therefore *fades* its prompts as the habit consolidates, without any separate rule — a property that Section 4.8 develops into an operational criterion for "change that sticks".

The crowding-out factors are identifiable only from contrasts between decision points with and without a proposal in comparable states, which is exactly what the clipped randomisation of Thompson sampling provides (Section 4.7). Their priors are centred on small values ($\varpi \approx 0.1$) with wide uncertainty, in line with the small average size of licensing effects (Blanken et al., 2015).

## 4.6 The Smallest Step Strategy

The Smallest Step Strategy (SSS) is the operational answer to the question posed at the outset of this thesis: *when the probability that a proposed action will be executed is too low, how should the engine scale it down?* Chapter 3 established its theoretical basis — the optimal dose is non-increasing in every barrier (Proposition 3.2), and lateral steps extend the strategy below the floor of the ladder (Section 3.3.7). This section specifies the algorithm. It has two components: a *floor rule*, which determines how far the ladder must be descended for an action to be acceptably likely to succeed, and an *optimisation rule*, which determines whether to descend further, step sideways, or not to intervene at all.

### 4.6.1 The Floor Rule: How Far Down Must the Engine Go?

Consider the focal class $c^\star$ and a proposal of dose $g = g_{c^\star}(d)$ whose current conditional execution probability $\tilde\pi_0$ falls below the floor $p_{\min}$. Because the linear predictor of Equation (3.3) is linear in the difficulty — with slope $-(\delta_c + \sum_k \gamma^{(1)}_{ck}\,b_{k,t}\,\partial g_{ck}/\partial g)$ — the reduction in difficulty needed to reach the floor has a closed form:

$$
\Delta g^{\text{req}}_t \;=\; \frac{\operatorname{logit}(p_{\min}) - \operatorname{logit}(\tilde\pi_0)}{\delta_{c} + \sum_{k} \gamma^{(1)}_{ck}\, b_{k,t}\, \dfrac{\partial g_{ck}}{\partial g}}.
\tag{4.21}
$$

For a single dose dimension with $g = \log(1 + \tau/\tau^0)$, the corresponding physical dose is

$$
\tau^{\text{floor}}_t \;=\; \tau^0\Big[\big(1 + \tau_0/\tau^0\big)\,e^{-\Delta g^{\text{req}}_t} - 1\Big],
\tag{4.22}
$$

that is, the dose shrinks *multiplicatively* in units of $(1 + \tau/\tau^0)$, by the factor $e^{-\Delta g^{\text{req}}}$. Equation (4.21) states the scaling law of the SSS in one line: **the required reduction in difficulty equals the execution deficit on the log-odds scale divided by the person's current marginal sensitivity to difficulty**. The denominator grows with the barrier load, through the dose-interaction terms; on a bad day, each unit of difficulty removed therefore buys more probability, and a moderate reduction can suffice even for a large deficit.

*Example.* On the bad day of Table 3.4, the 30-minute walk has $\tilde\pi_0 = 0.060$. With $p_{\min} = 0.5$, the deficit is $\operatorname{logit}(0.5) - \operatorname{logit}(0.06) = 2.75$. The marginal sensitivity is $\delta + \sum_k \gamma^{(1)}_k b_k = 0.8 + 0.8 \cdot 0.7 + 1.0 \cdot 0.6 + 0.3 \cdot 0.3 = 2.05$, so $\Delta g^{\text{req}} = 1.34$. Equation (4.22) gives $\tau^{\text{floor}} = 5\,[7\,e^{-1.34} - 1] \approx 4.2$ minutes. The 5-minute ladder level ($\tilde\pi = 0.45$) lies just above this threshold and is excluded; the 2-minute level ($\tilde\pi = 0.63$) is the largest admissible dose. On the good day of the same table, all levels up to 20 minutes satisfy the floor.

Because $\tilde\pi$ is decreasing in dose for every particle, the floor constraint defines an *upper bound* on the admissible dose. Under posterior uncertainty, the bound is obtained from the chance constraint of Equation (3.30):

$$
d^{\text{floor}}_t(c) \;=\; \max\Big\{ d \;:\; \sum_{s=1}^{N} w^{(s)}_t\,\mathbb{1}\big[\Phi_t(c,d)\,\tilde\pi^{(s)}_{(c,d)} \geq p_{\min}\big] \;\geq\; 1 - \varepsilon_p \Big\},
\tag{4.23}
$$

with $d^{\text{floor}}_t(c) = 0$ if not even the lowest level is admissible. The closed form of Equation (4.21) is not needed to compute Equation (4.23) — the ladder has at most six levels and can be scanned directly — but it explains the behaviour of the rule and is used to generate the plain-language rationale of the proposal ("today's step is smaller because …").

**Choice of $p_{\min}$ and $\varepsilon_p$.** The floor is a robustness guard rather than the primary mechanism: within the admissible set, the EHG already weighs the cost of failure through $\ell_t$. The floor protects against misspecification of that cost and against the cumulative effect of repeated failures on trust and engagement, which a one-step objective captures only partially. The reference values are $p_{\min} = 0.5$ — the engine does not propose what it believes is more likely to fail than to succeed once attended to — and $\varepsilon_p = 0.2$. Both are design parameters whose effect on cumulative benefit and engagement is analysed in the simulation study (Chapter 5).

### 4.6.2 The Optimisation Rule: Downward, Lateral or Nothing

The floor determines how far down the engine *must* go; the Expected Health Gain determines what it *should* do within the admissible set. The complete strategy is given as Algorithm 4.1.

**Algorithm 4.1.** Smallest Step Strategy (two-dimensional: ladder × portfolio).

```text
input:  particle posterior {(u^(s), v^(s), θ^(s), w^(s))}, admissible set A_safe (without p_min filter),
        focal class c*, focus constraint state, p_min, ε_p, demonstrated levels d_dem
output: candidate set A_cand with per-particle incremental gains ΔEHG^(s)(a)

1  A_cand ← { a_∅ }
2  for each class c with at least one level in A_safe:
3      d_floor(c) ← largest d satisfying the chance constraint (Eq. 4.23)
4      if d_floor(c) = 0: continue                                  # class infeasible today
5      for d = 1 .. min(d_floor(c), d_dem(c) + 1):                     # progression cap (Eq. 4.27)
6          compute ΔEHG^(s)(c,d) for all particles s                # Eqs. 4.19 / 4.20 with 3.17
7          add (c,d) to A_cand
8  if focus constraint (Eq. 3.19) is binding today:
9      remove all lateral candidates from A_cand
10 for each preparatory / informational action a in A_safe:          # Section 3.5.4, Eqs. 3.24 / 3.25
11     compute ΔEHG^(s)(a); add a to A_cand
12 return A_cand
```

The selection among candidates — by posterior-mean maximisation in the analytical idealisation, by Thompson sampling in deployment (Section 4.7) — then realises the qualitative behaviour derived in Chapter 3:

- **On good days**, the floor is high on the ladder, and the EHG selects a substantial dose, typically below the ceiling because of the concavity of the benefit (Table 3.4, good day).
- **On difficult days**, the floor descends, and the EHG often selects a dose at or below it: the *downward step*. The habit term keeps the effective benefit of small doses positive, so the engine prefers a tiny step to silence (Table 3.4, bad day).
- **When a lateral action addresses the dominant barrier**, it can outperform the downward step: the *lateral step* (Table 3.5).
- **When even the lowest level of every class fails the floor**, or when receptivity is below the threshold of Proposition 3.3, the engine either stays silent, proposes a preparatory action (e.g. planning tomorrow), or — at the daily touchpoint — offers the plan with an explicit fallback for later.

### 4.6.3 Properties

Three properties of the algorithm deserve emphasis.

**Monotonicity is a result, not an assumption.** The algorithm scans all admissible levels and does not presuppose that the optimal dose decreases with barriers. Proposition 3.2 guarantees this under the plug-in approximation; under the full posterior, with correlated receptivity and barriers, small violations are possible, and the algorithm simply follows the expected gain. In the simulation study, the empirical relation between inferred barrier load and chosen dose provides a direct check of the proposition (Chapter 5).

**Scaling is asymmetric.** The floor rule reacts immediately to an increase in barriers: if today is harder, the admissible ladder shrinks today. Upward movement, by contrast, is subject to the progression rule of Section 4.8, which permits at most one new level above the person's demonstrated maximum per consolidation period. This asymmetry — easy to step down, earned to step up — implements the logic of graded tasks (BCT 8.7) and protects against the self-efficacy costs of overreach.

**Everything is reported in behavioural terms.** Each candidate retains its class, its ladder level and its BCT annotation. Downward and lateral steps are logged as such, together with the barrier attribution that motivated them, which allows their effects to be estimated as causal excursion effects (Sections 3.3.7 and 5.7).

## 4.7 Exploration under Uncertainty: Thompson Sampling over EHG

If the engine always selected the action with the highest posterior-mean EHG, it would exploit its current beliefs and never test them. Early in the relationship with a user, when the posterior is dominated by the population prior, it would propose the same kinds of actions to everyone. It would never learn that a particular person responds unusually well to evening walks, that their sensitivity to time pressure is weaker than average, or that slow breathing does nothing for their stress. Section 4.5.2 showed that the parameters most important to the Smallest Step Strategy — the dose-interaction sensitivities $\gamma^{(1)}_{ck}$ and the crowding-out factors $\varpi$ — are learnable only if doses and actions vary across comparable states. The engine therefore needs a principled exploration strategy. It uses Thompson sampling (Section 2.9.2), adapted to the structured EHG objective, to the particle representation, and to the requirements of causal analysability.

### 4.7.1 Posterior Sampling over Particles

Each particle $s$ carries a complete hypothesis about the person and their current state: barrier logits, receptivity residual and parameters. Thompson sampling selects the action that would be optimal if one of these hypotheses, drawn according to its posterior probability, were true:

$$
s^\ast \sim \operatorname{Categorical}\big(w^{(1)}_t, \dots, w^{(N)}_t\big),
\qquad
a_t \;=\; \arg\max_{a \in \mathcal{A}^{\text{cand}}_t}\; \Delta\mathrm{EHG}^{(s^\ast)}_t(a),
\tag{4.24}
$$

where $\mathcal{A}^{\text{cand}}_t$ is the candidate set produced by Algorithm 4.1. The implied probability of selecting action $a$ is the posterior probability that $a$ is optimal,

$$
q_t(a) \;=\; \sum_{s=1}^{N} w^{(s)}_t\;\mathbb{1}\Big[a = \arg\max_{a' \in \mathcal{A}^{\text{cand}}_t} \Delta\mathrm{EHG}^{(s)}_t(a')\Big],
\tag{4.25}
$$

which is computed from the same per-particle gains and logged at every decision point (Section 3.7.5). Two aspects of this construction matter. First, because parameters are part of the particles, exploration operates over *who the person is*, not only over *how the person is today*: a dose is tried when there is substantial posterior probability that, for this person, it is the best one. Second, the safety layer and the floor rule are applied *before* sampling, using posterior summaries rather than the sampled particle. The engine explores only within the set of actions that are safe and acceptably likely to succeed under the full posterior; Thompson sampling never licenses a risky proposal because an optimistic particle happened to be drawn.

### 4.7.2 Probability Clipping for Causal Analysability

Thompson sampling can drive selection probabilities to zero or one. This is efficient for decision-making, but it destroys the *positivity* required to estimate causal excursion effects from the logged data (Section 2.8.2). Following the practice of deployed mHealth algorithms (Trella et al., 2025), the engine therefore clips the probabilities of the contrasts that are to remain estimable. Two contrasts are protected in the reference configuration.

1. **Prompt versus no prompt.** At every available decision point at which at least one non-null candidate exists, the total probability of prompting, $q_t(\neg a_\varnothing) = 1 - q_t(a_\varnothing)$, is clipped to $[\pi_{\text{lo}}, \pi_{\text{hi}}]$, with reference values $0.1$ and $0.9$. The engine first decides between prompting and silence with the clipped probability, and then selects among non-null candidates by Thompson sampling conditional on prompting.
2. **Downward versus lateral.** At decision points at which both a downward and a lateral candidate are admissible and the focus constraint is not binding, the conditional probability of the lateral step is clipped to $[0.2, 0.8]$. This keeps the comparison of Section 3.3.7 estimable in the logged data.

Clipping has a bounded cost. If $\Delta^{\max}_t$ denotes the gap in expected gain between the best and the worst protected alternative, clipping costs at most $\pi_{\text{lo}}\,\Delta^{\max}_t$ per decision point in expectation relative to unclipped Thompson sampling. This is the explicit price of an engine whose data can be used to answer scientific questions, and it can be reduced after the research phase of a deployment.

### 4.7.3 Non-Stationarity

People change. Jobs, seasons, illnesses and life events alter barrier baselines and sensitivities. An exploration strategy that converges to certainty would eventually stop noticing. Three mechanisms keep the engine responsive. First, the barrier dynamics are themselves stochastic (Equation 3.20), so momentary states never become certain. Second, the forgetting factor $\upsilon$ in the nightly update (Equation 4.16) caps the precision of the parameter posterior, which maintains a minimum level of parameter uncertainty and therefore of exploration. Third, the engine monitors its own predictive performance. If the average predictive log-score of execution outcomes over a rolling week falls below its long-run level by more than a set margin, the parameter covariance is inflated by a constant factor, $\mathbf{S}_u \leftarrow \kappa_{\text{reset}}\mathbf{S}_u$. This is a simple form of change detection that re-opens exploration when the person has evidently changed.

### 4.7.4 The Delivery Bandit

The delivery decision — channel and framing — is made conditional on the behavioural decision (Section 3.5.5). Its target is engagement $R_t$, and its context is coarse: the dominant barrier under the posterior (fatigue, load, time or other) and the time of day (morning, midday, evening). For each template $m$ and context cell $\kappa$, the engagement probability is given a Beta prior whose parameters come from the population, and it is updated by conjugate counting:

$$
\theta^{\text{eng}}_{m\kappa} \sim \operatorname{Beta}\big(a^{\text{pop}}_{m\kappa} + n^{+}_{m\kappa},\; b^{\text{pop}}_{m\kappa} + n^{-}_{m\kappa}\big),
\qquad
m_t = \arg\max_{m \in \mathcal{M}^{\text{admissible}}(a_t, \kappa_t)} \tilde\theta^{\text{eng}}_{m\kappa_t},
\tag{4.26}
$$

where $n^{\pm}$ are the person's engaged and non-engaged counts and $\tilde\theta$ is a posterior draw. The admissible template set excludes, by construction, framings that are prohibited in the current state (Section 3.7.2), including any message that refers to a streak being at risk (Section 3.8.3). Where a user owns the ambient cue device of Section 3.8.4, it is an additional channel in the same bandit, with its own engagement counts.

### 4.7.5 Guarantees and Their Limits

For linear and generalised linear contextual bandits with exact posteriors, Thompson sampling enjoys regret bounds that are near-optimal up to logarithmic factors (Agrawal & Goyal, 2013; Russo & Van Roy, 2014). The setting of this thesis departs from those assumptions in three ways. The context is latent rather than observed. The posterior is approximated by particles and a nightly Laplace step. And the objective includes value-shaped terms for delayed effects. No formal regret bound is therefore claimed. The justification for the design is instead threefold: the theoretical properties of Thompson sampling in the idealised setting, its empirical robustness in deployed mHealth systems (Liao et al., 2020; Trella et al., 2025), and the simulation evidence presented in Chapter 5, where regret can be measured against an oracle that knows the true parameters and states.

## 4.8 Progression, Habit Consolidation and Dose Re-escalation

The Smallest Step Strategy describes how the engine retreats on difficult days. The thesis objective — to learn the person *until change sticks* — requires the opposite movement as well: progression towards meaningful doses as the behaviour strengthens, and eventually withdrawal of support once the behaviour sustains itself. This section shows that re-escalation largely emerges from the model, adds an explicit progression rule as a safeguard, calibrates the marginal values that govern the long-term terms of the benefit, and defines an operational criterion for "change that sticks".

### 4.8.1 Endogenous Re-escalation

As habit strength $h_{c,t}$ and self-efficacy $e_t$ grow, they raise the linear predictor of the execution model through $\zeta_h h_{c,t}$ and $\zeta_e e_t$. Their effect on the optimal dose follows from the same argument as Proposition 3.2.

**Corollary 4.1 (Re-escalation).** Under the conditions of Proposition 3.1, the optimal dose $g^\ast$ is non-decreasing in any additive shift $z_0$ of the linear predictor of Equation (3.3), and in particular in habit strength and self-efficacy.

*Proof.* With $\partial \log\tilde\pi/\partial g = (1 - \tilde\pi)\,\partial z/\partial g$ and $\partial\tilde\pi/\partial z_0 = \tilde\pi(1 - \tilde\pi)$, we obtain $\partial^2 \log\tilde\pi/\partial g\,\partial z_0 = -\tilde\pi(1 - \tilde\pi)\,\partial z/\partial g \geq 0$, because $\partial z/\partial g \leq 0$. Hence $\log f$ has increasing differences in $(g, z_0)$, and Topkis' theorem gives the claim. $\square$

Progression is therefore not a separate mechanism bolted onto the engine. It is the Smallest Step Strategy running in reverse as the person's capacity grows. The same arithmetic that shrinks the step on a bad day enlarges it as the habit consolidates.

### 4.8.2 The Progression Rule

Endogenous re-escalation responds to the engine's *estimates* of habit strength and self-efficacy. If these estimates are optimistic — for example because of a few unusually good days — the engine could jump several ladder levels at once, risking failure at a dose the person has never managed. The progression rule caps upward movement by demonstrated performance. Let the *demonstrated level* $d^{\text{dem}}_{c,t}$ be the highest ladder level of class $c$ that the person has executed at least $n_{\text{cons}}$ times within the past $W_{\text{cons}}$ days (reference values: three times in fourteen days). The admissible doses are then bounded by

$$
d \;\leq\; \min\big\{ d^{\text{floor}}_t(c),\; d^{\text{dem}}_{c,t} + 1 \big\},
\tag{4.27}
$$

which is applied in line 5 of Algorithm 4.1. The engine may propose the next level above what the person has demonstrated, but not beyond it, and it may always propose anything below. Because $d^{\text{dem}}$ is computed over a sliding window, it falls automatically after long interruptions such as illness or holidays. The person re-enters at a level they have recently managed rather than at their previous peak. The rule implements the classical structure of graded tasks — "easy-to-perform tasks, made increasingly difficult, but achievable" (BCT 8.7; Michie et al., 2013) — and gives the asymmetry noted in Section 4.6.3 a precise form.

### 4.8.3 Calibration of the Marginal Values

The benefit terms $\nu_h\Delta h$, $\nu_e\Delta e^+$ and $\nu_m\Delta m$ (Equation 3.17) approximate the long-run value of strengthening habit, self-efficacy and the meta-habit within a one-step decision rule (assumption A4). Their marginal values can be approximated in closed form from the model. Consider habit. An increment $\Delta h$ raises the linear predictor of future focal proposals by $\zeta_h\Delta h$. To first order, this raises their execution probability by $\bar\pi(1 - \bar\pi)\,\zeta_h\Delta h$ and their expected gain by $\bar\rho\,\bar\pi(1 - \bar\pi)\,\zeta_h\,\overline{\tilde B}\,\Delta h$ per proposal, where bars denote typical values. The increment persists, decaying by the factor $(1 - \epsilon_h(1 - \bar\pi))$ per day through missed opportunities. With $\bar n$ focal proposals per day and a daily discount factor $\upsilon_d$, summing the discounted future effects gives

$$
\nu_h \;\approx\; \zeta_h\,\bar\rho\,\bar\pi(1 - \bar\pi)\,\overline{\tilde B}\,\bar n\;\frac{q_h}{1 - q_h},
\qquad q_h = \upsilon_d\,\big(1 - \epsilon_h(1 - \bar\pi)\big).
\tag{4.28}
$$

With the reference values $\zeta_h = 1.5$, $\bar\rho = 0.6$, $\bar\pi = 0.5$, $\overline{\tilde B} = 0.5$, $\bar n = 1$, $\upsilon_d = 0.95$ and $\epsilon_h = 0.02$, Equation (4.28) gives $q_h \approx 0.94$ and $\nu_h \approx 1.8$. This is close to the value $\nu_h = 2$ used in the worked examples of Chapter 3. The analogous approximation for self-efficacy uses $\zeta_e$, no decay, and the number of proposals across all classes, since self-efficacy is not class-specific. For the meta-habit, the learned transfer coefficient $\zeta_m$ is complemented by the intrinsic value the user places on daily self-care, which is elicited as a goal weight (Section 3.4.1). As long as $\zeta_m$ is near its prior of zero, the meta-habit's value is therefore whatever the user says it is.

Equation (4.28) is used to initialise the marginal values and to recompute them nightly from the person's current estimates. A global multiplier on each marginal value is then tuned by policy search in the simulation environment: the multiplier is chosen to maximise cumulative realised benefit over a simulated horizon of several months (Chapter 5). This two-stage calibration — analytical structure, simulated fine-tuning — keeps the values interpretable while correcting for the first-order approximations behind Equation (4.28).

### 4.8.4 Fading and the Criterion for "Change That Sticks"

The engine's long-term goal is to make itself unnecessary for the focal behaviour. Section 4.5.3 showed that this happens naturally: as the habit strengthens, spontaneous behaviour increases, and the incremental gain of focal prompts (Equation 4.19) falls. The engine prompts less because its prompts add less. To make this transition explicit and communicable, the engine declares the focal behaviour *consolidated* when three conditions hold jointly over a window of $W_{\text{stick}}$ days (reference: 21 days):

1. the posterior mean of habit strength exceeds the consolidation threshold, $\mathbb{E}[h_{c^\star}] \geq \bar h$;
2. the spontaneous execution rate, $\frac{1}{W}\sum \pi^{\text{sp}}_t(a_\varnothing)$, exceeds a threshold $\bar\pi^{\text{sp}}$, i.e. the behaviour mostly happens without prompts;
3. the incremental gain of scheduled focal prompts is below the prompt burden at most decision points, i.e. prompting has become unnecessary.

When the behaviour is consolidated, the engine enters a **maintenance mode** for that behaviour. Scheduled focal prompts stop, and the ambient cue device, if present, stays dark unless the day's proposal deviates from routine (Section 3.8.4). The focus constraint (Equation 3.19) is lifted. A Bayesian change detector monitors the spontaneous rate for lapses. The engine also invites the user — never decides for them — to choose a new focal behaviour, which starts its own ladder at the floor. If a lapse is detected, for example a sustained drop of spontaneous behaviour after a holiday, focal prompting resumes at the demonstrated level of Equation (4.27). This lifecycle — *scale down when hard, scale up as capacity grows, fade out when the behaviour sustains itself, step back in after lapses* — is the algorithmic form of the thesis's guiding phrase: to find the smallest step that still happens, and to learn the person until change sticks.

## 4.9 Complete Algorithm and Computational Complexity

This section assembles the components of Chapters 3 and 4 into the complete algorithm and analyses its cost against the latency requirement NFR8.

### 4.9.1 The Fast Loop

**Algorithm 4.2.** Fast loop, executed at each decision point $t$ of user $u$.

```text
input: particles {(u^(s), v^(s), θ^(s), w^(s))}_{s=1..N}, learning states ξ, action library, configuration C_u
 1  if I_t = 0: return                                              # availability (Sec. 3.4.5)
 2  for each particle s:                                            # PREDICT (Eq. 4.14)
 3      propagate u^(s), v^(s) over Δ_t with θ^(s), drivers w_t, expected effect of last executed action
 4  for each new observation o (passive, self-report, missingness, outcomes of earlier proposals):
 5      if event time within lag window:                            # UPDATE (Eq. 4.15), fixed-lag smoothing
 6          w^(s) ← w^(s) · p(o | stored state of particle s at event time, θ^(s))
 7  normalise w; if ESS < N/2: systematic resampling + Liu–West rejuvenation of θ
 8  compute ρ^(s), b^(s), Φ_t(a) for all particles and actions
 9  A_safe ← safety filter (availability, medical, frequency, focus)          # Eq. 3.30 without floor
10  A_cand ← SmallestStepStrategy(particles, A_safe, p_min, ε_p, d_dem)      # Algorithm 4.1, Eq. 4.27
11  compute q_t(a) for a ∈ A_cand                                    # Eq. 4.25
12  clip prompt-vs-null and downward-vs-lateral probabilities         # Section 4.7.2
13  draw a_t from clipped q_t                                         # Thompson sampling (Eq. 4.24)
14  log (t, x_t, posterior summary, q_t, clipped probabilities, a_t)
15  if a_t ≠ a_∅:
16      m_t ← delivery bandit(a_t, dominant barrier, time of day)    # Eq. 4.26
17      deliver(a_t, m_t, rationale from Eq. 4.21 and barrier attribution)
18      schedule outcome collection at end of execution window
```

### 4.9.2 The Slow Loops

**Algorithm 4.3.** Nightly loop.

```text
1  integrate late-arriving data beyond the lag window (smoothed trajectories)
2  update expected learning states ξ: habit (Eqs. 3.7, 3.14), self-efficacy (Eq. 3.8 with attribution
   scaling, Sec. 3.4.6), meta-habit (Eq. 3.15)
3  Laplace update of θ-posterior N(m_u, S_u) with forgetting υ (Eq. 4.16)
4  predictive-score monitor; inflate S_u if a change is detected (Sec. 4.7.3)
5  recompute personal baselines (Eq. 3.28), marginal values ν (Eqs. 3.16, 4.28),
   spontaneous-behaviour model (Eq. 4.18), demonstrated levels d_dem (Eq. 4.27)
6  check consolidation criteria (Sec. 4.8.4); switch focal behaviour to maintenance if met
7  draw N fresh parameter vectors θ^(s) ~ N(m_u, S_u) for the next day's particles
```

**Algorithm 4.4.** Weekly loop.

```text
1  export clipped, noised likelihood-only statistics (m̄_u, S̄_u, c_u)            # Sec. 4.2.5
2  receive updated population prior (μ_pop, B, Σ_pop); re-combine with local likelihood
3  report monitoring indicators (prompt rate, execution rate, lateral share, safety events)
```

### 4.9.3 Computational Complexity

Table 4.2 summarises the cost of each component for $N$ particles, $K$ barriers, $|\mathcal{A}|$ actions, $J$ evidence features and $P$ person parameters.

**Table 4.2.** Computational cost per invocation (reference values: $N = 1{,}000$, $K = 6$, $|\mathcal{A}| \approx 40$, $J \approx 20$, $P \approx 150$).

| Component | Cost | Reference operations |
|---|---|---|
| Prediction (Eq. 4.14) | $O(NK^2)$ | $\sim 4 \times 10^4$ |
| Update (Eq. 4.15) | $O(NJK)$ | $\sim 1 \times 10^5$ |
| Resampling, rejuvenation | $O(NP)$ (only when ESS is low) | $\sim 1.5 \times 10^5$ |
| EHG over candidates (Eq. 4.17) | $O(N\,|\mathcal{A}|\,K)$ | $\sim 2.4 \times 10^5$ |
| Selection probabilities, sampling (Eqs. 4.24–4.25) | $O(N\,|\mathcal{A}|)$ | $\sim 4 \times 10^4$ |
| Nightly Laplace update (Eq. 4.16), $N'$ smoothed trajectories, $n$ observations | $O(N' n P + P^3)$ per Newton step | $\sim 10^7$ for $N' = 100$, $n \approx 50$ |
| Memory for particles incl. parameters | $O(N(K + P))$ | $\sim 1.3$ MB in double precision |

The fast loop requires on the order of $10^5$–$10^6$ arithmetic operations per decision point. To verify feasibility, a vectorised reference implementation of the fast loop was benchmarked. It covers prediction, update with eight Gaussian evidence features, resampling, EHG evaluation for 40 actions across 1,000 particles, selection probabilities and Thompson sampling, and is provided as `simulation/bench_fast_loop.py`. It runs in 2–5 ms per decision point with NumPy on the two machines tested: a two-core cloud server and a laptop-class virtual machine. Even under a conservative assumption of a twenty-fold slowdown on a mid-range smartphone, the fast loop stays two orders of magnitude below the one-second latency budget of NFR8. The same benchmark confirms the Monte Carlo precision claimed in Section 4.4.5: the median standard error of the EHG estimates was about one thirteenth of the median difference between neighbouring ladder levels. The nightly update is more expensive but runs while the device is idle and charging, and it completes in well under a minute even with a naive implementation. The engine is therefore computationally suitable for fully on-device operation, as required by the privacy architecture of Section 3.7.3.

### 4.9.4 Summary of Chapter 4

The chapter has turned the architecture of Chapter 3 into a computable engine.

- **Inference.** The generative model (Equation 4.1) unifies all data sources and outcomes in one joint distribution. A hierarchical prior with federated population learning provides useful day-one behaviour and principled personalisation (Equations 4.3–4.6). Observation models with explicit attribution and missingness components turn every data point, including a missed proposal and a skipped check-in, into evidence (Equations 4.7–4.12). A particle filter with fixed-lag smoothing and a nightly Laplace update maintains the posterior at the required speed (Equations 4.13–4.17).
- **Decision.** The Smallest Step Strategy combines a closed-form floor rule (Equations 4.21–4.23) with EHG optimisation across ladders and domains, corrected for spontaneous behaviour and crowding-out (Equations 4.18–4.20). Thompson sampling over particles explores where the posterior is uncertain, while clipping preserves causal analysability (Equations 4.24–4.26).
- **Long-term behaviour.** Progression emerges from the model (Corollary 4.1), is bounded by demonstrated performance (Equation 4.27), and ends in a consolidation criterion that lets the engine fade its support as the behaviour becomes self-sustaining.

Whether this machinery delivers what hypotheses H0–H3 claim is the subject of Chapter 5.
