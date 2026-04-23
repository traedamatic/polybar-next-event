# Coding Guidelines

Guidelines for Claude Code and other coding agents working on projects.

## Design Patterns

* Don't Repeat Yourself (DRY) — extract shared logic into reusable functions/modules
* Single Responsibility Principle — each function/module/class does one thing well
* Use design patterns wisely — don't over-engineer; apply patterns when they solve a real problem
* Defensive Programming — validate inputs, handle edge cases, fail gracefully with meaningful errors
* Favor composition over inheritance
* Keep functions pure where possible — predictable inputs/outputs, minimal side effects
* Prefer explicit over implicit — no magic values, no hidden state mutations

## Overall Principles

* Done is better than perfect — ship incremental value, iterate later
* Functions can have impact on other functions — consider side effects and coupling when making changes
* Code and product quality is always important — clean code, readable diffs, meaningful naming
* Bring value for the user — every feature and fix should serve a real user need
* Keep dependencies minimal — only add packages that solve a clear problem
* Write code for the next developer — clear naming, comments where "why" isn't obvious
* Small, focused commits — one logical change per commit with a descriptive message
* Refactor as you go — leave code better than you found it (Boy Scout Rule)

## Testing

* **Unit tests** — for pure functions and small code blocks with clear input → output
* **Integration tests** — for API routes; test the full request/response cycle including middleware, auth, and database
* **E2E tests** — out of scope for now
* Write tests before fixing bugs — reproduce the bug first, then fix it
* Test the unhappy path — invalid inputs, missing data, auth failures, network errors
* Keep tests independent — no shared mutable state between test cases
* Use descriptive test names that explain the expected behavior

## Language Best Practices (TypeScript / Node.js)

* Enable strict mode in `tsconfig.json` — `"strict": true`
* Prefer `const` over `let`, avoid `var`
* Use proper TypeScript types — avoid `any`; use `unknown` when the type is genuinely unknown
* Handle promises properly — always `await` or `.catch()`, never leave unhandled rejections
* Use early returns to reduce nesting
* Prefer `async/await` over raw promise chains
* Use named exports over default exports for better refactoring support
* Keep environment config in one place — use a validated config module, not scattered `process.env` calls
* Use proper error types — extend `Error`, include context, distinguish operational vs programmer errors
* Prefer standard library and Node.js built-ins before reaching for npm packages

