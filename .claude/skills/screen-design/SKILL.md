Screen Design Skill
Design Goal
This skill helps create screens and pages that are clear, usable, consistent, and visually well-resolved. The goal is to turn ideas into structured, purposeful interfaces that serve real users in real flows.
Priorities, in order:

Clarity over decoration.
Usability over visual complexity.
Consistency over isolated creativity.
Real user flow over static appearance.
Purposeful visual decisions over generic aesthetics.

Every element on a screen must earn its place.
Avoid generic polished screens that look good but do not solve the user's specific flow.

Understanding the User's Vision
Before designing, identify what the user has already defined. Look for:

Platform (mobile, web, desktop, responsive).
Screen or page goal.
Target audience.
Visual style, mood, or references.
Content that must appear.
User flow and context (what happens before and after this screen).
Constraints (technical, brand, accessibility, time).

Rules for handling missing information:

If the user provides a clear direction, follow it.
If the user says to decide, choose sensible defaults and briefly state the assumptions made.
If the user gives partial direction, preserve it and decide the missing parts.
Ask targeted questions only when the desired result genuinely depends on missing information.
Do not ask many questions at once. One or two at most.
Do not block progress with unnecessary clarification. Move forward.


Visual References
When the user provides a visual reference, extract the underlying qualities instead of copying it directly:

Identify layout, mood, density, hierarchy, spacing, typography, and interaction patterns.
Preserve what the user likes about the reference.
Do not copy brand-specific elements, logos, protected characters, or distinctive proprietary visuals.
Translate references into an original screen direction.


Decision Ownership
There are two operating modes. Recognize which one applies.
User-directed mode
The user has defined preferences, references, or constraints.

Follow the user's visual preferences closely.
Ask one or a few targeted questions when a decision requires their input.
Preserve the intended mood, structure, and constraints.

Claude-directed mode
The user has delegated design decisions or has not specified a direction.

Make design decisions on behalf of the user.
Choose layout, hierarchy, spacing, components, states, and visual direction.
Use common product design patterns.
State key assumptions briefly before or after delivering the design.
Avoid asking questions unless missing information makes the design impossible to complete.
When deciding on behalf of the user, prefer safe, conventional patterns over unusual creative choices unless the user asks for a bold direction.


Before Designing
Verify the following before starting:

Screen or page purpose.
Main user action on this screen.
Target platform.
Audience.
Content that must appear.
Desired style or mood.
Existing design system or brand rules.
Required interface states.
Technical or implementation constraints.

If some of these are missing, apply the rules in "Understanding the User's Vision" above.

Content First
Design around real or expected content:

Identify the content types before choosing layout.
Do not design empty containers without knowing what they hold.
Prioritize content users need to decide or act.
Remove decorative content that does not support the task.


Visual Hierarchy
Every screen must have a clear reading order. Structure elements in this order of importance:

Title or context (where am I?).
Main content (what matters most here?).
Supporting information (what helps me understand or decide?).
Primary action (what should I do?).
Secondary actions (what else can I do?).
Feedback or system messages (what is the system telling me?).

Apply visual weight accordingly: size, contrast, spacing, and position should reflect hierarchy. The most important thing on a screen should be the most visually prominent.

Layout Principles

Use spacing intentionally. Whitespace creates structure, not emptiness.
Group related elements. Proximity signals relationship.
Avoid crowded layouts. If it feels tight, something needs to go or shrink.
Keep alignment consistent. Elements should share a clear grid.
Respect safe areas and responsive behavior.
Keep important actions easy to reach.
Avoid adding elements only to fill space. If it is not needed, remove it.


Design System
When a design system exists:

Reuse colors, typography, spacing, radius, shadows, and components.
Do not invent new visual styles without a clear reason.
Follow existing patterns. Consistency is more valuable than creativity here.

When no design system exists:

Define a minimal visual system before designing.
Limit the number of colors, font sizes, and component variants.
Prefer consistency over variety. A simple system applied consistently beats a complex one applied inconsistently.


Screen and Page Patterns
Use familiar patterns when they are sufficient. Do not reinvent interactions that users already understand.
Common patterns to consider:

Cards: information grouped in a contained surface.
Lists: repeated items in a vertical or horizontal sequence.
Forms: input fields, labels, validation, and submission.
Tables: structured data with rows and columns.
Filters: narrowing down a dataset or list.
Chips: compact, selectable or removable tags.
Tabs: switching between sections within the same context.
Navigation bars: primary app or site navigation.
Bottom sheets: contextual actions or content drawn up from the bottom.
Modals: focused overlays requiring acknowledgment or action.
Banners: persistent or dismissible status messages.
Empty states: what the screen shows when there is no content.
Loading states: feedback during asynchronous operations.
Error states: when something goes wrong.
Success states: confirmation that an action completed.
Onboarding steps: progressive disclosure of a product or feature.

Choose the pattern that fits the content and user intent. Do not use a pattern just because it looks interesting.

Mobile Design

One main task per screen. Do not try to do too much in one place.
Touch targets should be large enough to tap comfortably (at least 44x44pt).
Avoid dense text. Line length and font size matter more on small screens.
Keep main actions reachable by thumb. Bottom-heavy layouts work better for one-handed use.
Use scrolling intentionally. Not everything needs to fit above the fold, but the most important content should.
Consider safe areas: status bar, notch, home indicator, and keyboard.
For forms, account for keyboard behavior: sticky actions, scrollable fields, and input types.


Web Page Design

Establish a clear page structure: header, main content, and footer with defined roles.
Sections should be responsive and adapt cleanly across breakpoints.
Above-the-fold content should communicate the page purpose and prompt action.
Use a strong heading hierarchy (H1 > H2 > H3). Do not skip levels.
The primary CTA should be visible, clearly labeled, and not compete with secondary elements.
Apply a consistent grid and spacing system across the page.
Avoid visual clutter. Each section should have a single focus.


Accessibility and Usability

Text and interactive elements must have strong contrast against their background.
Use readable body text sizes appropriate to the platform, commonly around 16px on web and 14 to 16pt on mobile.
Labels must be clear and visible. Placeholder text does not replace a label.
Do not rely on color alone to communicate status or meaning.
Icons used without text labels must be unambiguous. When in doubt, add a label.
Error messages must explain what went wrong and how to fix it.
Design to prevent mistakes: destructive actions need confirmation, inputs should have clear formats, and validation should happen inline when possible.


Delivering a Design
When creating a screen or page, deliver the following as relevant:

Screen or page purpose.
Layout structure (how the screen is organized spatially).
Visual hierarchy (what stands out and in what order).
Main sections and their content.
Components used and their states.
Primary and secondary actions.
Interface states covered (empty, loading, error, success, etc.).
Responsive behavior if applicable.
Implementation notes when they clarify intent.

Describe from top to bottom when a linear structure helps the reader follow the design.
Do not present a wall of bullet points when prose is clearer. Use the format that communicates the design best.
When useful, specify the level of fidelity:

Low fidelity for structure and flow.
Medium fidelity for layout, hierarchy, and components.
High fidelity for visual direction, spacing, typography, color, and states.


Output Format Control
Choose the output format based on the user's need:

Use a concise screen specification when the user needs implementation guidance.
Use a top-to-bottom visual description when the user wants to imagine the screen.
Use a structured critique when reviewing an existing design.
Use a component breakdown when the next step is coding.
Use a wireframe-style outline when layout clarity matters more than visual polish.

Do not over-document simple screens.

Reviewing a Design
When reviewing an existing design, evaluate:

Clarity: is the purpose of the screen immediately understandable?
Hierarchy: does the most important content draw attention first?
Spacing: is whitespace used intentionally, or is the layout crowded or unbalanced?
Alignment: are elements consistently aligned to a grid?
Consistency: do colors, type, and components follow a single system?
Usability: can users complete their task without confusion?
Accessibility: does the design work for users with visual or motor limitations?
Missing states: are empty, loading, error, and success states accounted for?
Unnecessary elements: is anything on screen that adds no value?

Be direct and practical. Point out weak decisions clearly. Do not praise choices that do not work in order to soften feedback.

Final Checklist
Before delivering or finalizing a design, verify:

 The screen or page has one clear purpose.
 The main action is obvious and easy to reach.
 The visual hierarchy is easy to follow from top to bottom.
 Layout and spacing are consistent throughout.
 The design follows the existing system, or defines a minimal one.
 Relevant interface states are considered and handled.
 Accessibility and readability are respected.
 The user's stated preferences were followed.
 Claude made reasonable decisions where the user delegated them.
 No unnecessary elements were added.
