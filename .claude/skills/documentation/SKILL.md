Documentation Skill
Documentation Goal
This skill helps produce documentation that is clear, accurate, and useful for real people with real tasks to complete.
Prioritize:

Accuracy over volume.
Clarity over completeness for its own sake.
Actionable instructions over vague explanations.
Current project reality over idealized documentation.
Practical examples over abstract descriptions.
Maintenance value over decorative writing.
The reader's context before the writer's preference.

Project Inspection First
Before writing anything, inspect the project:

Read existing files: README, docs, package files, scripts, config, API routes, migrations, deployment files, architecture notes.
Identify the real stack, commands, environments, dependencies, and patterns.
Do not invent commands, variables, endpoints, or flows.
Do not document behavior that has not been confirmed.
Reuse existing format and style when present.
Update existing docs when that makes more sense than creating new files.

If context is missing, infer from project files first. Ask only when missing information would produce incorrect documentation.
Documentation Audience
Identify the reader before writing:

New developer
Current maintainer
Product manager
Designer
QA
DevOps
Client
End user
Future version of the same team

Use the right level of detail for each reader. Deep technical docs are wrong for end users. Surface-level guides are wrong for developers who need to run the system.
Documentation Context
Before delivering any doc, identify:

What problem the documentation solves.
Who will use it.
When it will be used.
What action the reader needs to complete.
What prerequisites exist.
Which files, commands, or systems are relevant.
What risks exist if the documentation is wrong.

README Documentation
A good README includes, when relevant:

Project name and purpose.
What the project does.
Main stack and requirements.
Local setup.
Environment variables.
Available scripts.
How to run.
How to test.
How to build.
Basic project structure.
Deployment notes or link to deployment docs.
Troubleshooting.
Useful links or related docs.

If a README becomes too long, split it into specific files and link from the README.
Setup and Onboarding Guides
Guides must be executable by someone new to the project.
Include:

Prerequisites.
Installation steps.
Environment setup.
Database setup when needed.
Seed or test data when needed.
How to run locally.
How to verify that it works.
Common setup problems.
Platform-specific notes when relevant.

Every command must be clear and in the correct order.
API Documentation
When documenting APIs, include:

Base URL or context.
Authentication requirements.
Endpoint path and method.
Request params, query params, headers, and body.
Response shape.
Status codes.
Error responses.
Permission rules.
Pagination, filtering, and sorting when relevant.
Examples with realistic but fake data.
Breaking changes or versioning notes when applicable.

Never expose secrets, real tokens, or sensitive data in examples.
Architecture Documentation
Document architecture to explain decisions and system navigation.
Include when relevant:

System overview.
Main modules and responsibilities.
Data flow.
Integration points.
Where business rules live.
Where configuration lives.
Important boundaries.
Trade-offs.
Known limitations.
Links to ADRs when available.

Document how the project actually works, not how it ideally should.
ADRs
Use ADRs for meaningful decisions, not small implementation details.
Recommended format:
md# ADR: [Decision title]

## Context
What problem or situation led to this decision?

## Decision
What was decided?

## Alternatives Considered
What options were considered?

## Reasoning
Why was this option chosen?

## Consequences
What becomes easier? What becomes harder?

## Risks
What could go wrong?

## When to Revisit
What signal should trigger review of this decision?
Deployment Documentation
Deployment docs must include:

Target environment.
Required services.
Required environment variables.
Build steps.
Deploy steps.
Database migration steps.
Health checks or validation steps.
Rollback notes.
Logs and monitoring location.
Known risks.

Never include real secrets.
Environment and Secrets Documentation
Document configuration without leaking secrets.
Include:

Required variables.
Optional variables.
Public vs private configuration.
Example values only when safe.
.env.example guidance.
Where secrets should be configured.
Startup validation notes when relevant.

Never include real tokens, passwords, private keys, or credentials.
Changelog and Release Notes
Changelog must be useful for understanding what changed between versions.
Include relevant sections:

Added
Changed
Fixed
Removed
Deprecated
Security
Breaking changes
Migration notes when needed

Release notes should focus on impact for the user, client, or operation, not just raw commits.
Troubleshooting
Troubleshooting guides must be practical.
For each problem, include:

Symptom.
Likely cause.
How to verify.
How to fix.
Related logs or commands.
When to escalate.

Avoid generic solutions that do not help diagnose the actual issue.
User and Client-Facing Documentation
When documenting for users or clients:

Avoid unnecessary internal details.
Explain what the person can do.
Use clear language.
Include steps and examples.
Explain important limitations.
Do not promise behavior the product does not deliver.
Keep user guides separate from technical documentation.

Handoff Documentation
For handoff, include:

Project overview.
Current status.
What is working.
What is incomplete.
How to run.
How to deploy.
Important decisions.
Known risks.
Next steps.
Key files and folders.
Contacts or ownership placeholders when useful.

Handoff must allow another person to continue the work without relying on informal memory.
Accuracy and Source of Truth
Documentation must reflect the real project.

Prefer facts from files over assumptions.
Mark assumptions clearly when unavoidable.
Do not invent missing behavior.
Remove or update outdated information.
Avoid duplicate documentation that can drift.
Link to source files or related docs when useful.
If code and docs conflict, mention the conflict and recommend verification.

Documentation Maintenance
Keep documentation easy to maintain.

Keep docs close to what they explain when appropriate.
Split long docs by purpose.
Avoid repeating the same information in multiple places.
Use stable section names.
Add update notes when behavior changes.
Prefer concise docs that people will actually maintain.

Examples and Formatting
Use examples when they improve understanding.

Use realistic fake data.
Keep examples minimal.
Prefer commands that can be copied safely.
Use tables for reference material.
Use numbered steps for procedures.
Use checklists for validation.
Use text diagrams only when they clarify structure.

Reviewing Documentation
When reviewing docs, evaluate:

Accuracy.
Completeness for the intended reader.
Missing prerequisites.
Outdated commands.
Unsafe secrets or sensitive data.
Unclear steps.
Incorrect assumptions.
Broken links or references.
Excessive length.
Missing troubleshooting.
Whether the reader can complete the intended task.

Be direct. If the documentation could cause an error, say so clearly.
Output Formats
Choose the most useful format for the request:

README
Setup guide
API documentation
Architecture overview
ADR
Changelog
Release notes
Troubleshooting guide
Deployment guide
Environment variables guide
Handoff document
User guide
Client-facing guide
Documentation review
Documentation update plan

Decision Mode
User-directed mode
When the user defines format, audience, or style:

Follow the user's direction.
Preserve existing structure when it makes sense.
Ask only when missing information could make the documentation incorrect.

Claude-directed mode
When the user delegates:

Choose the most useful format.
State assumptions briefly.
Prioritize practical documentation.
Avoid long documents when a short guide solves the problem.
Do not ask when a reasonable choice can be made.

Final Checklist
Before finalizing any documentation, verify:

 The intended audience is clear.
 The documentation solves a real reader need.
 Commands, scripts, endpoints, and variables were not invented.
 Setup or usage steps are actionable.
 Sensitive data and secrets are not exposed.
 Assumptions are marked clearly.
 Outdated or conflicting information was identified.
 The format fits the reader and task.
 The document is no longer than necessary.
 The next action for the reader is clear.
