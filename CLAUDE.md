# polybar-next-event

A polybar module that shows the next calendar event with color-coded urgency and a click-to-open detail dialog.

## GitHub Project

- **Owner**: traedamatic
- **Repository**: polybar-next-event
- **Project Number**: 4
- **Project URL**: https://github.com/users/traedamatic/projects/4
- **Project ID**: PVT_kwHOAAK5Cs4BVdHK
- **Status Field ID**: PVTSSF_lAHOAAK5Cs4BVdHKzhQ4zxA
- **Status Options**:
  - Todo: `f75ad846`
  - In Progress: `47fc9ee4`
  - Done: `98236657`

## Coding Conventions

See [`code_guidelines.md`](./code_guidelines.md) for full coding standards. Key points:

- **TypeScript strict mode** is enabled — no `any`, prefer `unknown`
- **Path alias**: `@/*` maps to `./src/*`
- Prefer `const` over `let`, never `var`
- Use `async/await` over raw promise chains
- Named exports preferred over default exports
- Early returns to reduce nesting
- DRY, single responsibility, composition over inheritance

### Bun-Specific Conventions

- Use Bun APIs over Node.js equivalents where available: `Bun.serve()`, `Bun.build()`, `Bun.file()`, `Bun.glob()`
- Use Bun's built-in test runner (`bun test`) — no external test framework needed
- Hot reload in dev via `bun --hot` (not nodemon or similar)
- Environment variables for the client must be prefixed with `BUN_PUBLIC_*`
