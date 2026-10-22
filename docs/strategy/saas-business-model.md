# CampusConnect SaaS — business model and multi-tenancy brainstorm

Status: **exploration draft**, 2026-10-22, right after the FYP open house. Business model options are collected in §9. Not a decision record;
decisions it leads to get their own file in `docs/decisions/`. Repo visibility is handled in
[`0002-repository-visibility.md`](../decisions/0002-repository-visibility.md).

Prices marked *(verify)* come from third-party pricing pages in October 2026 or rough estimates.
Check them against each vendor before committing to a price. Currency assumption: **USD 1 ≈ PKR 280**.

---

## 1. Constraints

1. **Students must be able to use it for free, or close to free.** Pakistani students are very price sensitive;
   anything above a few hundred rupees a month will not convert.
2. **Someone else pays most of the bill.** Institutions (departments, universities), and possibly employers.
3. **Costs scale with AI usage, not with users.** Library, messenger, community and mentorship are nearly free
   per user; LLM questions and document parsing are the variable costs.
4. **Solo founder.** Sales cycles, support load and operations must stay small until revenue exists.

## 2. Who gets value and who pays

> **Challenged 2026-10-22:** "institutions pay so students get it free" is a benefit to students, not to the institution,
> and nobody signs a purchase order for that. The revised model is **Business model option 1** in §9. §2–§5 below are kept
> as the original draft; read them together with §9.

| Party | Value | Pays? |
| --- | --- | --- |
| Students | Notes in one place, AI tutor grounded in *their* course material, mentors, messenger | Free tier; optional cheap Plus |
| Contributors (seniors, TAs) | Reputation, recognition, mentoring record for their CV | No; they are the supply side, keep them happy (perks, certificates) |
| Departments / societies | Organised course material, moderation, engagement analytics, less WhatsApp chaos | **Yes, primary early buyer.** Small budget, fast decision |
| Universities | Campus-wide platform, analytics, retention, branding, SSO | **Yes, main revenue later.** Slow procurement, larger contracts |
| Employers / recruiters | Reach strong students in specific semesters/departments | Later: paid internship postings |

**Model: B2B2C freemium.** Institutions pay to make the platform free for their students; individual students
can upgrade if their institution hasn't paid.

## 3. Unit economics (the AI is the only expensive part)

### Per AI question
Current pipeline: contextualise/summarise with the fast model, embed the query, retrieve top-5 chunks, answer with
`gpt-oss-120b` on Groq, prompt capped at `GROQ_MAX_PROMPT_TOKENS=6000`.

| Item | Assumption | Cost |
| --- | --- | --- |
| Answer input | ~4k tokens avg (6k max) × $0.15/M *(verify)* | $0.0006 |
| Answer output | ~600 tokens × $0.60/M *(verify)* | $0.00036 |
| Fast-model call(s) + query embedding | small | ~$0.0002 |
| **Total** | | **≈ $0.0012, budget $0.002 (≈ PKR 0.56)** |

### Per uploaded document (one-time, shared by the whole tenant)
LlamaParse is credit-based: about $1.25 per 1,000 credits; "cost-effective" tier ≈ 3 credits/page, "fast" ≈ 1 credit/page *(verify)*.
A 30-page lecture-notes PDF ≈ **$0.04–0.11** to parse. Embedding is negligible. Since one upload serves every
student in that course, ingestion cost per student is close to zero.

### Per student per month
| Usage profile | Questions / month | AI cost |
| --- | --- | --- |
| Light (typical) | 30 | $0.06 (PKR 17) |
| Regular | 100 | $0.20 (PKR 56) |
| Exam-week heavy | 400 | $0.80 (PKR 224) |

**Conclusion:** at average usage, AI costs well under PKR 100 per active student per month. The risk is the heavy tail
during exams, which needs quotas and a fallback to the cheaper model, not higher prices.

### Fixed platform costs once off free tiers *(verify all, order of magnitude only)*
Paid API host (Render) ~$7–25, MongoDB Atlas dedicated tier ~$60, Qdrant Cloud paid tier ~$25+, Cloudinary paid ~$90 or
moving files to cheaper object storage (Cloudflare R2 / Backblaze B2), domain + email ~$5. **About $100–200/month**
for the first few tenants. One paying department covers it.

### Cost levers (do these before raising prices)
- **Semantic answer cache per course.** Students in the same course ask the same questions before exams; cache answers
  keyed by (tenant, course, normalised question embedding). Probably the single largest saving.
- **Model routing.** Simple/definitional questions go to the fast model; only multi-step questions use the 120B model.
- **Prompt caching / batch discounts** where the provider offers them (Groq advertises ~50% off cached input *(verify)*).
- **Parse tier by file type.** Text-based PDFs use the cheapest parse tier; only scanned/complex documents use the expensive one.
- **Per-tenant monthly AI budget** with alerts, so one tenant can't burn the margin.

## 4. Pricing proposal (draft)

Pakistani students and universities think in **semesters**, so semester billing is the default; monthly is offered for Plus.

| Plan | Who | Price | Includes |
| --- | --- | --- | --- |
| **Free** | Any student | PKR 0 | Library, community, messenger, mentorship, reputation; **5 AI questions/day on the fast model** |
| **Student Plus** | Individual student whose institution hasn't paid | **PKR 199/month or PKR 799/semester** | 200 questions/month on the best model plus fair-use fast model, private personal notes in the AI's context, exam mode (practice questions from course notes) |
| **Department** | A department, society or single programme | **PKR 150–300 per student per semester**, minimum PKR 20,000/semester | Plus-level access for every member from a **pooled AI budget** (~50 best-model questions per student per month, pooled; top-up packs), own moderation, department analytics, private resources |
| **University** | Whole campus | **PKR 300–500 per enrolled student per year**, annual contract, volume tiers | Everything in Department, plus SSO (Google Workspace / Microsoft), custom subdomain and branding, LMS integration (Moodle), data export, SLA, priority support |
| **Self-host / commercial license** | Institutions that require on-prem | Quote | The AGPL v1 is free to self-host; a commercial license for the SaaS edition, without AGPL obligations, is quoted per institution |

Sanity check (why the AI budget is pooled, not unlimited): a 400-student department at PKR 70/semester would bring
in ≈ $100 while regular AI use (100 q/month × 5 months × 400 × $0.002) costs ≈ $400, a loss. At PKR 200/student/semester
(≈ $285) with a pooled 50 q/student/month (≈ $200 before caching, ≈ $120 with the answer cache and model routing)
the margin is ~50% and still cheap per student. A 10,000-student university at PKR 400/student/year (≈ $14k/year), where
typically well under half are active, has a comfortable margin. **Validate real usage in the pilot before fixing these numbers.**

### Other revenue, later and optional
- **Internship / job board:** employers pay per posting to target semesters or departments. Students opt in. A good fit
  because contributors and mentors are the strongest students.
- **Paid mentorship sessions** with a platform commission (only once trust and volume exist).
- **Certificates** for top contributors, sponsored by companies.
- **Never:** selling student data or third-party ad networks. Trust is the product; one data scandal ends university sales.

### Payments
Stripe does not onboard Pakistani merchants *(verify)*. Options: local gateways (JazzCash, Easypaisa, Safepay,
PayFast) for students; bank invoice / purchase order for institutions; a merchant of record (Paddle, Lemon Squeezy)
if selling abroad. Students rarely have cards, so mobile-wallet checkout is essential for Plus.

## 5. Go-to-market

1. **Pilot at QAU, one department, one semester, free.** In return: usage data, a written testimonial and a case study.
   Pick a department where seniors already share notes on WhatsApp.
2. **Seed the supply side first.** A pilot lives or dies on the library. Recruit 10–20 contributors (seniors, TAs) per department;
   reward them with reputation, certificates and visibility to employers.
3. **Measure:** weekly active students, AI questions per student, resources uploaded per course, exam-week retention.
   These numbers are the sales deck for the next department.
4. **Expand within the campus, then across Islamabad/Rawalpindi universities** via student societies and faculty referrals
   (supervisors and panel professors are the first warm introductions).
5. **University contracts only after 2–3 departments pay.** Campus procurement is slow; departments prove demand.
6. Apply to local incubators and university-linked startup programmes for credibility, mentoring and cloud credits.

## 6. Product changes the SaaS needs (multi-tenancy)

### Tenant model
`Organization` (university) → `Department` (optional sub-tenant) → `Membership(user, org, department, role)`.

- **Global user identity, per-tenant membership.** A student keeps one account if they change universities or do a
  master's elsewhere. Roles (Student/Contributor/Admin) become **per membership**, not global.
- Join by verified institutional email domain or by an invite code from a tenant admin.
- New role: **platform admin** (you) separate from **tenant admin** (department/university staff).

### Data isolation (pool model: shared databases, tenant key everywhere)
- **MongoDB:** `tenantId` on every tenant-owned document; every index prefixed with `tenantId`, including the unique
  ones (`participantsKey`, slugs, etc.). Enforce it with a Mongoose plugin or a repository layer that refuses queries without
  a tenant scope, plus tests that try cross-tenant reads.
- **Qdrant:** one shared collection with a `tenantId` keyword payload index marked `is_tenant: true` (Qdrant ≥ 1.11).
  It groups each tenant's vectors on disk; it is **not** access control, so `RetrievalService` must always add the tenant filter
  server-side. Per-collection-per-tenant is only worth it for a tenant needing hard isolation (enterprise contract).
- **Cloudinary / object storage:** a folder per tenant; signed URLs scoped by tenant.
- **Socket.IO:** rooms namespaced by tenant; the gateway checks membership on join.
- **AI memory and chat history:** tenant-scoped, never retrieved across tenants.

### Routing and identity
- Subdomain per tenant (`<tenant>.campusconnect.<tld>`); the JWT carries the active `tenantId` and membership role.
- SSO via OIDC/SAML for university plans (Google Workspace and Microsoft Entra cover most Pakistani universities).

### Enterprise-grade hardening ("high tier")
Close the `BACKLOG.md` R3 items first (OAuth `state`, case-insensitive email, atomic checks, refresh race, report rate limits),
then: audit log of admin actions, per-tenant rate limits and AI quotas, automated backups with tested restore,
structured logging + error tracking + uptime alerts, data export and deletion per user and per tenant
(Pakistan's personal data protection rules and university policies will ask), status page, and a written privacy policy and DPA.

### Architecture triggers already on record
Multi-tenancy plus paying customers will likely mean **more than one API instance**. That is a trigger in
[`0001-no-redis.md`](../decisions/0001-no-redis.md): revisit the in-process ingestion queue and in-memory state
(presence, Google exchange codes) before scaling out.

### Billing
Subscriptions live on `Organization` (and on `User` for Student Plus); entitlements (AI quota, features) are computed
from the plan and checked server-side. Start with manual invoicing for institutions; automate only when needed.

## 7. Risks

| Risk | Mitigation |
| --- | --- |
| Empty library at a new tenant → no value | Contributor seeding before launch; import existing shared drives |
| Copyright of uploaded material (textbooks, paid notes) | Moderation already exists; add a takedown process and clear contributor terms |
| AI gives wrong answers in exams | Citations are already shown; label answers as study aid; "ask a human" hand-off |
| Slow university procurement | Department-first sales; semester pilots |
| LLM price/provider changes | Model-agnostic LLM layer; keep Groq and one fallback provider wired |
| Free-tier abuse | Per-user daily caps, institutional email verification |
| Solo-founder bandwidth | Narrow scope: one country, one segment (universities), defer marketplace features |

## 8. Suggested next steps (in order)
1. Decide repo visibility (ADR 0002) and get GitHub Pro before going private.
2. Close the R3 security items; they block any real tenant.
3. Write the multi-tenancy ADR (tenant model, isolation, routing) before writing code.
4. Instrument AI usage per user/tenant (questions, tokens, cost) so pricing is based on data.
5. Line up the QAU department pilot for next semester.
6. Draft terms of service, privacy policy and contributor terms.

## 9. Business model options

### Option 1 — Bottom-up adoption, then sell the institutional layer

**Premise.** A university pays only for something that moves *its own* numbers. Making things free for students
isn't one of them. So the student app is not the institution's product; the **admin, analytics and compliance layer on top of
student usage** is.

**What institutions actually pay for**

| Institutional need | How CampusConnect serves it | Exists today? |
| --- | --- | --- |
| **Accreditation evidence** (NCEAC, PEC, HEC QA reviews ask for proof of student advising, mentoring and support; gathering it is manual every cycle) | Mentorship logs, ratings, resource coverage per course, engagement, exported as accreditation-ready reports | Data yes, reports no |
| **Retention** (at private universities a dropout or repeat failure is lost fee revenue) | Engagement-drop early warning for advisors | No |
| **Admissions marketing** | "An AI tutor trained on our course material, for every student", branded per campus | Mostly |
| **Faculty workload** | AI answers repetitive pre-exam questions from approved material with citations; "ask a human" to the author | Yes |
| **Governance of AI use** (students already use ChatGPT and WhatsApp groups the university can't see) | AI limited to moderated material, institutional data control, admin oversight | Partly |

**Sequence**
1. **Free, bottom-up adoption by students.** Costs covered by Student Plus, employer internship postings, and sponsors
   (telecoms, banks with student programmes). Grow the way Slack and Notion did, without waiting on procurement.
2. **Sell the institutional layer once a campus has real usage:** analytics, accreditation reports, at-risk alerts, SSO,
   branding, data export. The pitch: "N% of your students already use this; here's what they're doing, and
   here are your accreditation reports."
3. **Private universities before public ones.** They have tuition revenue, a stake in retention and marketing, and faster purchasing.
   Public universities have constrained budgets and slow procurement.
4. **Departments remain a small but real buyer.** A head of department with an accreditation visit coming has a concrete problem.

**Product work this option implies:** accreditation/report exports, engagement analytics and at-risk alerts, institutional
admin roles, SSO, LMS (Moodle) integration.

**Unvalidated: test before building.** Interview 5–10 people (QA directors, heads of department, admissions/student affairs at a
private university):
- What is the most painful part of preparing for accreditation?
- How do you identify struggling students today?
- What is your policy on students using ChatGPT?
- Have you ever paid for student-facing software, and who approved the budget?

If no one describes a painful, budgeted problem, institutions aren't the buyer and the model must stand on students,
employers and sponsors alone.

## Sources (pricing, October 2026)
- Groq `gpt-oss-120b` pricing: [morphllm.com/groq-pricing](https://www.morphllm.com/groq-pricing), [getmaxim.ai Groq calculator](https://www.getmaxim.ai/bifrost/llm-cost-calculator/provider/groq/model/gpt-oss-120b), [flexprice.io/pricing-index/groq](https://flexprice.io/pricing-index/groq)
- LlamaParse credits: [developers.llamaindex.ai/llamaparse/general/pricing](https://developers.llamaindex.ai/llamaparse/general/pricing/)
- Qdrant multitenancy: [qdrant.tech/documentation/manage-data/multitenancy](https://qdrant.tech/documentation/manage-data/multitenancy/), [Qdrant 1.11 release](https://qdrant.tech/blog/qdrant-1.11.x/)
