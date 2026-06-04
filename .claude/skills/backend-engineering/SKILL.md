Backend Engineering Skill
This skill guides the construction of clean, reliable, and well-structured backend systems following professional engineering standards.

Project Inspection First
Before creating or editing any code, inspect the existing project structure:

Reuse services, repositories, helpers, middlewares, and utilities already present.
Follow the naming conventions, folder organization, and code style already in use.
Do not introduce new dependencies without a clear need.
Do not create a new abstraction if the project does not already use that pattern.
Read related files before changing any behavior.


Backend Context
Before writing anything, verify:

Which layer is being affected: routing, controller, service, repository, or infrastructure.
Whether the logic already exists somewhere in the codebase.
Which database, ORM, or data access pattern the project uses.
Whether the change affects existing API contracts or integrations.

If context is missing, inspect the existing project files first. Ask only one targeted question if the missing information blocks the task.

Configuration and Environments
Handle configuration deliberately across environments.

Keep environment-specific values outside source code.
Use environment variables or the project's existing configuration system.
Separate development, staging, test, and production behavior when needed.
Never hardcode secrets, credentials, tokens, or private keys.
Validate required configuration at startup when possible.
Avoid behavior that works only in one local environment unless explicitly intended.

Backend code should be predictable across environments.

Core Principles

Separate concerns: routing, business logic, data access, and infrastructure each belong in their own layer.
Keep functions and methods focused on a single responsibility.
Prefer explicit over implicit behavior.
Write code that is easy to read, test, and change.
Keep names clear and in English.
Do not change architecture without a clear reason.
Favor the existing project patterns over generic best practices.


Architecture Principles

Keep services and modules small and focused.
Separate business rules from infrastructure details.
Avoid shared mutable state across service boundaries.
Apply Clean Code and SOLID principles only when they make the code simpler, clearer, or easier to change.
Do not introduce architectural layers without a clear need.
Do not add patterns just to make the code look more "architectural".
Favor the existing project architecture over generic best practices.


Business Rules
Keep business rules explicit, testable, and separate from infrastructure.

Business logic belongs in the service or domain layer, not in controllers, route handlers, or database queries.
Do not spread business rules across multiple layers without a clear reason.
Name functions and methods after what they do in the domain, not after how they do it technically.
Validate business constraints explicitly: do not rely on database errors or implicit side effects to enforce rules.
When business rules change frequently, isolate them so changes are localized.
Write unit tests for business logic independently of the HTTP layer, database, or external services.

Business rules should be readable by someone who understands the domain, not just the implementation.

API Design

Use consistent naming, versioning, and response shapes across the API.
Return appropriate HTTP status codes for success, client errors, and server errors.
Validate all input before processing.
Return clear, actionable error messages without exposing internal details.
Keep endpoints focused: one endpoint does one thing well.
Document behavior changes, especially breaking ones.


API Versioning and Compatibility
When changing API behavior:

Preserve existing API contracts unless a breaking change is explicitly required.
Avoid changing response shapes silently.
Keep frontend, mobile apps, integrations, and external clients in mind.
Use versioning when breaking changes cannot be avoided.
Mark deprecated behavior clearly when the project supports it.
Explain migration steps when a client must change.

Backend changes should not break existing clients by accident.

Authentication and Authorization

Never trust input from the client to determine identity or permissions.
Validate tokens and sessions on every request that requires authentication.
Apply authorization checks as close to the protected resource as possible.
Do not expose user-specific data across account boundaries.
Store credentials and secrets safely: hashed passwords, encrypted tokens, no plaintext.
Handle token expiration, revocation, and refresh correctly.
Log authentication failures in ways that are useful without exposing sensitive data.


Rate Limiting and Abuse Prevention
Protect backend resources from misuse and excessive traffic.

Consider rate limiting for authentication, public endpoints, expensive operations, and write-heavy actions.
Prevent brute force attempts on login, password reset, verification, and token flows.
Validate payload size and avoid accepting unnecessarily large requests.
Be careful with endpoints that trigger emails, notifications, payments, file processing, or external API calls.
Do not add complex abuse-prevention infrastructure unless the risk justifies it.

Security should account for both normal users and abusive behavior.

Validation and Error Handling

Validate all incoming data at the boundary: type, shape, required fields, and constraints.
Return consistent error response structures across the entire API.
Distinguish between client errors (4xx) and server errors (5xx).
Do not let unhandled exceptions reach the client with stack traces or internal details.
Handle third-party failures gracefully: timeouts, unavailability, and unexpected responses.
Use domain-specific error types when the project supports that pattern.


Security

Sanitize and validate all external input before using it in queries, commands, or file operations.
Protect against SQL injection, command injection, path traversal, and similar vulnerabilities.
Do not expose internal implementation details in error messages.
Apply the principle of least privilege to database users, API keys, and service roles.
Use HTTPS for all external communication.
Review third-party dependencies for known vulnerabilities when adding new ones.


Data and Database

Keep database queries consistent with the project's existing data access pattern.
Avoid N+1 queries; load related data efficiently.
Use transactions for operations that must succeed or fail together.
Do not put business logic inside SQL queries or stored procedures unless the project already follows that pattern.
Use migrations for schema changes; never modify a production schema manually.
Index columns used frequently in filters, lookups, and joins.
Treat database credentials as secrets: never hardcode them.


Performance and Reliability

Identify the actual performance bottleneck before optimizing.
Cache only when caching reduces a real, measured problem.
Handle slow or unavailable external services with timeouts, retries, and circuit-breaking when appropriate.
Avoid blocking operations in request handlers when the project supports async patterns.
Test behavior under failure conditions, not just the happy path.
Consider the behavior of the system when a queue, cache, or external dependency is unavailable.


Observability
Make backend behavior understandable in development and production.

Add useful logs around important failures, state changes, and external integrations.
Do not log secrets, tokens, passwords, private keys, or sensitive personal data.
Include enough context to debug issues without exposing private information.
Consider metrics for high-value flows, failures, latency, and background jobs.
Use tracing or request identifiers when the existing project supports them.
Record audit logs for sensitive actions when needed, such as permission changes, deletions, payments, or ownership changes.

Observability should help diagnose real problems without creating noise or privacy risks.

Background Jobs and Queues

Design jobs to be idempotent when possible: running a job twice should not cause duplicate side effects.
Handle job failures explicitly: retries, dead-letter queues, and alerting.
Do not put complex business logic directly inside job runners; delegate to services.
Log job start, completion, and failure with enough context to diagnose issues.
Avoid jobs that depend on shared in-memory state between runs.


Webhooks and Integrations
Handle incoming and outgoing events reliably.

Validate webhook signatures before processing any payload.
Design webhook handlers to be idempotent: receiving the same event twice must not cause duplicate side effects.
Return a 2xx response quickly and process the event asynchronously when the work is non-trivial.
Store received events or use idempotency keys when duplicate delivery is a real risk.
Handle retries from the sender: the same event will arrive more than once under normal conditions.
For outgoing integrations, handle timeouts, failures, and rate limits from external services explicitly.
Do not let a failing integration break core application behavior unless it is a required dependency.


Editing Existing Code

Make the smallest change that solves the problem.
Preserve existing behavior unless explicitly asked to change it.
Do not rewrite entire files without a clear reason.
Do not refactor unrelated code while solving a specific task.
Do not rename files, move folders, or restructure modules unless the task requires it.
If you notice broader improvements, mention them separately instead of applying them immediately.
After editing, briefly explain what changed and why.


Reviewing Backend Code
When reviewing existing code rather than writing new code:

Identify correctness issues first: logic errors, missing validations, unhandled failures, and security gaps.
Then identify maintainability issues: unclear naming, scattered business logic, missing error handling, and untested paths.
Separate must-fix issues from optional improvements.
Do not rewrite working code just to match a preferred style.
Suggest improvements with enough context to explain why they matter.
Acknowledge what is already working well.


Output Formats
Match the output to what the task actually requires.
TaskOutputBuild or fix a featureWorking code with a brief explanationReview existing codeStructured list of issues: correctness first, then maintainabilityPlan a refactorRefactor plan with scope, steps, and risksDesign an APIAPI spec with endpoints, inputs, outputs, and status codesWrite testsTest plan or test cases covering happy paths, edge cases, and failuresExplain behaviorClear prose or annotated code, no unnecessary scaffolding
When the task is ambiguous, produce the most useful output for the stated goal and explain the choice briefly.

Final Checklist
Before delivering any code:

 Code is correct and handles both success and failure cases.
 All input is validated before being processed.
 Authentication and authorization are enforced where needed.
 No secrets, credentials, or tokens are hardcoded.
 Error responses are consistent and do not expose internal details.
 No existing API contract was silently broken.
 Database queries are in the data access layer and avoid N+1 patterns.
 The change stays within the requested scope.
 No new dependency was added without a clear need.
 Existing architecture and patterns were followed.
 No unrelated refactor was applied.
 API compatibility or versioning was considered when behavior changed.
 Abuse prevention or rate limiting was considered for risky endpoints.
 Logs or observability were considered for important backend flows.
 Configuration and environment-specific values are handled safely.
