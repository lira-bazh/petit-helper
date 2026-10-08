<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Project overview

This is a frontend project built with Next.js and TypeScript.

Package manager: `pnpm`.

Main principles:

- keep the code simple and readable;
- reuse existing components and utilities;
- avoid unnecessary dependencies;
- make the smallest possible change required by the task.

## Project structure

Keep application code in `src/` and follow this structure:

```text
src/
  app/            # App Router pages, layouts, styles, and favicon
    components/   # shared application components
      ui/         # reusable UI components and shadcn components
  lib/            # shared utilities and server-side localization helpers
  paraglide/      # generated localization code; not tracked in Git
messages/         # source translations: ru.json and en.json
project.inlang/   # localization settings and tool-managed files
public/           # static assets
scripts/          # development scripts
```

- Place new routes in `src/app`; do not create a root-level `app` directory.
- The `@/*` import alias resolves to `src/*`.
- Reuse `src/app/components` and `src/app/components/ui` for shared components.
- Keep shared utilities in `src/lib`.
- Edit translation text in `messages/{locale}.json` and locale settings in `project.inlang/settings.json`.
- Do not manually edit `src/paraglide`; regenerate it with `pnpm i18n:compile`.
- Keep `public`, `scripts`, configuration files, and `.env*` files at the project root.

## Local development

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Before considering a task complete, run:

```bash
pnpm lint
```

Do not run `pnpm build`, including for verification or task completion.

If the project has a separate type-check command:

```bash
pnpm typecheck
```

If tests exist for the changed code, run them as well.

Do not start long-running processes unless they are required for verification.

## General rules

- Follow the existing project structure and conventions.
- Prefer modifying existing code over creating duplicate implementations.
- Do not refactor unrelated code.
- Do not rename files or components unless necessary.
- Do not change public APIs unless explicitly requested.
- Preserve existing behavior outside the scope of the current task.
- Keep changes small and focused.

## TypeScript

- Use TypeScript for all new code.
- Avoid `any`.
- Use explicit types when they improve readability.
- Reuse existing types instead of creating duplicates.
- Prefer `const` over `let`.
- Avoid type assertions unless necessary.

## React

- Use functional components.
- Keep each component focused on one main responsibility.
- Do not extract very small UI fragments into separate components without a clear benefit.
- Prefer derived values over additional state.
- Avoid unnecessary `useEffect`.
- Do not use `useMemo` or `useCallback` without a real need.
- Do not duplicate state when a value can be derived from existing state or props.

## Next.js

- Follow the routing structure already used in the project.
- If the project uses App Router, continue using App Router.
- Prefer Server Components by default.
- Add `"use client"` only when client-side behavior is actually required.
- Do not turn an entire page into a Client Component because one small part needs interactivity.
- Prefer extracting interactive parts into smaller Client Components.
- Use built-in Next.js features instead of custom implementations where appropriate.
- Use `next/link` for internal navigation.
- Use `next/navigation` for programmatic navigation.
- Use `next/image` when appropriate instead of a plain `<img>`.
- Use the built-in Metadata API for metadata.
- Do not expose server-only environment variables to client code.
- Treat variables prefixed with `NEXT_PUBLIC_` as public and accessible in the browser.
- Do not add `"use client"` without a clear reason.

## Server and Client Components

Prefer a Server Component when the component:

- only renders data;
- fetches data on the server;
- does not use state;
- does not use browser APIs;
- does not use event handlers.

Use a Client Component when the component needs:

- `useState`;
- `useEffect`;
- event handlers;
- browser APIs;
- interactive behavior.

Keep Client Components as low in the component tree as practical.

## Data fetching

- Prefer fetching data on the server when possible.
- Do not move requests to the client only for convenience.
- Follow the existing caching strategy used by the project.
- Do not add a custom caching layer without a clear need.
- Handle loading, error, and empty states where applicable.

## Server Actions and Route Handlers

- Use Server Actions only when they fit the existing project architecture.
- Do not move normal server-side logic into client code.
- Place Route Handlers according to Next.js conventions.
- Do not duplicate the same server logic in both a Route Handler and a Server Action.
- Validate incoming data on the server.

## Styling

- Follow the styling approach already used in the project.
- Reuse existing colors, spacing, typography, and design tokens.
- Do not introduce a new CSS framework without explicit approval.
- Avoid unnecessary inline styles.
- Check responsive behavior after UI changes.
- Do not modify unrelated styles.

## Components

Before creating a new component:

1. Search the project for an existing equivalent.
2. Check whether an existing component can be extended.
3. Create a new component only when it provides a clear benefit.

Do not create nearly identical components with different names.

## Utilities

Before creating a new helper or utility function, check whether an equivalent implementation already exists.

Do not create abstractions for logic that:

- is used only once;
- is very small;
- is easier to understand inline.

## Data

- Keep application data separate from presentation components.
- Do not duplicate the same static data across multiple files.
- Prefer data structures that are easy to search, filter, and update.
- Do not store derived values separately when they can be calculated easily from source data.

## API

- Reuse the existing API client or server-side functions.
- Do not hardcode production URLs.
- Keep network logic separate from UI where practical.
- Handle request errors.
- Preserve existing response types.
- Do not send data to the client that the client does not need.

## pnpm

- Use only `pnpm`.
- Do not use `npm` or `yarn`.
- Do not create `package-lock.json` or `yarn.lock`.
- Install dependencies with:

```bash
pnpm add <package>
```

Install development dependencies with:

```bash
pnpm add -D <package>
```

- Do not edit `pnpm-lock.yaml` manually.
- Do not update dependencies without a clear need.
- Do not perform bulk dependency upgrades as part of an unrelated task.

## Dependencies

Do not install new packages unless necessary.

Before adding a dependency:

1. Check whether the project already contains a suitable solution.
2. Check whether the functionality can be implemented simply without another package.
3. Check whether Next.js or React already provides the required functionality.
4. Do not add large libraries for small tasks.

## Environment files

Do not modify these files unless explicitly required:

```text
.env
.env.local
.env.development
.env.production
```

Never add the following to the repository:

- secrets;
- tokens;
- passwords;
- private API keys.

Do not print secret values to logs.

## Git

- Do not commit automatically.
- Do not push automatically.
- Do not rewrite Git history.
- Do not discard existing uncommitted changes.
- Do not run `git reset --hard`.
- Do not reset files modified by the user.
- Do not include unrelated changes in the current task.

## Verification

After making changes:

1. Check for TypeScript errors.
2. Run relevant tests if they exist.
3. Run:

```bash
pnpm lint
```

4. Do not run `pnpm build`.

5. For UI changes, verify:
   - desktop layout;
   - mobile layout;
   - no obvious layout shifts;
   - loading, error, and empty states where applicable.

Do not fix unrelated errors unless they affect the current task or prevent verification.

## Before implementing

Before creating a new:

- component;
- hook;
- helper;
- type;
- API client;
- Server Action;
- Route Handler;
- data structure;

search the repository for an existing equivalent first.

## Task completion

When the task is complete, briefly report:

- what was changed;
- which files were changed;
- what checks were performed;
- whether there are any unresolved issues or limitations.
