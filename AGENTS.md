# Repository Guidelines

## Project Structure & Module Organization

This React 19, TypeScript, and Vite application keeps code in `src/`: `components/` contains page sections and dialogs, `services/` contains API and TRON payment integrations, and `utils/` contains supporting JSON data. Shared models are in `src/types.ts`, while live API mapping and requests are in `src/services/api.ts`. Static files served unchanged belong in `public/`; imported images belong in `src/assets/`. `home_files/` and `home.html` are legacy/reference assets; avoid editing them unless the task concerns the captured source page. `dist/` and `node_modules/` are generated and must not be committed.

## Build, Test, and Development Commands

- `npm install` installs the locked dependencies from `package-lock.json`.
- `npm run dev` starts the Vite development server with hot reload.
- `npm run build` runs TypeScript project checks, then creates a production build in `dist/`.
- `npm run lint` checks React and TypeScript code with Oxlint.
- `npm run preview` serves the production build locally for final verification.

Run lint and build before opening a pull request.

## Coding Style & Naming Conventions

Follow the existing TypeScript style: two-space indentation, single quotes, semicolons, and ES module imports. Name React components and their files in PascalCase (`StaffCard.tsx`), variables and functions in camelCase, and shared types in PascalCase. Keep components focused; move network or blockchain logic into `src/services/`. Prefer typed props and `import type` for type-only imports. Oxlint rules are defined in `.oxlintrc.json`; TypeScript also rejects unused locals, unused parameters, and switch fallthrough.

## Testing Guidelines

No automated test framework or coverage threshold is configured. For every change, run `npm run lint` and `npm run build`, then exercise affected flows through `npm run dev`. Verify API fallback behavior, query-parameter navigation, responsive layouts, and wallet/payment interactions when relevant. If tests are introduced, colocate them as `*.test.ts` or `*.test.tsx` and add the runner command to `package.json`.

## Commit & Pull Request Guidelines

History uses short, imperative Conventional Commit-style subjects such as `feat: update domain...`. Use prefixes such as `feat:`, `fix:`, `refactor:`, or `docs:` and keep each commit focused. Pull requests should explain the user-visible change, list validation performed, link any issue, and include screenshots for visual updates. Call out API, environment, or payment-flow changes explicitly.

## Security & Configuration

Treat `.env.development`, API URLs, wallet addresses, and payment configuration as sensitive. Do not commit secrets or private keys. Keep environment-specific values in ignored `.env.*.local` files and document any required variable names without real credentials.
