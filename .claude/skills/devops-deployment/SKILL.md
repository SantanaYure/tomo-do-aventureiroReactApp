DevOps Deployment Skill
DevOps Goal
This skill helps carry software into real environments safely, predictably, and with recovery in mind. Every deployment decision should be traceable, repeatable, and reversible when possible.
Prioritize:

Safe releases over fast but risky deployment.
Repeatable processes over manual guesswork.
Environment consistency over local-only solutions.
Observability before blind production changes.
Rollback readiness before deployment confidence.
Security and secrets protection by default.
Existing project patterns over generic DevOps preferences.
Simplicity until operational complexity is justified.


Project Inspection First
Before proposing any build, deploy, or infrastructure change:

Inspect the current project structure.
Identify stack, package manager, scripts, framework, runtime, and version.
Read relevant configuration files.
Check for existing Dockerfile, docker-compose, CI/CD files, build scripts, or deploy documentation.
Identify existing environments: local, development, staging, test, and production.
Reuse patterns already present in the project.
Do not introduce new tools, services, or pipelines without a clear need.
Do not propose cloud, Docker, Kubernetes, or complex CI/CD if the project does not need them.

If context is missing, infer from the project files first. Ask only when the missing information blocks a decision.

Deployment Context
Before deciding anything, identify:

What needs to be delivered.
Which environment will be affected.
Who uses that environment.
Which stack is being deployed.
Which external services are required.
Which environment variables are mandatory.
Which data or migrations are affected.
What risk exists if the deploy fails.
How to validate the deploy succeeded.
How to revert if something goes wrong.


Environments

Separate local, development, staging, test, and production when it makes sense.
Avoid behavior that only works on one person's machine.
Keep names and variables consistent across environments.
Staging should mirror production when the risk is relevant.
Do not use real sensitive data in local or test environments.
Document meaningful differences between environments.
Do not mix production configuration with development.


Configuration and Secrets

Never hardcode secrets, tokens, passwords, private keys, or credentials.
Use environment variables or the existing secrets management system.
Validate required configuration at startup when possible.
Separate public configuration from private.
Do not commit .env files containing real secrets.
Provide a .env.example without sensitive values when useful.
Avoid logs that expose secrets.
Rotate secrets when exposure is suspected.
Treat production keys with significantly more care than local keys.


Build and Packaging

Use existing build, lint, test, and typecheck scripts.
Ensure the build is reproducible.
Avoid depending on invisible local state.
Pin versions when necessary to prevent inconsistent builds.
Separate production and development dependencies when applicable.
Do not ignore important build warnings.
Validate generated artifacts before deploying.
For mobile apps, consider profiles, signing, bundle identifiers, app versions, and build numbers when applicable.


CI/CD Pipelines

Automate only what reduces risk or repetition.
The pipeline must validate before publishing.
Include steps such as install, lint, typecheck, test, build, and deploy as appropriate for the project.
Separate pull request, staging, and production pipelines when it makes sense.
Avoid automatic deployment to production without validation when risk is high.
Use the CI/CD provider's secrets system. Never store secrets in the repository.
Pipeline failures should block releases when they signal real risk.
Keep pipelines simple and readable.


Docker and Containers

Use Docker when it improves consistency, deployment, or onboarding.
Do not add Docker if the project does not need it.
Create small, predictable, and secure images.
Do not copy unnecessary files into the image.
Use .dockerignore.
Never include secrets inside the image.
Separate build-time variables from runtime environment variables.
Use health checks when appropriate.
In docker-compose, separate services, volumes, and variables with clarity.


Hosting and Infrastructure

Choose hosting based on the product's actual needs.
Consider simplicity, cost, scale, stack support, logs, rollback, backups, and operational burden.
Avoid complex infrastructure for simple MVPs.
Prefer managed services when they reduce operational load.
Document required resources: app, database, storage, queues, workers, cache, CDN.
Do not use Kubernetes without a clear need.
Evaluate lock-in, recurring cost, and maintainability.


Database Migrations in Production
Migrations in production are high-risk operations.

Review data loss risk before deploying.
Break destructive changes into stages when necessary.
Back up before risky migrations.
Avoid editing already-applied migrations.
Plan backfill when existing data is involved.
Ensure compatibility between old and new application versions when deploy and migration are not atomic.
Always have a rollback or mitigation plan.
Validate the migration in staging when possible.


Release Strategy

Define what is being released.
Confirm the version passed build, tests, and review.
Prefer small, reversible releases.
Use staging when the risk justifies it.
Consider feature flags when a change needs to be activated safely.
Do not bundle unrelated changes in the same release.
Communicate breaking changes when they affect users, clients, or integrations.
Record version, changelog, or release notes when useful.


Rollback and Recovery
Every significant deploy should have a rollback plan.

Know how to return to the previous version.
Know which changes are not easily reversible.
Separate code rollback, configuration rollback, and data rollback.
Do not promise simple rollback when there is a destructive migration.
Define the signals that require rollback.
Confirm that backups, snapshots, or restore points exist when critical data is involved.


Observability

The system must be observable before it is depended on in production.
Logs must help diagnose real failures.
Never log secrets or sensitive data.
Monitor errors, latency, uptime, jobs, queues, and integrations when applicable.
Use request IDs or correlation IDs when the project supports it.
Alerts should point to actionable problems, not generate noise.
Collect deployment metrics when possible: success, failure, duration, rollback.


Health Checks and Readiness

Add health checks when the deployment environment uses them.
Distinguish liveness from readiness when applicable.
Health checks should validate the minimum necessary.
Do not create heavy health checks that overload the database or external APIs.
Readiness can consider database, cache, queues, or critical dependencies.
The deployment should confirm the application is genuinely ready to receive traffic.


Security and Operational Safety

Use HTTPS in public environments.
Do not expose ports, dashboards, or internal endpoints without protection.
Apply least privilege to tokens, users, and services.
Review deployment permissions and production access.
Do not use personal credentials in shared automations.
Protect storage, buckets, logs, and backups.
Review dependencies and images for vulnerabilities when applicable.
Avoid destructive commands without clear confirmation.


Performance and Scaling

Do not scale prematurely.
Identify real or likely bottlenecks.
Separate app, workers, database, cache, and storage when there is a genuine need.
Consider CPU, memory, connection, and storage limits.
Use autoscaling only when the platform and product justify it.
Caching must have an invalidation strategy.
Scaling does not replace fixing bad queries, memory leaks, or poorly designed jobs.


Cost Awareness

Account for recurring costs: services, builds, storage, logs, database, bandwidth, and monitoring.
Avoid expensive solutions for small products or MVPs.
Prefer simple, sustainable options for the team.
Flag when a choice increases operational cost.
Do not choose a tool simply because it is popular.


Incident and Production Issue Handling

Stabilize the system before refactoring.
Identify impact, affected users, and observable signals.
Collect logs, metrics, and context before changing production.
Make small changes during incidents.
Avoid large deploys as a blind fix attempt.
Document probable cause, mitigation, and next steps.
After the incident, suggest prevention without blaming people.


Release Readiness
Before considering a deployment ready, verify:

Build passed.
Relevant tests passed.
Environment variables are configured.
Secrets are protected.
Migrations have been reviewed.
Logs and health checks are available.
Rollback has been planned.
Staging was validated when applicable.
Known risks are documented.
The next validation step is clear.


Output Formats
Choose the most useful format for the request:

Deployment plan
CI/CD pipeline proposal
Dockerfile review
Environment configuration checklist
Secrets management checklist
Production readiness review
Migration deployment plan
Rollback plan
Release checklist
Incident response plan
Hosting recommendation
Observability plan
DevOps code review


Decision Mode
User-directed mode — when the user has already defined platform, hosting, stack, or constraints:

Respect existing decisions.
Question only when there is real risk.
Do not swap tools or platforms based on personal preference.
Work within the stated constraints.

Claude-directed mode — when the user delegates decisions:

Choose simple, well-known, and easy-to-operate options.
State assumptions briefly.
Prefer lower operational burden for MVPs and small teams.
Avoid Kubernetes, microservices, or complex pipelines without need.
Ask only when missing information blocks progress.


Reviewing DevOps Changes
When reviewing DevOps changes, evaluate:

Whether the build remains reproducible.
Whether the deployment remains safe.
Whether secrets were not exposed.
Whether environments remain separated.
Whether CI/CD validates before publishing.
Whether migrations are safe.
Whether rollback is possible.
Whether logs, health checks, and monitoring exist when needed.
Whether the change adds operational complexity without clear benefit.
Whether deployment documentation was updated when necessary.

Be direct. Flag production risks clearly.

Final Checklist
Before finalizing any DevOps or deployment deliverable, verify:

 The deployment process is repeatable.
 The target environment is clear.
 Required environment variables are known and safely handled.
 Secrets are not hardcoded or exposed.
 Build, lint, tests, or validations were considered.
 CI/CD changes are justified and understandable.
 Database migrations were reviewed for production risk.
 Health checks or validation steps confirm the app is running.
 Logs or observability are available for important failures.
 Rollback or recovery plan is clear.
 Security and access permissions were considered.
 Operational cost and complexity are justified.
 The next deployment or validation step is clear.