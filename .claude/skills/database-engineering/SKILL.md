Database Design Skill
Database Goal
This skill helps produce databases that are clear, consistent, safe, and easy to evolve. A well-designed database protects the integrity of the product's data, expresses business rules at the storage level, and makes future changes predictable.
Prioritize in this order:

Data integrity over convenience.
Clear relationships over clever shortcuts.
Safe migrations over risky schema changes.
Query needs over abstract modeling.
Existing project patterns over generic best practices.
Simplicity until complexity is justified.


Project Inspection First
Before creating or changing any schema, inspect the project:

Identify the database in use (PostgreSQL, MySQL, SQLite, etc.).
Identify the ORM, query builder, or migration tool in use.
Read existing migrations, models, repositories, and seeds before making any changes.
Reuse naming conventions, field patterns, and structural decisions already present in the project.
Do not introduce new tools or abstractions without a clear reason.
Preserve backwards compatibility whenever possible.

If context is missing, inspect the project first. Ask questions only when the missing information would block a decision.

Data Context
Before modeling any table or entity, identify:

Which entities exist in this domain.
What data needs to be persisted and why.
Who creates, reads, updates, or removes each piece of data.
What relationships exist between entities.
Which business rules depend on the data.
Which queries will run frequently.
What data volumes are expected.
Which fields are sensitive or regulated.
What audit, history, or recovery requirements exist.

Do not start creating tables before understanding the product's behavior.

Entity and Relationship Modeling
When modeling entities and relationships:

Name tables and columns clearly and consistently. Use the same conventions already present in the project.
Define primary keys explicitly. Prefer surrogate keys unless the domain has a natural stable identifier.
Model 1:1, 1:N, and N:N relationships accurately. Use junction tables for N:N.
Avoid ambiguous column names. A column named status in isolation says nothing; a column named order_status or payment_status is clear.
Avoid duplicating data without a documented reason.
Represent ownership, status, and lifecycle states explicitly in the schema.
Prefer simpler models when the domain is still uncertain. Add complexity when justified.


Data Types
Choose data types deliberately:

Use precise types for dates, money, booleans, enums, IDs, and numeric values.
Avoid storing structured data as plain text when the database supports better options.
Be careful with floating-point values for money. Use decimal or integer types instead.
Use enums or constrained values when the domain has a fixed set of states.
Prefer database types that match the meaning of the data.


Status and State Modeling
Model lifecycle states explicitly:

Define valid states and transitions before choosing how to represent them.
Avoid vague status values like active, inactive, or 1, 0 without clear meaning.
Do not use multiple booleans when a single state field is clearer.
Ensure constraints or business rules prevent impossible state combinations.


Constraints and Data Integrity
Constraints protect the database from invalid states that application code might miss:

Apply NOT NULL when a field is required.
Apply UNIQUE when duplicates are invalid.
Use foreign keys when the database and project support them. Define ON DELETE and ON UPDATE behavior intentionally.
Do not rely exclusively on application-layer validation for critical integrity rules. When it matters, protect at the database level too.
Validate in the backend and enforce in the database when both layers are justified.


Normalization and Denormalization

Normalize to avoid inconsistency. Each piece of data should have one authoritative location.
Denormalize only when there is a clear, measured reason — typically query performance at scale or read simplification.
Do not optimize prematurely. Normalization is the correct default.
When duplicating data, document the trade-off and define a strategy to keep derived data in sync.
While the product is still changing, prefer clarity over performance optimization.


Indexes and Query Performance

Create indexes based on actual or expected queries — not as a generic precaution.
Index columns used in WHERE filters, JOIN conditions, ORDER BY, and frequent lookups.
Avoid unnecessary indexes. Each index adds overhead to writes.
Consider composite indexes when a query consistently filters or sorts by multiple columns together.
Evaluate the write impact, not just the read benefit.
Do not add indexes without understanding the queries they are meant to support.


Migrations and Schema Evolution
Migrations are how the database evolves alongside the product. Treat them as carefully as application code.

Write migrations that are small, explicit, and easy to review.
Avoid destructive changes without a clear plan. Dropping a column or table in production needs preparation.
Preserve existing data whenever possible. If a column changes type or meaning, migrate the data as part of the change.
For large or risky changes, split the work: add the new structure first, backfill data, then remove the old structure in a separate migration.
Support rollback when the migration tool allows it.
Never edit a migration that has already been applied to any environment. Create a new migration instead.
Document migration risks explicitly when deploying to production, especially for high-traffic or large tables.


Transactions and Consistency

Use transactions when multiple operations must succeed or fail together.
Avoid partial states. If creating an order requires inserting multiple rows, wrap them in a transaction.
Consider concurrent access in sensitive operations — especially for payments, inventory, permissions, ownership transfers, and deletions.
Use locks or optimistic concurrency strategies only when the use case requires it.
Do not complicate transaction logic without a clear reason.


Soft Delete, Hard Delete, and Auditability
Choose the deletion strategy based on the product's needs, not habit:

Use soft delete (deleted_at) when recovery, history, or audit trails matter.
Use hard delete when data retention is not required or when regulations mandate removal.
Do not apply soft delete to everything by default. Ask whether the data actually needs to be recoverable.
When using soft delete, define how deleted records affect queries, unique constraints, and foreign key relationships.
Consider audit fields consistently: created_at, updated_at, deleted_at, created_by, updated_by. Add them when relevant, not reflexively.


Multi-Tenant and Ownership

Model ownership explicitly when the product has users, accounts, organizations, or tenants.
Do not assume single-tenant if the product might grow into multi-tenant.
Add tenant_id, organization_id, or equivalent columns when the data scope requires it.
Ensure all queries filter by the correct scope. Missing a tenant filter is a data leak.
Review foreign key relationships to confirm they respect ownership boundaries.


Sensitive Data and Privacy

Identify sensitive data early in the design process.
Do not store data that is not necessary.
Never store passwords in plain text. Use a proper hashing algorithm.
Consider encryption, masking, or hashing for sensitive fields when appropriate.
Do not include real sensitive data in seeds or test fixtures.
Consider data retention and deletion requirements when they apply.


Seeds and Test Data

Write seeds that are useful for development and testing.
Keep seeds consistent with the schema's constraints. Seeds that violate constraints are a sign the constraints are not being tested.
Avoid seeds that only work in one specific local environment.
Separate example data, test fixtures, and production bootstrap data clearly.
Never use real user data or production records in seeds.


Reviewing Database Design
When reviewing an existing schema or database design, evaluate:

Whether entities and their purposes are clear.
Whether relationships are modeled correctly.
Whether data integrity is enforced at the right level.
Whether constraints are missing or redundant.
Whether indexes match the queries the product actually runs.
Whether migrations are safe to apply.
Whether data is duplicated without justification.
Whether sensitive data is handled appropriately.
Whether ownership or tenant scope is enforced consistently.
Whether the design fits the existing architecture.

Be direct. Point out data risks clearly and explain the consequences.

Output Formats
Depending on the request, deliver one or more of the following:

Schema proposal — Table definitions with columns, types, constraints, and indexes.
ERD-style explanation — Entities, relationships, and cardinalities described in plain text or diagram form.
Migration plan — Step-by-step sequence of schema changes with risk notes.
Table definition — A single table with full column specifications.
Relationship review — Analysis of how entities relate, with corrections if needed.
Indexing recommendation — Which indexes to add, remove, or change and why.
Data integrity review — Assessment of constraints, foreign keys, and validation gaps.
Query performance review — Analysis of slow or missing indexes relative to expected queries.
Seed data plan — What seed data to create and how to structure it.
Migration risk analysis — Risks of applying a migration to a live database, with mitigation steps.

Choose the format that best serves the request. Combine formats when a task requires it.

Final Checklist
Before finishing any database deliverable, verify:

 The entities are clear.
 Relationships are correctly modeled.
 Data types match the meaning of the data.
 Status and lifecycle states are modeled clearly.
 Required data is protected with appropriate constraints.
 Indexes match real or expected queries.
 Migrations are safe and reviewable.
 Data loss risks were considered.
 Sensitive data is handled carefully.
 Ownership or tenant boundaries are clear when needed.
 Existing project patterns were respected.
 The design is no more complex than necessary.
