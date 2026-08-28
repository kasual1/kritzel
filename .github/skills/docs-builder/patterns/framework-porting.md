# Pattern: Framework Porting (Angular to React and Vue)

## Purpose

Use this pattern when documentation must be ported from Angular source pages to React and Vue pages.

Angular remains the source of truth. React and Vue pages should preserve meaning, structure, and navigation while translating framework-specific syntax and naming.

## Scope

- Source: website/docs/angular/*.md
- Targets: website/docs/react/*.md, website/docs/vue/*.md
- Typical pages: getting-started/*.md, fundamentals/*.md, fundamentals/components/*.md, advanced/*.md, customization/*.md, examples/*.md, api-reference/*.md

## Core Porting Rules

1. Preserve document structure.
- Keep the same heading hierarchy and section ordering unless framework-specific clarity requires a small adjustment.
- Keep conceptual content aligned across frameworks.

2. Translate framework naming in metadata and prose.
- Update frontmatter title, description, and keywords for React/Vue wording.
- Replace Angular-specific phrasing with React/Vue equivalents.

3. Use framework-specific component naming in React/Vue docs.
- In React and Vue markdown files, refer to the editor as <KritzelEditor>.
- Do not use <kritzel-editor> in React/Vue docs.

4. Convert code snippets to framework-appropriate syntax.
- React snippets: JSX/TSX patterns and React event/listener idioms.
- Vue snippets: SFC-style snippets where relevant (<script setup>, <template>).
- Keep API method names unchanged (changeActiveTool, zoomTo, centerObjectInViewport, etc.).

5. Use language fences consistently.
- In Vue docs, embedded component/template snippets must use html code fences.
- Use ts for pure TypeScript snippets and css for styles.

6. Keep links valid per framework docs tree.
- Ensure local links target existing docs in the same framework section.
- Prefer existing concept pages (for example advanced/collaboration, customization/theming) over non-existent short aliases.

## LiveDemo Porting Rules

When adding or porting <LiveDemo> blocks:

1. Keep the demo intent aligned with the Angular page.
- Preserve section placement and narrative around the demo.

2. Use framework-specific repository roots.
- React: https://github.com/kasual1/kritzel-demos/tree/main/react
- Vue: https://github.com/kasual1/kritzel-demos/tree/main/vue

3. Keep route semantics consistent.
- Reuse equivalent demoPath values from Angular where the route convention matches.

4. Use framework file extensions in repoFiles.
- React: .tsx
- Vue: .vue

5. Convert demo page filename casing to the target framework convention.
- Angular: kebab-case with `.component.ts` suffix (e.g. `workspaces-switch.component.ts`).
- React: PascalCase with `Page` suffix and `.tsx` (e.g. `WorkspacesSwitchPage.tsx`).
- Vue: PascalCase with `Page` suffix and `.vue` (e.g. `WorkspacesSwitchPage.vue`).
- Folder names stay kebab-case in all frameworks; non-component helper files (e.g. `concept-shared.ts`) stay kebab-case.

6. If demo source does not exist yet, placeholders are allowed when explicitly requested.
- Still add <LiveDemo> in markdown with expected target file paths.
- Ensure paths are plausible for the target framework layout.

7. Keep `demoPath`, router registration, and local docs config aligned.
- The target demo app must register the matching route.
- `repoFiles` must match the real file location in the demo project.
- For local docs preview, verify `website/docusaurus.config.ts` points to the framework's actual dev server port.

8. Prefer `demoPath` for framework-relative previews.
- Use `demoPath` with framework-aware base URLs unless an explicit absolute `iframeUrl` is required.
- Ensure `demoPath` starts with `/` and matches the router path exactly.

9. Port dynamic object demos as runtime-equivalent behavior, not syntax-only copies.
- Preserve `rendererKey` + `rendererData` lifecycle semantics in all frameworks.
- Keep mount/unmount cleanup symmetry and persisted state handoff behavior equivalent.
- In Vue targets, explicitly evaluate style encapsulation: prefer Vue custom-element based renderer strategies when embedded content styling would otherwise leak or fail.

## Quick Mapping Reference

- Package imports:
  - Angular: kritzel-angular
  - React: kritzel-react
  - Vue: kritzel-vue

- Root app container in quick-start CSS examples:
  - React: #root
  - Vue: #app

- Component mention style in docs text:
  - React/Vue: <KritzelEditor>

## Validation Checklist

After porting, verify:

1. No Angular-only naming remains in target docs where it is framework-specific.
2. React/Vue docs do not contain <kritzel-editor>.
3. Vue docs do not contain vue-fenced embedded snippets; use html for those snippets.
4. All intra-doc links resolve to existing pages.
5. <LiveDemo> blocks use correct framework repo URLs and file extensions.
6. Every `<LiveDemo demoPath="...">` resolves in the framework router.
7. `website/docusaurus.config.ts` local `demoBaseUrls` values match currently used framework dev ports.
8. `repoFiles` paths exist and reflect current folder structure (no stale `examples/` paths after moves).
9. For dynamic object demos, each framework documents equivalent renderer lifecycle behavior; Vue docs include explicit note about custom-element encapsulation strategy when relevant.

## Suggested Search Checks

- Find lowercase tag usage in React/Vue docs:
  - <kritzel-editor
- Find Vue fence usage in Vue docs:
  - ```vue
- Find Angular package references in React/Vue docs:
  - kritzel-angular
