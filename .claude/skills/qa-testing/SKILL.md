QA Testing Skill
QA Goal
This skill helps validate whether a feature actually works in a real user flow — not just whether it compiles or passes a unit test.
Prioritize:

User behavior over implementation assumptions.
Acceptance criteria over vague expectations.
Real flows over isolated happy paths.
Reproducible bugs over guesses.
Risk-based testing over testing everything equally.
Clear validation steps over generic advice.

Project Inspection First
Before creating tests or reviewing a delivery:

Inspect the requirements, acceptance criteria, or feature description.
Understand the expected user flow.
Check whether the project already has tests, QA patterns, or established tooling.
Reuse existing patterns for manual, unit, integration, or E2E tests.
Do not introduce a new testing tool without a clear reason.
Identify critical areas before suggesting coverage.

If context is missing, try to infer from code, requirements, or described behavior. Ask only when the missing information blocks validation.
Testing Context
Before testing, identify:

Which feature is being validated.
What problem it is supposed to solve.
Who the user is.
What the main flow looks like.
What inputs are valid and invalid.
What permissions exist.
What UI states are possible.
Which integrations, APIs, or databases are affected.
Which risks matter most.

Acceptance Criteria Validation

Transform acceptance criteria into testable scenarios.
Verify that each criterion has an observable behavior.
Flag criteria that are vague or incomplete.
Distinguish between "technically done" and "ready for the user."
Point out missing criteria when there are gaps.
Do not treat a delivery as ready just because the happy path works.

Test Case Design
Cover the following types of tests:

Happy path.
Edge cases.
Error cases.
Empty states.
Loading states.
Permission cases.
Validation cases.
Regression cases.
Cross-device or responsive cases.
Data consistency cases.

Each test case should include, when useful:

Title: what is being tested.
Preconditions: required state before the test.
Steps: numbered, reproducible actions.
Expected result: what should happen.
Priority / risk level: high, medium, or low.

Manual Testing

Write clear, reproducible steps.
Test as a real user would interact with the product.
Validate messages, states, and visual feedback.
Confirm behavior under errors and interruptions.
Test destructive actions carefully.
Record evidence when needed.
Avoid checklists that are too vague to act on.

Automated Testing

Suggest unit tests for business logic and rules.
Suggest integration tests for APIs, databases, and external services.
Suggest E2E tests for critical user flows.
Do not automate everything without criteria.
Prioritize automation for flows that are repetitive, critical, or fragile.
Use the project's existing tools.
Do not introduce new frameworks without a clear justification.

UI Testing
Validate:

Layout and visual hierarchy.
Visual states (default, hover, focus, disabled, active).
Responsiveness across breakpoints.
Accessibility (keyboard navigation, screen reader hints, contrast).
Error messages and inline validation.
Required field indicators.
Disabled buttons and their conditions.
Loading, empty, error, and success states.
Behavior with long, empty, or unexpected data.

API Testing
Validate:

Status codes for all relevant outcomes.
Request validation (missing fields, wrong types, invalid values).
Response shape and required fields.
Authentication (missing token, expired token, invalid token).
Authorization (roles, scopes, ownership rules).
Pagination (first page, last page, empty result, out-of-range page).
Filtering and sorting behavior.
Error responses (format, messages, codes).
Rate limiting when relevant.
Backward compatibility when changing existing contracts.

Database and Data Validation
Validate:

Records are created correctly and completely.
Updates do not cause unintended data loss.
Deletes follow the correct strategy (hard delete vs. soft delete).
Constraints are respected (unique, not null, foreign key).
Relationships are preserved after operations.
Transactions work correctly in critical operations.
No data leaks between users, accounts, or tenants.
API responses are consistent with what is actually persisted.

Test Data and Environments

Define what data is needed before testing.
Avoid using real sensitive user data.
Separate local, staging, and production validation.
Make test data reusable and easy to reset.
Note environment-specific behavior when it affects results.

Bug Reports
When reporting a bug, include:

Title: concise description of the problem.
Severity: critical, high, medium, or low.
Environment: browser, OS, version, device, or environment name.
Preconditions: state of the system before the bug occurs.
Steps to reproduce: numbered and precise.
Expected behavior: what should happen.
Actual behavior: what actually happens.
Evidence: screenshot, video, log, or network response, when available.
Suspected area: component, service, or function, when useful.
Impact: effect on the user or business.

The bug must be reproducible. If it cannot be consistently reproduced, state that uncertainty clearly.
Severity and Priority

Severity describes user or system impact.
Priority describes how soon it should be fixed.
Do not treat every bug as urgent.
Escalate critical issues that block core flows, security, payments, or data integrity.

Risk-Based Testing
Prioritize testing in areas with the highest risk of failure or impact:

Payment and billing flows.
Login, authentication, and authorization.
Sensitive or personal data handling.
Deletions and irreversible actions.
External integrations and third-party dependencies.
Data migrations.
High-frequency user flows.
Features with a history of bugs.
Areas with complex business rules.

Regression Testing

Identify what may have broken after a change.
Test related flows, not just the modified point.
Build a regression checklist for critical areas.
Prioritize regression in shared features, reused components, and APIs used across multiple screens.

Release Readiness
Before considering a delivery ready:

 Acceptance criteria are met.
 Main user flow has been validated.
 Error cases have been tested.
 UI states have been tested.
 Permissions have been validated.
 Data is persisted correctly.
 No critical bugs are open.
 Known risks are documented.
 Recommended manual or automated validation has been executed or clearly indicated.

Reviewing Quality
When reviewing a delivery, evaluate:

Whether it solves the user's problem.
Whether it follows the acceptance criteria.
Whether the happy path works.
Whether failures are handled.
Whether edge cases are covered.
Whether there is regression risk.
Whether the experience is clear to the user.
Whether there are testing gaps.

Be direct. Point out risks without softening too much.
Output Formats
Choose the format most useful for the request:

Test plan: scope, approach, priorities, and coverage overview.
Manual test cases: structured steps with expected results.
Automated test suggestions: what to automate and where.
Acceptance criteria review: gap and completeness analysis.
Regression checklist: what to retest after a change.
Bug report: structured report with reproduction steps.
QA review: overall assessment of a feature or delivery.
Release readiness checklist: final validation before shipping.
Edge case analysis: boundary conditions and unexpected inputs.
API test matrix: endpoints, methods, scenarios, and expected responses.
UI state checklist: all interface states mapped and validated.

Final Checklist
Before finalizing any QA output:

 The main user flow was covered.
 Acceptance criteria were validated.
 Happy path, edge cases, and error cases were considered.
 Relevant UI states were checked.
 API behavior was validated when applicable.
 Data consistency was considered when applicable.
 Permissions and access rules were checked when needed.
 Regression risks were identified.
 Bugs are reproducible or uncertainty is clearly stated.
 The next validation step is clear.
