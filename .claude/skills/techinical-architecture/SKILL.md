Technical Architecture Skill
Architecture Goal
This skill helps make technical decisions that are clear, simple, sustainable, and aligned with the product being built. Architecture exists to serve the product — not the other way around.
Priorities, in order:

Product needs before architectural preference.
Simplicity before unnecessary abstraction.
Clear boundaries before clever patterns.
Maintainability before theoretical purity.
Existing project patterns before generic best practices.
Explicit trade-offs before hidden complexity.
Evolutionary architecture over premature scale.


Project Inspection First
Before proposing any architecture or refactoring, inspect what already exists:

Review the current project structure: folders, modules, layers, and naming conventions.
Identify the stack: languages, frameworks, libraries, infrastructure.
Understand existing patterns: how the team has solved similar problems before.
Understand the goal of the change: what problem is actually being solved?
Distinguish real problems from stylistic preferences.
Do not propose large restructuring without a strong technical or product reason.
Do not introduce a new architectural pattern if the existing one can solve the problem.

If context is missing, infer from the project structure, requirements, or code before asking. Ask only when missing information would block the decision.

Architecture Context
Before deciding anything, identify:

What technical or product problem needs to be solved.
Which part of the system is affected.
Which users or flows depend on this area.
What constraints apply: timeline, team size, budget, existing stack, legacy systems, performance requirements, security requirements.
Which decisions have already been made and should not be revisited.
What needs to change now versus what can wait.
What risks appear if nothing changes.


System Boundaries
Define clear responsibilities across the system:

Separate concerns between front-end, back-end, database, integrations, and infrastructure.
Decide where business rules live — and keep them there.
Decide where validation, authorization, state management, persistence, and external communication belong.
Avoid duplicating logic across multiple layers.
Avoid unnecessary coupling between modules that could evolve independently.
Make dependencies explicit and visible.
Do not create artificial boundaries when the system is still simple. Premature separation creates overhead without benefit.


Modules and Layers
Organize the system in a way the team can understand and maintain:

Follow the project's existing organization: by domain, by feature, or by layer — whichever is already established.
Keep modules small enough to understand at a glance.
Avoid files or services that do too many things.
Separate orchestration, business rules, data access, and external integration when that separation makes the code clearer.
Do not add layers just to look more architectural. Every layer must justify its existence.
Prefer a simple structure the team can maintain over a sophisticated one they struggle with.


Trade-off Thinking
Every meaningful architecture decision has trade-offs. Make them explicit.
Rules:

Every significant decision must declare what it improves and what it makes harder or more expensive.
When more than one reasonable path exists, compare them.
Never present a choice as perfect. Every decision costs something.
Prefer reversible decisions when uncertainty is high.
Avoid expensive decisions based on hypothetical problems.

Trade-off template (use when relevant):
Option: [What you're proposing]
Improves: [What gets better]
Costs: [What gets harder, slower, or more complex]
Best when: [Context where this makes sense]
Avoid when: [Context where this creates problems]

Architecture Decision Records
Use ADRs for decisions that affect system structure, major dependencies, database design, deployment strategy, integrations, security, or long-term maintenance.
Do not write an ADR for minor implementation details.
ADR format:
## Context
What situation or problem led to this decision?

## Decision
What was decided?

## Alternatives Considered
What other options were evaluated?

## Reasoning
Why was this option chosen over the others?

## Consequences
What changes as a result? What becomes easier? What becomes harder?

## Risks
What could go wrong? Under what conditions would this decision need to be revisited?

## When to Revisit
What signals or events should trigger a review of this decision?

Scalability and Performance

Do not scale prematurely. Premature optimization is expensive and often wrong.
Identify real or probable bottlenecks, not theoretical ones.
Consider the realistic volume: users, data size, request rate, background jobs.
Separate read-heavy flows, write-critical paths, and async processing when there is a clear reason to do so.
Evaluate caching only when cache invalidation is well understood.
Consider queues, workers, or event-driven patterns only when there is a concrete need.
Prefer simplicity while the product is still validating its value.


Maintainability and Evolution
Architecture must make the system easier to change over time, not harder.

Code should be easy to locate, understand, test, and modify.
Avoid hidden dependencies between modules.
Avoid abstractions that only one person understands.
Reduce coupling where it creates real risk — not everywhere by default.
Preserve patterns that still work. Do not change things that are not broken.
Improve architecture incrementally. Avoid rewrites unless the cost of the current state clearly outweighs the risk of replacement.


Technical Debt
Treat technical debt as a conscious trade-off, not as a vague complaint.

Identify what the debt is.
Explain why it exists.
Describe the risk of leaving it unresolved.
Define when it should be addressed.
Separate urgent debt from acceptable short-term shortcuts.
Do not label code as technical debt only because it differs from a preferred style.


Dependency Decisions

Do not add libraries, frameworks, or external services without a clear need.
Evaluate each dependency on: maturity, maintenance activity, license, cost, vendor lock-in risk, security history, and added complexity.
Prefer dependencies already used in the project when they are adequate.
Do not swap stack components based on personal preference.
Explain why a new dependency is worth its cost.
Consider the impact on build time, deployment, test setup, and onboarding for new developers.


Refactoring Strategy

Refactor to solve a real problem — not for aesthetics.
Separate refactoring from feature work when the risk is high.
Make changes that are small, reviewable, and reversible.
Preserve existing behavior throughout the refactor.
Identify tests or validation strategies before starting.
Avoid big bang refactors. If a large refactor is unavoidable, break it into phases.

Refactor phase template:
Phase 1: [Safest, smallest change — establishes the new pattern without breaking existing behavior]
Phase 2: [Migrate incrementally — move one module/area at a time]
Phase 3: [Remove the old structure once the new one is stable]

Integration Architecture

Define clear contracts between systems before building integrations.
Treat external APIs as unstable. They will change, go down, or behave unexpectedly.
Consider retry logic, timeouts, idempotency, and observability from the start.
Avoid tight coupling with external APIs. Use an adapter or anti-corruption layer to translate external data into the internal model.
Protect the core system against failures in third-party services.
Document the assumptions your integration relies on (rate limits, data formats, availability guarantees).


Security and Data Boundaries

Identify trust boundaries: who is allowed to do what, and from where.
Separate public data, private data, and sensitive data from the start.
Make authentication and authorization architectural decisions — not afterthoughts.
Prevent data leakage between users, organizations, or tenants.
Never spread secrets or credentials through the codebase.
Consider audit logging for sensitive or irreversible actions.
Treat security as an architectural concern whenever it affects the system as a whole.


Architecture Review
When reviewing an existing architecture, evaluate:

Clarity: Is the structure easy to understand?
Responsibility separation: Does each part have a clear, single purpose?
Coupling: Are modules more connected than they need to be?
Cohesion: Does each module contain things that belong together?
Business logic location: Are rules scattered across layers or centralized appropriately?
Unnecessary dependencies: Are there libraries or services that no longer serve a purpose?
Scalability risks: Are there realistic bottlenecks at expected load?
Security risks: Are there gaps in authentication, authorization, or data isolation?
Maintenance risks: Would a new developer understand this in a reasonable amount of time?
Accidental complexity: Is there complexity that serves the architecture rather than the product?
Fit for current stage: Is this architecture appropriate for where the product is now?

Be direct. If the architecture is over-engineered, say so. If it is too simple for the current risk level, say that too.

Output Formats
Choose the output format that best matches what the user needs:
FormatWhen to useArchitecture proposalDesigning a new system or major featureArchitecture reviewEvaluating an existing structureADRCapturing a significant technical decisionRefactor planProposing changes to an existing systemModule boundary proposalDefining where responsibilities should liveLayering recommendationStructuring how data and logic flow through the systemTrade-off analysisComparing architectural optionsDependency decisionEvaluating whether to add or replace a dependencyIntegration architectureDesigning how two systems connectScalability assessmentIdentifying performance or growth risksTechnical risk analysisSurfacing risks before they become incidentsProject structure recommendationOrganizing files, folders, and modules

Decision Mode
User-directed mode — when the user has defined the stack, architecture, or constraints:

Respect existing decisions.
Challenge them only when there is a real technical risk.
Do not substitute user preferences with your own without a clear technical reason.

Claude-directed mode — when the user delegates the decision:

Make a reasonable choice.
Prefer simple, well-known, easy-to-maintain solutions.
State your assumptions briefly.
Avoid exotic choices unless there is a specific need for them.
Ask only when the missing information blocks progress.


Final Checklist
Before delivering any architecture output, verify:

 The architecture solves a real product or technical problem.
 The proposed structure is no more complex than necessary.
 Responsibilities and boundaries are clear.
 Existing project patterns were considered before introducing new ones.
 Trade-offs were explained honestly.
 All new dependencies are justified.
 Security and data boundaries were considered.
 Scalability concerns are grounded in realistic load, not speculation.
 Any proposed refactoring is incremental and safe.
 Technical debt, if present, was identified with risk and timing.
 The next decision or action is clear.
