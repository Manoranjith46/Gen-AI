# VolunteerFlow Live AI — Full Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-04-17  
**Constraint:** Use **only free/open-source software** and **Google Cloud Console products** (credits allowed).  
**Audience:** Hackathon judges + implementation team

---

## 0) Executive Summary (1 page)

### Product
**VolunteerFlow Live AI** is a real-time volunteer orchestration platform for NGOs. It ingests community needs, uses AI to triage urgency, decomposes needs into micro-tasks, and assigns tasks using a **unique AI decision layer**:
- **Volunteer Twin AI** (predictive volunteer “digital twin”)
- **Mission Market** (accept / counter / split negotiation)
- **Counterfactual Assignment** (simulate best assignment plan before committing)
- **Compassion Balancer** (prevents burnout + improves fairness)

### Outcomes
- Faster response times
- Higher task completion reliability
- Better volunteer experience (less overload)
- Live impact visibility and hotspot detection

### Why this is unique
Most volunteer tools are “broadcast & hope.”  
VolunteerFlow Live AI is “predict, negotiate, simulate, and optimize—with human wellbeing constraints.”

---

## 1) Problem Statement

NGOs typically handle needs through:
- phone calls, WhatsApp messages, paper surveys, spreadsheets,
- manual volunteer calls,
- loosely coordinated group chats.

### Core problems
1. **Fragmented intake:** needs arrive in inconsistent formats; duplication is common.
2. **Slow assignment:** coordinators spend time calling or messaging volunteers.
3. **Low reliability:** some volunteers accept but fail to complete (no-shows, delays).
4. **Poor task structure:** large missions are not decomposed; work is not parallelized.
5. **Volunteer burnout:** the same “top volunteers” get overused.
6. **Low operational visibility:** hard to see real-time KPIs and underserved zones.

---

## 2) Goals, Non-Goals, and Principles

### 2.1 Goals
1. Enable multi-channel intake (web first; WhatsApp/voice optional).
2. AI triage for urgency/category with explainability and override.
3. AI micro-tasking: break missions into executable 15–30 min units.
4. Real-time assignment using predictive matching + negotiation (Mission Market).
5. Counterfactual planning: select best assignment plan (A/B/C).
6. Compassion balancing: fairness + burnout prevention baked into scoring.
7. Live dashboard: KPIs, heatmaps, resource gaps, volunteer utilization.
8. Strict compliance with **free/open-source + Google Cloud products**.

### 2.2 Non-Goals (MVP / Hackathon)
- Full-scale government/911 integrations.
- Payment, reimbursements, or wallet.
- Offline-first native apps (PWA only).
- Full case management for fraud investigations.
- Deep HR-style certification verification (basic upload only).

### 2.3 Product Principles
- **Human-in-the-loop:** coordinators can override any AI output.
- **Explainability by design:** “why assigned” and “why not” must exist.
- **Compassion-aware optimization:** not just speed/cost—also wellbeing.
- **Low-friction for volunteers:** minimal taps, clear mission cards, short tasks.
- **Real-time operations:** everything updates live.

---

## 3) Target Users & Personas

### 3.1 NGO Coordinator (Primary)
- Manages needs, assignments, escalations, verifications.
- Wants reliability, visibility, and fewer manual calls.

### 3.2 Volunteer (Primary)
- Wants tasks that match skills and time, not spam notifications.
- Wants fair distribution and appreciation/impact feedback.

### 3.3 Field Reporter / Community Member (Secondary)
- Submits needs quickly, sometimes with voice note or low-quality text.

### 3.4 Program Manager / Donor Viewer (Secondary)
- Wants trustworthy impact metrics and narrative reporting.

---

## 4) User Journeys (End-to-End)

### Journey A: Need → Micro-tasks → Assignment → Completion → Verification
1. Coordinator creates a need (or it arrives from intake).
2. AI triages urgency + category.
3. AI generates micro-tasks and dependencies.
4. Matching engine ranks candidate volunteers.
5. Mission Market sends top mission cards.
6. Volunteer accepts/counters/splits.
7. Counterfactual engine chooses best plan.
8. Task executed with proof.
9. Coordinator verifies.
10. Dashboard updates KPIs + heatmap.

### Journey B: No acceptance → Auto escalation
1. Task broadcast to top 5.
2. No response in 90 seconds.
3. Auto-expands radius + more candidates.
4. Optional dual-assignment for critical tasks.
5. Coordinator notified if still unassigned.

### Journey C: Burnout prevention
1. Volunteer has high fatigue score or hit daily cap.
2. Compassion Balancer reduces priority except critical override.
3. Coordinator can override with justification.

---

## 5) Product Scope

### 5.1 MVP (Hackathon-ready)
- Web coordinator console
- Volunteer PWA
- Need intake via web form
- AI triage (Vertex AI) + manual override
- AI micro-task generator (Vertex AI + guardrails)
- Matching + Mission Market (accept/counter/split)
- Counterfactual-lite simulation (top 3 plans)
- Compassion caps (simple rules + score factor)
- Live dashboard (KPIs + map heat)
- Audit logs (append-only)

### 5.2 Post-MVP
- WhatsApp bot intake
- Voice agent intake pipeline
- Advanced trust graph (graph database optional)
- Improved predictive models trained on real usage
- Multi-org tenancy and partner roles

---

## 6) Functional Requirements (Detailed)

### FR-1 Authentication & Roles
**Roles:** Admin, Coordinator, Volunteer, Viewer  
- Volunteers can only see their tasks + nearby mission offers.
- Coordinators manage needs/tasks/verification.
- Viewers see aggregated dashboards only.

**Acceptance Criteria**
- RBAC enforced at API layer.
- Role changes logged in audit.

---

### FR-2 Need Intake
**Need Fields**
- title (required)
- description
- category (food/medical/transport/shelter/other)
- location (lat/lng + address label)
- urgency (manual or AI)
- people_affected (optional)
- deadline/SLA
- attachments (optional)

**Acceptance Criteria**
- Create/edit within 2 seconds p95 for typical load.
- Duplicate detection hint (basic string + geo proximity).

---

### FR-3 AI Triage (Category + Urgency + SLA)
**Inputs**
- title, description, attachments meta, location, time of day

**Outputs**
- predicted category
- urgency level + score 0–100
- recommended SLA
- confidence
- short rationale text

**Acceptance Criteria**
- Response < 3 seconds average.
- Override possible; override reason captured.

**Fallback**
- If AI fails/timeout: rule-based triage (keyword + default SLA).

---

### FR-4 Micro-Task Generation
**Rules**
- Each task aims for 15–30 minutes.
- Each task has:
  - required skills
  - location
  - dependency rules
  - min volunteers required
- Generate a dependency graph.

**Acceptance Criteria**
- Coordinator can edit tasks before dispatch.
- Tasks have unique IDs and are linked to parent need.

**Guardrails**
- Must not generate unsafe medical instructions.
- Must include “requires certified personnel” when category is medical.

---

### FR-5 Volunteer Profile + Volunteer Twin AI
**Volunteer Profile**
- skills tags
- certifications (uploads)
- preferred zones
- language
- availability schedule
- transport modes (walk/bike/car)

**Volunteer Twin Signals**
- reliability_by_task_type
- acceptance_probability
- average_completion_time
- fatigue_score
- preference_fit_score
- trust_score (collaboration history simplified)

**Acceptance Criteria**
- Twin scores updated after task completion and verification.
- “Why this volunteer?” includes top 3 contributing factors.

---

### FR-6 Mission Market (Unique Dispatch)
Instead of spamming everyone, system creates a **Mission Card**:
- impact summary (“Help 10 families today”)
- time estimate
- distance/ETA
- skills required
- urgency badge
- offer window (countdown)

Volunteer actions:
- **Accept**
- **Counter** (propose different ETA)
- **Split** (choose sub-part: pickup/deliver/verify)

**Acceptance Criteria**
- Offer delivered < 5 seconds.
- First eligible acceptance can lock task (configurable).
- Counter can win if it improves predicted success.

---

### FR-7 Counterfactual Assignment
Evaluate three plans:
- Plan A: best single volunteer
- Plan B: split into micro-team
- Plan C: farther but high reliability

Compute:
- expected completion probability
- expected delay risk
- fairness/wellbeing impact
- SLA breach probability

**Acceptance Criteria**
- Completed < 2 seconds for <= 50 candidates.
- Logs chosen plan and reason summary.

---

### FR-8 Compassion Balancer (Wellbeing + Fairness)
Rules:
- daily high-stress cap (config)
- fatigue factor reduces ranking
- fairness factor prevents overuse

**Acceptance Criteria**
- Over-cap requires coordinator override + justification.
- Dashboard shows burnout-risk distribution.

---

### FR-9 Task Execution + Proof
Statuses:
- OPEN → OFFERED → ASSIGNED → IN_PROGRESS → DONE → VERIFIED (or REOPENED)

Proof artifacts:
- photo
- text notes
- GPS check-in/out (optional)
- timestamp

**Acceptance Criteria**
- Signed URLs for uploads/downloads.
- Verification action logged.

---

### FR-10 Impact Pulse Dashboard (Live Ops)
KPIs:
- needs created/resolved/pending
- avg assignment time
- avg completion time
- SLA breach rate
- volunteer utilization
- unassigned critical tasks
- zone heatmap (underserved)

**Acceptance Criteria**
- Refresh 5–10 seconds.
- Filters by time range, category, zone.

---

### FR-11 Reporting & Donor Narrative
Outputs:
- CSV export for needs/tasks
- daily summary
- AI narrative (“what happened today, wins, risks, next steps”)

**Acceptance Criteria**
- Report generation < 10 seconds for 10k rows typical.
- Narrative includes numbers and trends.

---

### FR-12 Audit Logs
Log all state changes:
- need edits
- task creation
- offers and bids
- assignments and overrides
- verification

**Acceptance Criteria**
- Immutable append-only table.
- Search by entity ID.

---

## 7) Non-Functional Requirements

### Performance
- Dispatch end-to-end < 5 seconds typical.
- Dashboard query < 2 seconds typical.

### Reliability
- Safe fallback on AI failure (rules + manual flows).

### Security
- TLS everywhere
- RBAC and least privilege
- secrets in Secret Manager
- signed URLs for artifacts

### Privacy
- opt-in location tracking
- minimal PII storage
- retention policy configurable

### Observability
- Cloud Logging structured logs
- request IDs
- basic alerting for error spikes

---

## 8) Data & Schema (Implementation-ready)

### Entities (Core)
- **users**(id, role, name, phone/email, language, created_at)
- **volunteer_profiles**(user_id, skills[], zones[], availability_json, transport_modes[], created_at)
- **volunteer_twin_signals**(user_id, reliability_json, fatigue_score, acceptance_prob, trust_score, updated_at)
- **needs**(id, created_by, title, description, category, urgency_score, sla_deadline, lat, lng, status, created_at)
- **tasks**(id, need_id, title, task_type, required_skills[], lat, lng, status, depends_on_task_ids[], created_at)
- **task_offers**(id, task_id, volunteer_id, offered_at, expires_at, score_snapshot_json, status)
- **task_bids**(id, offer_id, action, proposed_eta, split_payload_json, created_at)
- **assignments**(id, task_id, volunteer_id, assigned_at, plan_type, score_breakdown_json, override_reason)
- **proof_artifacts**(id, task_id, gs_uri, type, metadata_json, created_at)
- **events_audit**(id, actor_id, entity_type, entity_id, event_type, payload_json, created_at)

---

## 9) AI Requirements (Strict + Safe)

### 9.1 Allowed AI (Google Cloud)
- **Vertex AI (Gemini)** for:
  - triage classification + rationale
  - micro-task generation
  - narrative summaries

### 9.2 Prompt & Output Guardrails
- Always return JSON schema output (validated).
- If output invalid: retry once; then fallback rule-based.

### 9.3 Human-in-the-loop
- Coordinator can edit triage and tasks and override compassion caps.
- System records overrides for learning later.

---

## 10) Ranking & Decision Logic (MVP)

### 10.1 Base scoring formula
FinalScore =
- 0.25 SkillFit
- 0.20 ETAFit
- 0.15 Reliability
- 0.10 AvailabilityConfidence
- 0.10 TrustScore
- 0.10 CompassionBalance
- 0.10 PreferenceFit

### 10.2 Mission Market policy
- Offer to top 5
- Wait 90 seconds
- Escalate to next 10; widen radius
- For Critical tasks: allow “dual accept” until one starts

### 10.3 Counterfactual plans
- A: Best single
- B: Split into 2 volunteers
- C: High reliability volunteer farther away
Pick highest expected outcome under fairness constraints.

---

## 11) Google Cloud Architecture (Credits-friendly)

### Compute
- **Cloud Run** services:
  - api-gateway
  - triage-service
  - taskgen-service
  - matching-service
  - dispatch-service
  - dashboard-service

### Data
- **Cloud SQL (Postgres + PostGIS)**: core DB
- **Cloud Storage**: artifacts (images/audio)
- **Pub/Sub**: event-driven orchestration
- **Redis** (optional; MVP can skip)

### AI
- **Vertex AI**: Gemini calls

### Auth & Notifications
- **Firebase Auth / Identity Platform**
- **Firebase Cloud Messaging** (optional)

### Ops
- Cloud Logging + Monitoring
- Secret Manager

---

## 12) API Requirements (Key Endpoints)

- POST /needs
- GET /needs?filters
- POST /needs/{id}/triage
- POST /needs/{id}/generate-tasks
- POST /tasks/{id}/offer
- POST /offers/{id}/bid  (accept/counter/split)
- POST /tasks/{id}/start
- POST /tasks/{id}/complete
- POST /tasks/{id}/verify
- GET /dashboard/kpis
- GET /dashboard/heatmap
- GET /assignments/{id}/explain
- GET /audit?entity_id=

---

## 13) UI/UX Requirements (Screens)

### Coordinator Console
1. Login + role
2. Needs list + filters + urgency badges
3. Need detail with AI triage + override
4. Task plan view (micro-task tree + dependencies)
5. Dispatch control (offer list + status)
6. Live operations dashboard (KPIs + map)
7. Verification queue
8. Volunteer management (profiles + status)
9. Audit log search
10. Reports page (CSV export + narrative)

### Volunteer PWA
1. Onboarding (skills, availability, zones)
2. Mission feed (offers)
3. Mission card detail (impact, ETA, accept/counter/split)
4. Active task (checklist + navigation)
5. Proof upload
6. History + impact summary

---

## 14) Permissions (RBAC)

- Coordinator: CRUD needs/tasks, dispatch, verify, view all dashboards
- Volunteer: view/act on offers, update own tasks, upload proof
- Viewer: dashboards + reports only
- Admin: user mgmt + settings

---

## 15) Metrics & Analytics

### Operational KPIs
- Median assignment time
- Acceptance rate within 5 minutes
- Completion rate
- SLA breach rate
- Unassigned critical backlog
- Zone coverage index
- Volunteer utilization distribution

### AI KPIs
- Triage override rate
- Task plan edit rate (how often humans change AI tasks)
- Counterfactual win rate vs naive baseline
- Burnout cap override frequency

---

## 16) Testing Requirements

### Unit
- scoring functions
- state machine transitions
- permission checks

### Integration
- need → triage → tasks → offer → bid → assign → complete → verify

### Reliability tests
- AI timeout fallback
- Pub/Sub delay
- Storage upload failure retries

### Load (basic)
- 500 concurrent offer sends
- 1k volunteers polling feed

---

## 17) Risks & Mitigations

1. **AI latency**  
   Mitigation: async calls via Pub/Sub + fallback.
2. **Bad AI outputs**  
   Mitigation: JSON schema validation + retry + rules.
3. **Spam / notification fatigue**  
   Mitigation: Mission Market limits + personalized top-N only.
4. **Volunteer churn**  
   Mitigation: micro-tasks + impact feedback + fairness.
5. **Privacy concerns**  
   Mitigation: opt-in location, minimal PII, signed URLs.

---

## 18) Delivery Plan (48-hour Build)

### Day 1
- Auth + roles
- Need intake + DB
- Tasks + dependencies
- Basic matching (rules)
- Volunteer PWA offer view
- Dashboard baseline

### Day 2
- Vertex AI triage + task generation
- Mission Market accept/counter/split
- Counterfactual-lite
- Compassion caps
- Reporting + narrative
- Demo polish

---

## 19) Definition of Done (MVP)
- End-to-end demo works reliably:
  - need intake → AI triage → micro-task plan → mission offers → accept/counter → assignment → proof upload → verification → dashboard update
- All services run on Google Cloud (Cloud Run) with logs/monitoring.
- Clear differentiator shown: Volunteer Twin + Mission Market + Counterfactual.

---

## 20) Appendix A — JSON Schemas (AI Outputs)

### Triage Output JSON
```json
{
  "category": "food",
  "urgency_level": "HIGH",
  "urgency_score": 82,
  "recommended_sla_minutes": 120,
  "confidence": 0.78,
  "rationale": "Elderly families reported no food supplies; near-term health risk."
}
