# Contributing to Note Taker

Thank you for your interest in contributing! This document explains how to report bugs, propose features, and submit pull requests.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [How to Contribute](#how-to-contribute)
   - [Reporting Bugs](#reporting-bugs)
   - [Suggesting Features](#suggesting-features)
   - [Submitting a Pull Request](#submitting-a-pull-request)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Commit Message Format](#commit-message-format)
7. [Testing Guidelines](#testing-guidelines)
8. [Project Structure](#project-structure)

---

## Code of Conduct

Be respectful and constructive in all interactions. Harassment or hostile behavior of any kind will not be tolerated. This project follows the spirit of the [Contributor Covenant](https://www.contributor-covenant.org/).

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/note-taker.git
   cd note-taker
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Run the app in development mode:**
   ```bash
   npm run dev
   ```
5. **Run the test suite** to make sure everything is working:
   ```bash
   npm test
   ```

---

## How to Contribute

### Reporting Bugs

Before opening a new issue, please search existing issues to avoid duplicates.

When filing a bug report, include:
- A clear, descriptive title
- Steps to reproduce the problem
- What you expected to happen vs. what actually happened
- Your OS, Node.js version, and app version
- Screenshots or screen recordings if relevant

### Suggesting Features

Open a GitHub issue with the label `enhancement`. Describe:
- The problem you are trying to solve
- Your proposed solution
- Any alternatives you considered

### Submitting a Pull Request

1. Create a new branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes (see [Coding Standards](#coding-standards)).
3. Add or update tests for any changed behaviour.
4. Run linting and tests locally:
   ```bash
   npm run lint
   npm test
   ```
5. Push your branch and open a Pull Request against `main`.
6. Fill in the PR description — explain **what** changed and **why**.
7. Respond to review feedback promptly.

A maintainer will review your PR and either approve it, request changes, or close it with an explanation.

---

## Development Workflow

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + Electron in development mode |
| `npm run build` | Build the renderer bundle |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint all source files (ESLint) |
| `npm run dist` | Package app for the current platform |
| `npm run dist:mac` | Package for macOS |
| `npm run dist:win` | Package for Windows |
| `npm run dist:linux` | Package for Linux |

---

## Coding Standards

- **Language** — JavaScript (ES modules). No TypeScript at this time.
- **Formatting** — Follow the existing style. 2-space indentation, single quotes, no semicolons unless required.
- **React** — Functional components and hooks only. No class components.
- **Imports** — Group imports: third-party libraries first, then internal modules, then CSS.
- **Comments** — Only add a comment when the **why** is non-obvious. Do not comment what the code does.
- **No dead code** — Remove unused variables, imports, and files before opening a PR.
- **No console logs** — Remove any `console.log` debugging statements before submitting.
- **CSS** — Each component has a co-located `.css` file. Avoid global styles unless strictly necessary.

---

## Commit Message Format

Use the conventional commits style:

```
<type>(<scope>): <short summary>
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace (no logic change) |
| `chore` | Build scripts, dependency updates, config changes |

**Examples:**
```
feat(todo): add priority levels to todo items
fix(editor): prevent crash when pasting empty clipboard content
test(noteFactory): add edge case for createDayPlan with string date
docs: add contributing guidelines
```

Keep the summary under 72 characters. Use the commit body for additional context when needed.

---

## Testing Guidelines

Tests live in `src/test/` and use **Vitest** with **@testing-library/react**.

- Write tests for all new utility functions and custom hooks.
- For React components, test behaviour (what the user sees and can do), not implementation details.
- Use fake timers (`vi.useFakeTimers()`) for any time-dependent logic.
- Mock external dependencies (Electron API, `uuid`, `location`) at the module level.
- Do not write tests that only verify that a mock was called — verify the outcome.
- Keep each test focused on a single behaviour; use descriptive `it()` descriptions.

Run the full suite before pushing:
```bash
npm test
```

---

## Questions?

Open a [GitHub Discussion](https://github.com/visheshpanchal/note-taker/discussions) or reach out to the maintainer at [@visheshpanchal](https://github.com/visheshpanchal).
