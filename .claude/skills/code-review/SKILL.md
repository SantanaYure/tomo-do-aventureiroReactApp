Code Review Skill
Review Goal
This skill helps review code before changes are accepted or merged. The goal is to catch real problems early: bugs, security risks, data integrity issues, scope drift, architectural violations, and regressions.
Priorities, in order:

Correctness before style.
User-impacting bugs before minor improvements.
Security and data integrity before convenience.
Scope control before opportunistic refactors.
Maintainability over cleverness.
Existing project patterns over personal preference.


Project Inspection First
Before reviewing any code:

Identify the scope of the change.
Understand what the task was supposed to do.
Read related files when needed for context.
Check existing patterns in the project.
Separate what was requested from what was actually changed.
Do not suggest a full rewrite unless there is a strong reason.
Do not impose preferences that conflict with the existing architecture.

If context is missing, infer from the code, diff, requirements, or described behavior. Ask only when missing information would block the review.

Review Context
Before pointing out problems, identify:

What problem the change is trying to solve.
Which files or modules were affected.
Whether the change alters existing behavior.
Whether there is impact on API, database, UI, permissions, or integrations.
Whether there are related tests or validation steps.
Which risks matter most for this change.


Review Priorities
Review in this order:

Correctness — bugs, wrong logic, unhandled cases.
Security — authentication, authorization, secrets, sensitive data.
Data integrity — data loss, inconsistency, missing transactions.
Breaking changes — APIs, contracts, types, existing behavior.
Scope — changes outside what was requested.
Maintainability — duplication, poor naming, tight coupling, unnecessary complexity.
Performance — real or obvious performance problems.
Tests — missing or weak coverage.
Style — only when it hurts clarity or breaks project conventions.


Correctness Review
Check:

Happy path behavior.
Error cases.
Edge cases.
Null, empty, or undefined states.
Race conditions.
Async behavior.
Handling of external failures.
Compatibility with the original requirement.

Do not approve code just because it looks clean. It needs to work correctly.

Security Review
Check:

Authentication.
Authorization.
Data leakage between users or tenants.
Exposed secrets.
Sensitive data in logs.
Input validation.
Injection risks.
Destructive actions without protection.
Unsafe use of dependencies.

If there is a security risk, flag it clearly. Do not bury it in optional suggestions.

Scope Control
This is a critical part of every review.
Rules:

Identify changes that fall outside the requested scope.
Do not accept opportunistic refactors mixed in with a bug fix or small feature.
Distinguish genuinely useful improvements from unnecessary changes.
Recommend moving large refactors to a separate task.
Preserve existing behavior when the task does not require changing it.
If the change alters a contract or architecture, it must be explicit and intentional.


Architecture and Maintainability
Check:

Whether the change respects the current architecture.
Whether responsibilities remain well separated.
Whether business logic is placed in the right layer.
Whether there is meaningful duplication.
Whether names explain intent.
Whether new abstractions are justified.
Whether the code is easier or harder to understand after the change.

Apply Clean Code and SOLID principles only when they simplify or clarify. Do not apply them mechanically.

Frontend Review
When reviewing frontend code, evaluate:

Components are small and focused.
Props are clear and typed.
Relevant UI states are handled.
Accessibility is considered.
Existing components are reused where appropriate.
Theme tokens are used correctly.
Responsiveness is handled.
Heavy logic is kept out of the render path.
Visual changes stay within the requested scope.


Backend Review
When reviewing backend code, evaluate:

API contract.
Input validation.
Business rules.
Authentication and authorization.
Error handling.
Data integrity.
Compatibility with existing clients.
Logs are useful and safe.
Performance on critical routes.


Database Review
When reviewing database changes, evaluate:

Migrations are safe to run.
Risk of data loss.
Constraints are correct.
Indexes are appropriate.
Relationships are correct.
Transactions are used where needed.
Soft delete vs. hard delete decision is intentional.
Sensitive data is handled correctly.
Compatibility with existing data.


Test Review
Check:

Tests exist for the main behavior.
Error cases are covered.
Edge cases were considered.
Permissions are tested.
Likely regressions are covered.
Snapshots or mocks do not hide real problems.
Tests are clear and maintainable.

Do not require tests for everything, but flag relevant gaps.

Dependency and Configuration Review
Check:

New dependencies are necessary and justified.
Configuration changes are safe across environments.
Environment variables are documented when added.
Secrets are not committed.
Build, lint, test, or deployment behavior was not accidentally changed.


Comment Style
When writing review comments:

Be direct and specific.
Explain the impact of the problem.
Suggest a practical fix when possible.
Separate critical problems from optional improvements.
Do not praise weak code to soften the feedback.
Do not write generic comments like "improve readability" without an example.
Avoid nitpicks when there are more important problems to address.


Review Evidence
When pointing out an issue:

Reference the affected file, function, component, endpoint, or behavior when possible.
Explain why it is a problem.
Describe the likely impact.
Suggest a practical fix or validation step.
Avoid vague review comments without evidence.


Severity Levels
Use severity levels when useful:

Critical — can cause serious failure, data leak, data loss, production breakage, or a blocking bug.
High — important bug, security risk, likely regression, or significant incorrect behavior.
Medium — maintainability problem, relevant edge case, or inconsistency that may grow.
Low — small improvement, clarity, style, or non-blocking adjustment.


Output Format
Choose the most useful format for the context. When possible, structure the output as:

Summary — what the change does and overall assessment.
Must fix — critical and high severity issues that block approval.
Should fix — medium severity issues worth addressing before or shortly after merging.
Optional improvements — low severity suggestions.
Suggested validation — what to test or verify before merging.

Other valid formats when appropriate: structured issue list, risk assessment, security review, refactor review, test coverage review, approval with notes, rejection with required fixes.

Approval Guidance
End every review with a clear decision:

Approved — no relevant problems found.
Approved with notes — can proceed, but improvements are recommended.
Changes requested — problems must be fixed before the change is accepted.
Blocked — essential context is missing, or there is a critical risk with no resolution.

Do not approve changes with known critical problems.

Final Checklist
Before finishing a review, verify:

 The change solves the intended problem.
 No critical correctness issue was found.
 Security-sensitive behavior was reviewed.
 Data integrity risks were considered.
 Existing API or behavior was not silently broken.
 The change stays within the requested scope.
 Existing architecture and patterns were respected.
 Unnecessary refactors were identified.
 Relevant tests or validation steps were considered.
 Review comments include specific evidence.
 Dependency and configuration changes were reviewed.
 The review decision is clear.
