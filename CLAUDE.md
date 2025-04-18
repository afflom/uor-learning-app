# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Testing Commands
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint` 
- Type check: `npm run type-check`
- Format: `npm run format`
- Check formatting: `npm run format:check`
- Run all tests: `npm run test:browser`
- Run specific test: `npx playwright test tests/browser.spec.ts:15`
- Test specific section: `npx playwright test -g "Section: foundations"`

## Code Style Guidelines
- Next.js with TypeScript and MDX files for content
- No semicolons, single quotes, 80 char line width
- Arrow functions without parens for single params
- PascalCase for components, camelCase for variables
- Functional React components with TypeScript interfaces
- Proper type annotations using PropsWithChildren
- Direct imports from specific files
- Clean error handling with helper functions
- Test for console errors on page loads