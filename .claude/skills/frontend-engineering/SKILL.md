Front-End Engineering Skill
This skill guides the construction of clean, responsive, accessible, and well-structured interfaces following modern front-end best practices.

Project Inspection First
Before creating or editing any code, inspect the existing project structure:

Reuse components, hooks, services, utils, and tokens already present in the project.
Follow the naming conventions, folder organization, and code style already in use.
Do not introduce new dependencies without a clear need.
Do not create a new abstraction if the project does not already use that pattern.
Do not create a new component if an equivalent one already exists.
Read related files before changing any behavior.


Before Writing Any Code
Always verify:

Which screen or component will be affected.
Whether a similar component already exists.
Which theme tokens apply (colors, spacing, typography, radius).
Whether the change affects responsiveness, accessibility, or global state.

If context is missing, first inspect the existing project files. Ask only one targeted question if the missing information blocks the task.

Core Principles

Separate logic, UI, and styles.
Build small, single-responsibility components.
Never hardcode visual values inside components.
Use theme tokens for all colors, spacing, fonts, and shadows.
Prioritize readability over premature abstraction.
Keep names clear and in English.
Avoid code duplication.
Do not change architecture without a clear reason.


Architecture Principles

Keep components small and focused.
Separate UI, state, business rules, and services.
Prefer clear names over clever abstractions.
Avoid duplication when it creates maintenance risk.
Apply Clean Code and SOLID principles only when they make the code simpler, clearer, or easier to change.
Do not introduce architectural layers without a clear need.
Do not add patterns just to make the code look more "architectural".
Favor the existing project architecture over generic best practices.


Component Standards

Each component has one primary responsibility.
Props must be explicit and typed.
Use local state only when the state is truly local.
Business rules belong outside the visual layer.
Screen-level components should primarily organize layout, flow, and composition. Keep business rules, heavy logic, and reusable styling decisions outside screens whenever possible.

Prop typing example (TypeScript):
tsxtype ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
};

Visual Style

Never use raw color values, font sizes, or spacing numbers directly in components.
Always reference theme.colors, theme.spacing, theme.typography, theme.radius.
Maintain visual consistency across buttons, cards, inputs, chips, and modals.
Interactive components must support the states relevant to their role and usage. Not every component needs all states; pick the ones that apply.

Reference for common states:
StateRequired behaviordefaultNormal visual appearanceloadingShow spinner or skeleton; disable interactionemptyShow placeholder or empty-state messageerrorShow error message, optionally a retry actiondisabledReduced opacity or muted color; no interactionsuccessPositive feedback (color, icon, or message)

React Native / Expo

Use StyleSheet.create for all styles.
Avoid inline styles except in rare, justified cases (e.g., dynamic values from props).
Prefer Pressable for custom tappable components.
Use SafeAreaView, react-native-safe-area-context, or the project's existing safe-area approach when screens touch device edges.
Use KeyboardAvoidingView or equivalent handling for forms with inputs.
Use FlatList for long lists; avoid ScrollView + .map() for large datasets.
Always provide a stable keyExtractor.
Avoid expensive calculations inside list item renders.
Memoize list item components only when there is a measured or obvious performance need.
Keep the render function free of heavy logic; extract to hooks or helpers.
When component logic becomes reused, hard to read, or mixes business behavior with UI rendering, extract it to a custom hook, helper, or service.

Custom hook pattern:
tsx// Example pattern only. Use the project's real types and services.
// useFileList.ts
type FileStatus = 'idle' | 'loading' | 'error' | 'success';

export function useFileList() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [status, setStatus] = useState<FileStatus>('idle');

  const loadFiles = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await fetchFiles();
      setFiles(result);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  return { files, status, loadFiles };
}

Accessibility

Every button must have a clear, descriptive label.
Tappable elements must have a comfortable touch area (minimum 44x44pt).
Maintain sufficient color contrast (WCAG AA minimum).
Never rely on color alone to communicate state — pair with text, icons, or patterns.
Use accessibilityLabel and accessibilityRole when native semantics are insufficient.


Editing Existing Code

Make the smallest change that solves the problem.
Preserve existing behavior unless explicitly asked to change it.
Do not rewrite entire files without a clear reason.
Do not refactor unrelated code while solving a specific task.
Do not rename files, move folders, or restructure modules unless the task requires it.
If you notice broader improvements, mention them separately instead of applying them immediately.
After editing, briefly explain what changed and why.
Suggest TypeScript validation or note any typing gaps introduced or found.


Final Checklist
Before delivering any code:

 Code compiles without errors or type warnings.
 All visual values come from theme tokens.
 The component has a single, clear responsibility.
 The change stays within the requested scope.
 No existing behavior was broken.
 Accessibility requirements are met.
 No new dependency was added without a clear need.
 Existing components were reused when possible.
 The current project structure was respected.
 No new pattern was introduced without a clear reason.
 No unrelated refactor was applied.
 Existing architecture was followed.
 Clean Code or SOLID ideas were applied only when they simplified the result.
 Relevant UI states were handled for the component's actual role.
