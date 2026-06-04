Security Review Skill
Security Goal
This skill helps identify and reduce security risks in software systems before they affect users, data, or production environments.
Prioritize:

Defensive review over offensive exploitation.
User and data protection over convenience.
Authorization before trusting user intent.
Secure defaults over optional protection.
Least privilege over broad access.
Explicit risks over vague warnings.
Practical remediation over theoretical security advice.
Existing project patterns over generic security checklists.

Authorized and Defensive Use
Security work must stay defensive and authorized.

Review only code, systems, configs, or flows the user is allowed to assess.
Do not provide exploit chains, payloads, malware, credential theft, persistence, evasion, or instructions for unauthorized access.
Focus on identifying risk, explaining impact, and recommending safe fixes.
When a risk is severe, state it clearly without giving harmful operational details.

Project Inspection First
Before reviewing security:

Inspect the existing project structure.
Identify stack, framework, auth system, API style, database, deployment, and configuration patterns.
Read related files before judging risk.
Reuse existing security patterns when they are adequate.
Do not introduce new security tools or libraries without a clear need.
Do not recommend major rewrites unless the current approach creates serious risk.

If context is missing, infer from code, config, requirements, or architecture first. Ask only when missing information blocks the review.
Security Context
Before giving recommendations, identify:

What asset needs protection.
Who can access it.
What actions are allowed.
What data is sensitive.
Which trust boundaries exist.
Which users, tenants, organizations, roles, or permissions matter.
Which external systems are involved.
What could go wrong if the feature is abused.
What risk matters most for the current stage of the product.

Authentication
Review whether identity is handled safely.
Check:

Protected routes require authentication.
Sessions, tokens, or cookies are validated server-side.
Token expiration and refresh behavior are safe.
Passwords are never stored in plaintext.
Password reset, email verification, and login flows resist abuse.
MFA or stronger authentication is considered when risk justifies it.
Authentication failures are logged safely without leaking sensitive data.
Cookie-based sessions must consider HttpOnly, Secure, SameSite, expiration, and CSRF protection.
CSRF risks must be reviewed when authentication relies on cookies.

Authorization and Access Control
Authorization is often the highest-risk area.
Check:

Every protected action verifies permission server-side.
Ownership is never trusted from the client.
Role, tenant, organization, and account boundaries are enforced.
Users cannot access or modify another user's data.
Admin or privileged actions have explicit checks.
Permission rules are close to the action being protected.
Default behavior denies access when permission is unclear.

Authentication answers who the user is. Authorization answers what they can do. Review both.
Input Validation and Injection Risks
Check all external input before it reaches business logic, queries, commands, files, or integrations.
Review:

Required fields.
Types and formats.
Length limits.
Allowed values.
File names and paths.
Query params and filters.
JSON bodies.
Webhook payloads.
SQL injection risks.
Command injection risks.
Path traversal risks.
Unsafe template or HTML rendering.
Server-side request forgery risks when URLs are accepted.

Validate at the boundary and fail safely.
Sensitive Data and Privacy
Identify and protect sensitive data.
Check:

Personal data.
Financial data.
Health or regulated data.
Tokens and credentials.
Private files.
Internal IDs when exposure creates risk.
Data retention needs.
Data deletion behavior.
Data minimization.

Do not store data that is not needed. Do not expose sensitive fields in API responses, logs, analytics, errors, screenshots, seeds, or test fixtures.
Secrets and Configuration
Review configuration safety.
Check:

Secrets are not hardcoded.
.env files with real secrets are not committed.
Public and private environment variables are separated.
Production secrets are stored in a secrets manager or platform secret system.
Secrets are not printed in logs.
Required configuration is validated at startup when possible.
Exposed secrets are rotated.
Local, staging, and production configs are not mixed.

API Security
When reviewing APIs, check:

Authentication and authorization.
Input validation.
Response shape.
Sensitive fields in responses.
Error messages.
Rate limiting for risky endpoints.
Pagination and query limits.
Ownership filters.
Breaking changes that weaken security.
CORS configuration.
Public endpoints.
Admin endpoints.
Webhook endpoints.
File download endpoints.

Errors should help clients recover without exposing internals.
Frontend Security
When reviewing frontend code, check:

No secrets are embedded in client code.
Public environment variables are safe to expose.
User-generated content is rendered safely.
Sensitive data is not stored unnecessarily in local storage.
Auth state does not replace server-side authorization.
Forms prevent accidental unsafe submission.
Destructive actions require confirmation.
External links and redirects are handled safely.
Error messages do not expose internals.

The frontend can improve safety, but it must not be the only security boundary.
Mobile Security
When reviewing mobile apps, check:

No secrets are embedded in the app bundle.
Tokens are stored using secure storage when available.
Sensitive data is not kept unnecessarily on the device.
Deep links and redirects are validated.
Local-only checks do not replace server-side authorization.

Backend Security
When reviewing backend code, check:

Route protection.
Authorization checks.
Business rules for sensitive actions.
Validation before persistence.
Safe error handling.
Safe logging.
Transaction safety for critical operations.
Rate limiting where relevant.
External service failures.
Secure handling of files, emails, payments, and notifications.

Sensitive operations should be explicit, auditable, and hard to trigger accidentally.
Database Security and Data Isolation
Check:

Ownership and tenant boundaries.
Row-level or query-level isolation when relevant.
Foreign keys and constraints for integrity.
Least privilege for database users.
No sensitive data in seeds.
No plaintext passwords or tokens.
Soft delete or hard delete behavior matches privacy and audit needs.
Migrations do not expose or destroy sensitive data unexpectedly.

Missing tenant or ownership filters are critical risks.
File Uploads and Storage
When files are involved, review:

File type validation.
Size limits.
File name handling.
Storage permissions.
Public vs private access.
Signed URLs and expiration.
Malware scanning when risk justifies it.
Path traversal risks.
Overwrite risks.
Sensitive metadata exposure.
Deletion behavior.

Never trust file extension alone.
Webhooks and Integrations
For integrations, check:

Webhook signatures are validated when supported.
Events are idempotent.
Duplicate delivery is handled safely.
Retries do not create duplicate side effects.
External failures do not expose sensitive data.
API keys and tokens are stored safely.
Rate limits and timeouts are handled.
External data is validated before use.
Integration assumptions are documented.

Treat external systems as untrusted until verified.
Dependency and Supply Chain Security
Review dependencies and tooling.
Check:

New dependencies are necessary.
Packages are maintained.
Known vulnerabilities are considered.
Lockfiles are respected.
Install scripts or transitive risks are considered when relevant.
Images and base containers are not outdated without reason.
Dependency updates do not silently change security behavior.
Licenses or operational risks are noted when relevant.

Do not add security tools just to look safer. Use them when they reduce real risk.
Infrastructure and Deployment Security
Review production and deployment risks.
Check:

HTTPS in public environments.
Secrets handled by the platform, not committed.
Least privilege for deploy tokens and service accounts.
Production access is limited.
Internal dashboards, ports, logs, and admin panels are protected.
Backups and storage are not publicly exposed.
CI/CD does not leak secrets.
Build artifacts do not include sensitive files.
Rollback and incident response are possible.

Security includes how the system is operated, not only the code.
Logging, Monitoring, and Auditability
Logs should help security without leaking secrets.
Check:

Sensitive data is not logged.
Authentication and authorization failures are logged safely.
Important privileged actions are auditable.
Destructive actions leave enough trace to investigate.
Logs include useful context without exposing private data.
Alerts exist for suspicious or high-impact failures when relevant.
Monitoring does not create noise without actionability.

Abuse Prevention
Review behavior that can be abused.
Consider protections for:

Login attempts.
Password reset.
Signup.
Email or SMS sending.
Payment actions.
File processing.
Public search.
Expensive API calls.
Bulk actions.
Admin actions.
Webhooks.

Use rate limiting, quotas, confirmation, captchas, review steps, or moderation only when the risk justifies it.
Security Risk Levels
Use risk levels when useful:

Critical: likely data leak, account takeover, privilege escalation, payment abuse, destructive production impact, or severe tenant isolation failure.
High: serious security weakness that can affect users, data, permissions, or production behavior.
Medium: meaningful weakness that may become serious with scale, misuse, or adjacent bugs.
Low: hardening, clarity, defense-in-depth, or minor exposure with limited impact.

Explain impact and recommended fix for each risk.
Security Review Evidence
When reporting a security issue:

Reference the affected file, endpoint, component, config, behavior, or flow when possible.
Explain why it is risky.
Explain likely impact.
Suggest a safe fix.
Suggest validation steps.
Avoid vague comments without evidence.

Remediation Guidance
Recommendations should be practical.
For each important issue, include:

What to change.
Where to change it.
Why it matters.
How to validate the fix.
Whether it blocks release.
Whether a temporary mitigation is acceptable.

Do not only say "make it secure". Be specific.
Reviewing Security
When reviewing a feature, codebase, or change, evaluate:

Authentication.
Authorization.
Data exposure.
Sensitive data handling.
Input validation.
API behavior.
Frontend exposure.
Backend enforcement.
Database isolation.
Secrets and configuration.
Dependencies.
Logging.
File handling.
Integrations.
Deployment risks.
Abuse scenarios.
Missing tests or validation.

Be direct. Do not soften serious risks.
Output Formats
Choose the most useful format for the request:

Security review.
Risk assessment.
Security checklist.
Authentication and authorization review.
API security review.
Frontend security review.
Backend security review.
Database isolation review.
Secrets review.
Dependency security review.
Production security readiness review.
Remediation plan.
Release blocking security issues.
Security test cases.

Decision Mode
User-directed mode
When the user defines stack, constraints, or risk tolerance:

Respect the given constraints.
Challenge only when there is meaningful risk.
Do not replace tools or architecture without a clear security reason.
Work within the project's stage and resources.

Claude-directed mode
When the user delegates decisions:

Choose practical defensive defaults.
Prefer simple, proven protections.
State assumptions briefly.
Prioritize risks that affect real users, data, money, access, or production.
Avoid heavy security infrastructure unless the risk justifies it.
Ask only when missing information blocks a safe assessment.

Final Checklist
Before finishing any security review, verify:

 Authentication was considered where needed.
 Authorization and ownership boundaries were reviewed.
 Sensitive data exposure was checked.
 Secrets and configuration were reviewed.
 Input validation and injection risks were considered.
 API responses and errors do not expose sensitive internals.
 Frontend code does not contain secrets or rely on client-only security.
 Backend enforcement exists for protected behavior.
 Database ownership or tenant isolation was considered when relevant.
 Logs do not expose secrets or sensitive data.
 Dependencies and deployment risks were considered.
 Abuse scenarios were considered for risky flows.
 Risks are ranked by severity.
 Release-blocking issues are clearly identified.
 Suggested fixes are practical and verifiable.
 Security-sensitive flows have validation or test recommendations.
