# Appendix A1: Engine Specification

Part of the [BUE PRD](PRD.md). This appendix is normative for the `engine-core` module. Notation follows the thesis (`../thesis/03_architecture.md`, `../thesis/04_algorithms_state_update.md`). Where the product deviates from the thesis or the simulator, this is marked **[PRODUCT]**.

**Reference implementation.** `../thesis/simulation/bue_sim.py` (class `BUE`, environment `Env`). It uses K = 4 barriers (fatigue, load, time, motivation), 4 decision points per day, walking (5 levels) and breathing (4 levels). The product uses K = 6 barriers; the two additional barriers (environment, social) must be switchable off so that the port can be run in "simulator-parity mode" with K = 4 (§10).

---

## 1. Scope of `engine-core`

`engine-core` is a pure, deterministic library with no platform dependencies. It

- ingests features and events (A2 §4) and maintains the posterior,
- answers decision requests for decision points,
- selects touchpoint items,
- runs the nightly update and the consolidation detector,
- produces structured explanations,
- serialises and restores its state.

It does **not** schedule notifications, read sensors, render text or talk to the network. Those are responsibilities of the app shell (A2 §6).

| ID | Requirement |
|---|---|
| ENG-1 | All randomness comes from an injected, seedable PRNG (e.g. PCG64 / xoshiro256**); the seed and PRNG state are part of the persisted engine state. |
| ENG-2 | Given the same initial state, configuration and event log, a replay yields identical decisions on the same platform (NFR-12). |
| ENG-3 | All numerical code works in log space where probabilities can underflow; logistic and log1p/expm1 are numerically stable. |
| ENG-4 | Every public function validates its inputs and never throws on missing data; it returns a typed error or a safe default decision (`NullAction` with reason). |
| ENG-5 | Configuration (priors, constants, action classes, flags) is loaded from versioned data (A2 §5); no constant in this appendix is hard-coded without a config key. |

## 2. Entities and Notation

| Symbol | Meaning | Type |
|---|---|---|
| $t$ | Decision point index (timestamped) | – |
| $c,\ d$ | Action class (walk, breathe, …) and ladder level | – |
| $a=(c,d)$, $a_\varnothing$ | Proposal; null action (no prompt) | – |
| $\tau_c(d)$ | Duration of level $d$ (minutes) | config |
| $g_c(d)=\log(1+\tau_c(d)/\tau^0_c)$ | Difficulty | derived |
| $\mathbf u_t\in\mathbb R^K,\ \mathbf b_t=\sigma(\mathbf u_t)$ | Barrier logits and barriers | L3 state |
| $v_t$ | Receptivity residual | L3 state |
| $\rho_t$ | Receptivity | derived |
| $\Phi_t(a)$ | Structural feasibility (time window exists) | derived |
| $h_{c,t},\ e_t,\ m_t$ | Habit strength (per class), self-efficacy, meta-habit | L2 state |
| $\boldsymbol\theta_u$ | Person parameters (propensities, sensitivities, baselines, loadings, efficacies) | L1 |
| $\boldsymbol\iota_u$ | Structural barriers (elicited) | L1 |
| $\mathbf n_u,\ \mathbf m_c$ | Motive profile, incentive profile (Phase 2) | L1 / config |
| $Y_t,\ Y^{\text{sp}}_t,\ R_t$ | Execution, spontaneous execution, engagement | outcome |

Barrier order (index $k$): `fatigue, load, time, environment, social, motivation`. **[PRODUCT]** The simulator uses `fatigue, load, time, motivation`.

## 3. Decision Objective

### 3.1 Execution probability

$$
P_t(a)=\mathbb E\big[\rho_t\,\pi_a\big],\qquad \pi_a=\Phi_t(a)\,\tilde\pi_a(\mathbf b_t;\boldsymbol\theta)
$$

$$
\tilde\pi_{(c,d)}=\sigma\Big(\alpha_u+\beta_c-\delta_c\,g_c(d)+\zeta_e e_t+\zeta_h h_{c,t}-\sum_k\gamma_{ck}(d)\,b_{k,t}\Big),\qquad \gamma_{ck}(d)=\gamma^{(0)}_{ck}+\gamma^{(1)}_{ck}\,g_c(d)
$$

with $\gamma^{(0)},\gamma^{(1)}\ge 0$ (log-normal parameterisation). Lateral classes have no habit term in the MVP ($\zeta_h=0$).

Feasibility from the calendar (or from the touchpoint time-window answer):

$$
\Phi_t(a)=\max_w F_U\big(W^{\text{nom}}_w-\tau_c(d)\big),
$$

where $W^{\text{nom}}_w$ are the nominal free windows overlapping the decision window and $F_U$ is the CDF of unscheduled demand (default Gamma(shape 2, scale 2.5 min), learnable). Without calendar or answer, $\Phi$ is integrated over the prior of free time for that anchor and day type.

### 3.2 Benefit

$$
\bar B_t(a)=w_c\big(1-e^{-\lambda_c\tau_c(d)}\big)+\nu_h\,\Delta h_{c,t}+\nu_e\,\alpha_e^{+}\,\frac{g_c(d)}{g_c(D_c)}(1-e_t)\;[+\ \nu_m\Delta m_t+\textstyle\sum_k\nu_{b}\,\eta_{ck}b_{k,t}\ \text{for lateral classes}]
$$

$$
\Delta h=\alpha_h\chi_t(1-h)+\epsilon_h h\qquad(\chi_t=1\text{ if this would be the first execution of the day})
$$

Failure cost after an engaged miss: $\ell_t=\nu_e\,\alpha_e^{-}\,e_t\,s^{\text{int}}_t$, where $s^{\text{int}}_t$ is the posterior share of *internal* barriers (fatigue, load, motivation) in explaining a miss (§4.3). Prompt burden: $\kappa_t=\kappa_0(1+\psi\,n^{\text{today}}_t)$.

### 3.3 Expected health gain

$$
\mathrm{EHG}_t(a)=P_t(a)\,\tilde B_t(a)-\rho_t\ell_t-\kappa_t,\qquad\tilde B_t=\bar B_t+\ell_t
$$

and the **incremental** gain used for selection, accounting for spontaneous behaviour and crowding-out:

$$
\Delta\mathrm{EHG}_t(a)=P_t(a)\big[\tilde B_t(a)-(1-\varpi)\pi^{\text{sp}}_tB^{\text{sp}}_t\big]-\varpi\,\pi^{\text{sp}}_tB^{\text{sp}}_t-\rho_t\ell_t-\kappa_t,
$$

with $\varpi=\varpi^{\downarrow}$ for focal doses below the typical spontaneous dose, $\varpi=\varpi^{\rightarrow}$ for lateral steps, $0$ otherwise, and

$$
\pi^{\text{sp}}_t=\sigma\Big(\alpha^{\text{sp}}_u+\zeta^{\text{sp}}_h h_{c^\star,t}-\sum_k\gamma^{(0)}_{c^\star k}b_{k,t}\Big).
$$

$\Delta\mathrm{EHG}(a_\varnothing)=0$. All expectations are evaluated **per particle** and averaged with the particle weights; never plug in posterior means.

### 3.4 Properties that must hold (property tests, §10.2)

- **P1 (monotone smallest step).** For fixed particle and class, the argmax dose is non-increasing in each $b_k$.
- **P2 (whether vs. how much).** Scaling $\rho$ does not change the argmax dose among proposals; a proposal is preferred to $a_\varnothing$ iff $\rho>\kappa/(\max_d\pi\tilde B-\ell)$ (with $\varpi=0$, $\pi^{\text{sp}}=0$).
- **P3 (re-escalation).** The argmax dose is non-decreasing in $h$ and $e$.

## 4. Person Model

### 4.1 Barrier dynamics

Barriers evolve on the logit scale as Ornstein–Uhlenbeck processes between decision points separated by $\Delta_t$ hours:

$$
u_{k,t}=\mu_{k,t}+e^{-\Delta_t/T_k}\big(u_{k,t-1}-\mu_{k,t-1}\big)-\eta_{c_{t-1}k}Y_{t-1}+s_k\sqrt{1-e^{-2\Delta_t/T_k}}\;\varepsilon_{k,t}
$$

Baseline $\mu_{k,t}=\mu^0_k+\text{drivers}_{k,t}+\text{circadian/weekly profile}_{k}(t)+\text{structural shift}_k(\boldsymbol\iota_u)$.

| Barrier | $T_k$ | Stationary sd $s_k$ (logit) | Drivers (default coefficients) | Status |
|---|---|---|---|---|
| fatigue | 24 h | 0.6 | sleep duration: −0.7 per hour above 7 h | simulator |
| load | 3 h | 0.8 | meeting density $m$: +1.2·(m − 0.5); afternoon slot +0.3 | simulator |
| time | 24 h | 0.5 | meeting density: +2.5·(m − 0.4) | simulator |
| environment | 6 h | 0.6 | precipitation, heat index, darkness at the anchor time | **[PRODUCT]** elicit priors |
| social | 2 h | 0.6 | attendee count / social event type overlapping the window | **[PRODUCT]** elicit priors |
| motivation | 72 h | 0.4 | – (evidence only) | simulator |

The filter inflates innovation sd by a factor 1.2 relative to the generative value (as in the simulator) to remain robust to misspecification.

### 4.2 Receptivity

$$
\operatorname{logit}\rho_t=r_{0,u}+\boldsymbol\theta_\rho^\top\boldsymbol\varphi(\mathbf x_t)-\vartheta\,b^{\text{load}}_t+v_t,\qquad v_t\ \text{OU with }T=2\text{ h, sd }0.7
$$

Context features $\boldsymbol\varphi$: anchor/slot one-hot, weekday/weekend, minutes since last phone interaction (Android: screen-on state), ongoing calendar event (0/1), recent activity transition (Android), notification response latency history. Default $\vartheta=0.8$.

### 4.3 Learning states

- **Habit** (per class, daily): $h\leftarrow h+\alpha_h(1-h)$ on days with ≥ 1 execution of the class (prompted or spontaneous), else $h\leftarrow(1-\epsilon_h)h$. Defaults $\alpha_h=0.04$, $\epsilon_h=0.02$.
- **Self-efficacy** (per engaged proposal): success $e\leftarrow e+\alpha_e^{+}\frac{g}{g_{\max}}(1-e)$; engaged miss $e\leftarrow e-\alpha_e^{-}\,s^{\text{int}}\,e$. Defaults $\alpha^{\pm}_e=0.03$.
- **Meta-habit** (daily): as habit, triggered by any executed health step.
- Under uncertain execution (unverified, unconfirmed), updates use the posterior probability of execution (expected update).

### 4.4 Structural barriers [Phase 1 S, FR-6]

Each elicited structural barrier maps to prior shifts, defined in config, e.g.

| Structural barrier | Shift |
|---|---|
| Long or irregular commute | $\mu^0_{\text{time}}$ +0.5 on weekdays; $\Phi$ prior lower around commute times |
| Unsafe area for walking | $\gamma^{(0)}_{\text{walk,env}}$ ×1.5 for outdoor levels |
| Unsure how to start | $\alpha_u$ −0.3; ladder starts at level 1 |
| Evening decision fatigue | load sensitivity ×1.3 for evening anchors |
| Little social support | $\mu^0_{\text{social}}$ +0.3 |

### 4.5 Motive fit [Phase 2, flag `motive_fit`, default off]

$$
z_{uc,t}\mathrel{+}=\beta^{\text{fit}}f_{uc}-\lambda^{\text{inc}}(1-f_{uc})\,\gamma_{c,\text{load}}\,b^{\text{load}}_t,\qquad f_{uc}=\mathbf n_u^\top\mathbf m_c
$$

Priors $\beta^{\text{fit}}\sim$ half-normal centred at 0.3, $\lambda^{\text{inc}}$ at 0.2, both including 0. $\mathbf n_u$ is learned from post-execution affect ratings and choices among alternatives; it is **not** obtained from self-report questionnaires (those measure explicit, not implicit motives). Research-grade implicit-motive measurement is only used inside studies.

### 4.6 Population prior

Parameters are reparameterised to $\mathbb R$ (log for positive, logit for bounded). Prior $\tilde{\boldsymbol\theta}_u\sim\mathcal N(\boldsymbol\mu_{\text{pop}}+\mathbf B\mathbf c_u,\Sigma_{\text{pop}})$ with covariates $\mathbf c_u$ (age band, self-reported activity level, structural barriers, sensing profile). MVP: $\boldsymbol\mu_{\text{pop}},\Sigma_{\text{pop}}$ diagonal, shipped in config (values of `PRIOR_M`, `PRIOR_S` in the simulator, extended to K = 6). Phase 3: federated empirical Bayes update.

Key elicited priors (thesis Table 4.1):

| Parameter | Prior centre | Basis |
|---|---|---|
| Execution probability of an engaged median walking proposal | 0.5 (0.25–0.75) | HeartSteps; intention–behaviour gap |
| Barrier sensitivities, primary dimensions | 0.5–1.0, factor 3 | weakly informative |
| $\zeta_h$; $\zeta_e$ | 1.5; 1.0 | habit theory; social cognitive theory |
| $\alpha_h$ | 0.035–0.045 per repetition | Lally et al. (2010) |
| Breathing → load reduction $\eta$ | 0.3 (0.05–0.6) [simulator: log-normal around 0.8 with 30% non-responders] | breathing literature |
| Meta-habit transfer $\zeta_m$ | 0 (±0.5) | no direct evidence |

## 5. Inference

### 5.1 Particle filter

- $N=1000$ particles (config `pf.n`, min 300 on low-end devices). Each particle carries $(\mathbf u,v,\tilde{\boldsymbol\theta})$. Learning states $(h,e,m)$ are shared deterministic functions of the outcome history (expected updates).
- **Predict**: propagate $\mathbf u$ and $v$ over $\Delta_t$ (§4.1, §4.2).
- **Update**: multiply weights by the likelihood of all new observations (§5.2), in log space.
- **Resample**: systematic resampling when ESS < N/2; Liu–West rejuvenation of $\tilde{\boldsymbol\theta}$ with shrinkage $a=0.98$ using the weighted covariance (Cholesky with jitter $10^{-9}$).

### 5.2 Observation models

Each feature has exactly one role (A2 §4):

| Role | Use | Examples |
|---|---|---|
| Driver | Enters $\mu_{k,t}$; not a likelihood term | last night's sleep, meeting density today, weather forecast |
| Evidence | Likelihood $p(o\mid\mathbf u,\boldsymbol\theta)$ | nocturnal HRV deviation, resting HR deviation, daytime HRV, app-switching rate, touchpoint items |
| Context | Enters receptivity or feasibility | slot, phone state, calendar windows |
| Outcome | Likelihood of $R,Y,Y^{\text{sp}},\hat Y$ and "why not?" | engagement, verification, confirmation |

- **Passive evidence**: $o_j=\lambda_j^\top\mathbf u_t+\text{intercept}_j+\text{Student-}t_\nu(0,\sigma_j)$, $\nu=4$. Loadings have sign priors (e.g. HRV deviation loads negatively on fatigue and load). Physiological features are robust z-scores vs. a personal 28-day rolling median/MAD (minimum 7 days of data before use; until then the channel is treated as missing).
- **Touchpoint items** (energy, stress, time pressure, motivation, free time per period): ordinal 1–5 mapped to $[0,1]$ with Gaussian noise sd 0.15 and a person-specific intercept.
- **Outcomes**: engagement $R\sim\text{Bernoulli}(\rho)$ (observed via notification interaction or app open within 30 min); execution $Y\mid R=1\sim\text{Bernoulli}(\Phi\tilde\pi)$; verification $\hat Y\mid Y$ with class-specific sensitivity/specificity (defaults: sensor 0.9/0.95; confirmation 0.95/0.9); spontaneous $Y^{\text{sp}}\sim\text{Bernoulli}(\pi^{\text{sp}}(1-\varpi))$.
- **"Why not?" attribution**: $P(\text{named barrier}=k)=(1-\lambda_{\text{lapse}})\frac{\gamma_{ck}(d)b_k}{\sum_{k'}\gamma_{ck'}(d)b_{k'}}+\lambda_{\text{lapse}}/K$, $\lambda_{\text{lapse}}=0.1$; "no time" maps to time (and to $\Phi$ if the window was short).
- **Missingness**: indicator $M_{jt}\sim\text{Bernoulli}(\sigma(m_{0j}+\boldsymbol\lambda^M_j{}^\top\mathbf u_t))$ with learnable loadings, prior centred at 0.

The explaining-away gradient (thesis Eq. 4.4) is a consequence of these likelihoods, not separate code; it is checked by test T-EA (§10.2).

### 5.3 Late evidence

Outcomes and sensor data can arrive hours late (verification window, background delivery). The filter keeps a fixed-lag buffer of the last 24 h of particle ancestries; late evidence reweights the particles at the time it refers to and propagates forward (fixed-lag smoothing). Evidence older than the lag is applied in the nightly update only.

### 5.4 Nightly update

Once per night (or at next opportunity):

1. integrate late data; update learning states for the day;
2. Laplace step on $\tilde{\boldsymbol\theta}$ using the smoothed day with forgetting factor $\lambda_f=0.98$ per day; refresh particle parameters by sampling around the Laplace mode with the filter's ancestry weights;
3. recompute physiological baselines (28-day median/MAD);
4. recompute marginal values $\nu_h$ (§6.5);
5. run the consolidation detector (§8);
6. run the calibration monitor (§9).

## 6. Decision

### 6.1 Decision points and planning

A decision point has an id, an anchor, a time window $[t_s,t_e]$ (default 60 min) and a trigger type (`scheduled`, `contextual`). In **plan-ahead mode** (PRD FR-41) the app calls `planDay()` at the touchpoint (or first run of the day) and `replan()` whenever it runs; the engine returns, for each remaining decision window, a planned decision with a delivery time inside the window that maximises predicted receptivity. Randomisation is drawn at planning time; if a replan changes the decision, the new decision is a fresh, independently randomised decision and the superseded one is logged as `superseded`.

### 6.2 Safe set and Smallest Step Strategy

```text
Algorithm A1.1  Candidate set at decision point t
input: particles, safety state, config (p_min, ε_p, lateral_mode, focus_quota), d_dem
 1  if not available(t) or safety_block(t): return {a_∅}  (reason logged)
 2  A ← {a_∅}
 3  for each enabled class c:
 4      for each level d ≤ screening_cap(c):
 5          share(c,d) ← Σ_s w_s · 1[Φ_t(c,d) · π̃_s(c,d) ≥ p_min]
 6      d_floor(c) ← max{d : share(c,d) ≥ 1 − ε_p}     (none if no level qualifies)
 7      d_max(c) ← min(d_floor(c), d_dem(c) + 1)  if c is focal else d_floor(c)
 8      add (c, 1..d_max(c)) to A
 9  if lateral_mode = off: remove lateral candidates
10  if lateral_mode = below_floor and any focal level admissible: remove lateral candidates
11  if focus quota binding: remove lateral candidates
12  add informational / preparatory actions if their VOI exceeds burden (Phase 1: plan-tomorrow only)
13  return A
```

Defaults: $p_{\min}=0.5$, $\varepsilon_p=0.2$, `lateral_mode = below_floor`, focus quota = 4 focal proposals per week while $h_{c^\star}<0.6$. $d^{\text{dem}}$ = highest level executed in the last 14 days (level 1 if none); after a pause ≥ 14 days it decays by one level per week of absence to a minimum of 1.

**Closed-form floor (explanations and tests).** Because the linear predictor is linear in $g$:

$$
\Delta g^{\text{req}}_t=\frac{\operatorname{logit}p_{\min}-\operatorname{logit}\tilde\pi_0}{\delta_c+\sum_k\gamma^{(1)}_{ck}b_{k,t}},\qquad \tau^{\text{floor}}_t=\tau^0\big[(1+\tau_0/\tau^0)e^{-\Delta g^{\text{req}}_t}-1\big].
$$

Test vector: $\tilde\pi_0=0.06$ at $\tau_0=30$, $\tau^0=5$, marginal sensitivity 2.05, $p_{\min}=0.5$ → $\Delta g^{\text{req}}=1.34$, $\tau^{\text{floor}}\approx4.2$ min.

### 6.3 Selection by clipped Thompson sampling

1. Compute $\Delta\mathrm{EHG}^{(s)}(a)$ for all $a\in A$ and all particles $s$.
2. Selection probabilities $q(a)=\sum_s w_s\,\mathbb 1[a=\arg\max_{a'}\Delta\mathrm{EHG}^{(s)}(a')]$ (ties broken by smaller dose).
3. **Clip**: $q(\text{prompt})=\sum_{a\neq a_\varnothing}q(a)$ clipped to $[0.1,0.9]$; within prompts, if both downward and lateral candidates exist, $q(\text{lateral})$ clipped to $[0.2,0.8]$; renormalise within groups proportionally.
4. Draw $a_t\sim q$ with the engine PRNG; log $q$ (all candidates), the draw and the seed position.

Exception: when $A=\{a_\varnothing\}$ (safety, unavailability), no randomisation happens and $q(a_\varnothing)=1$ is logged with the reason.

### 6.4 Informational, preparatory and tactic actions

- **Touchpoint items** (Phase 1): from the item pool (A3 §3), greedily pick up to $n_{\max}$ items maximising value of information $\mathrm{VOI}=\mathbb E_o[\max_a\mathrm{EHG}(a\mid o)]-\max_a\mathrm{EHG}(a)$ summed over today's planned decision points, computed by simulating answers from the particles (≤ 50 particle subsamples per item). Items with VOI below burden $\kappa^{\text{item}}=0.005$ are dropped. The **free-time** item is always included for users without calendar until 14 days of data exist.
- **Plan tomorrow** (Phase 1): offered in the evening touchpoint when tomorrow's predicted feasibility for all anchors is low.
- **Structural tactics and deep check-ins** (Phase 2): triggered when the share of misses unexplained by the momentary model exceeds a threshold over 7 days; a conversation (optionally LLM-assisted) elicits structural barriers and proposes tactics from a curated library; the engine decides whether a tactic is proposed, and tactic effects are modelled as persistent prior shifts.

### 6.5 Value parameters

Defaults (simulator): $w_{\text{walk}}=1$, $\lambda_{\text{walk}}=0.07$/min, $\tau^0_{\text{walk}}=5$; breathing benefit $0.15(1-e^{-0.5\tau})$, $\tau^0_{\text{breathe}}=2$; $\nu_h=1.8$, $\nu_e=1.5$, $\nu_b=0.4$, $\ell_0=0.03$, $\kappa_0=0.02$, $\psi=0.5$, $\varpi^{\downarrow}=0.25$, $\varpi^{\rightarrow}=0.10$; spontaneous dose 15 min. $\nu_h$ is recomputed nightly as

$$
\nu_h\approx\zeta_h\,\bar\rho\,\bar\pi(1-\bar\pi)\,\overline{\tilde B}\,\bar n\,\frac{q_h}{1-q_h},\qquad q_h=\upsilon_d\big(1-\epsilon_h(1-\bar\pi)\big),
$$

and multiplied by the configured global multiplier (default 1.0).

## 7. Accumulated Health Gain

$$
G_t=\sum_{t'\le t}\Big[b^{\text{imm}}_{c_{t'}}(d_{t'})\,\hat Y_{t'}+B^{\text{sp}}_{t'}\hat Y^{\text{sp}}_{t'}\Big]
$$

using only the immediate-value term. $G_t$ is displayed on a scale where a 30-minute walk ≈ 10 points (display multiplier in config). $G_t$ never decreases; retracted confirmations (user undo within 24 h) are the only exception and are not shown as a loss. The **foundation** display maps $h_{c^\star}$ to five visual stages.

## 8. Fading and Maintenance

A focal behaviour is **consolidated** when, over the last 21 days, all hold: $h_{c^\star}\ge0.7$; spontaneous executions on ≥ 50% of days; and the mean incremental gain of focal prompts is below their burden. Then:

- maintenance mode: no scheduled proposals; the touchpoint becomes weekly (optional);
- a change detector (CUSUM on daily execution indicator) re-activates prompting after a sustained drop (≥ 7 days below 50% of the maintenance baseline), starting at $d^{\text{dem}}$;
- the user is invited (never pressured) to pick a new focus (Phase 3).

## 9. Monitoring and Fallback

| Monitor | Rule | Action |
|---|---|---|
| Calibration | Rolling 28-day calibration slope of $P_t$ vs. outcomes outside [0.6, 1.5] after day 21 | Inflate innovation sd ×1.3 and Liu–West noise; log event |
| Coverage proxy | Touchpoint items outside 90% predictive interval > 30% over 14 days | Same as above |
| Degeneracy | ESS < 5% of N after resampling three times in a row | Re-initialise particles from current Laplace posterior |
| Numerical failure | NaN/Inf, Cholesky failure, timeout > 500 ms | Return safe default decision (focal level 1 at anchors, cap 1/day) and flag state for repair |
| Burden | > 3 consecutive ignored prompts | Increase $\kappa$ via $\psi$ for 48 h (fewer prompts), never more |

## 10. Verification and Acceptance

### 10.1 Simulator parity (Phase 0 exit)

The KMP port includes a `sim` module that ports the generative model and baselines of `bue_sim.py`. In **parity mode** (K = 4, simulator constants, 4 decision points/day, profile P3, `lateral_mode=free`):

| Check | Reference (Python, n = 200, 90 days) | Tolerance |
|---|---|---|
| Mean cumulative benefit, BUE | 44.8 | ±5% |
| BUE vs. Fixed 10 min (paired difference) | +22.6 | ±10% |
| BUE with `lateral_mode=off` | 47.1 | ±5% |
| Executions per prompt | 37% | ±3 pp |
| Within-user corr(load, dose) | −0.23, negative for 96% of users | sign for ≥ 90% |
| Log-loss (days 15+) | 0.635 (baseline 0.660) | better than baseline |
| Calibration slope range | 0.85–1.07 | within [0.75, 1.2] |
| Sensing profiles P0/P1/P1W/P2/P3 | 26.9 / 28.8 / 43.0 / 44.0 / 44.8 | ordering preserved, ±7% |

Bit-identity with NumPy is not required (different PRNGs); distributional agreement is.

### 10.2 Unit and property tests

| Test | Content |
|---|---|
| T-EHG | Reproduce the worked example of thesis Table 3.2 (good day optimum 20 min, bad day optimum 2 min, 30-min walk negative EHG on the bad day) with the parameter set documented in `../thesis/03_architecture.md` §3.3.5 |
| T-FLOOR | Closed-form floor test vector (§6.2) |
| T-P1/P2/P3 | Randomised property tests of §3.4 (≥ 10,000 random particles/configurations) |
| T-EA | Explaining away: after an engaged miss at 30 min with time window 15 min, posterior of time barrier/feasibility rises more than fatigue; after a miss at 2 min with full window, motivation rises most |
| T-CLIP | Selection probabilities respect clipping bounds; logged probabilities sum to 1 |
| T-MISS | Removing any channel leaves the engine functional; posterior widens, decisions remain within safe set |
| T-REPLAY | Replay of a recorded event log reproduces all decisions (ENG-2) |
| T-SAFE | No candidate violates safety, cap, quiet hours or screening restrictions (fuzzed) |
| T-PERF | Fast loop and nightly update within NFR-8 on reference devices |
