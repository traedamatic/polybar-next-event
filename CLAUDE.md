# Project Name

Please extend this file with more project related content

## GitHub Project

> **Required for `/el-create-ticket` and `/el-dev-loop` commands.**
> Fill in these values from your GitHub Project (v2) settings.
> To find the IDs, run: `gh project list --owner <OWNER>` and `gh project field-list <PROJECT_NUMBER> --owner <OWNER>`

- **Owner**: <github-username-or-org>
- **Repository**: <repo-name>
- **Project Number**: <number>
- **Project URL**: https://github.com/users/<owner>/projects/<number>
- **Project ID**: <project-id>
- **Status Field ID**: <status-field-id>
- **Status Options**:
  - Todo: `<option-id>`
  - In Progress: `<option-id>`
  - Done: `<option-id>`

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
