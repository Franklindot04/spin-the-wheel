# Contributing to Spin the Wheel

Thank you for your interest in contributing to **Spin the Wheel**. Contributions of all kinds are welcome, including bug reports, feature ideas, documentation improvements, accessibility fixes, UI refinements, and code changes.

Please read this guide before opening an issue or pull request.

## Before You Start

- Search existing issues and pull requests to avoid duplicate work.
- For larger features or significant UI changes, open an issue first to discuss the approach.
- Keep each contribution focused on one clear improvement.
- Do not include unrelated formatting changes, generated files, or dependency upgrades unless they are required for the contribution.

## Development Setup

### 1. Fork and clone

Fork the repository on GitHub, then clone your fork:

```bash
git clone [https://github.com/YOUR-USERNAME/spin-the-wheel.git](https://github.com/YOUR-USERNAME/spin-the-wheel.git)
cd spin-the-wheel
```

Add the original repository as an upstream remote:

```bash
git remote add upstream [https://github.com/Franklindot04/spin-the-wheel.git](https://github.com/Franklindot04/spin-the-wheel.git)
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the application at [http://localhost:3000](http://localhost:3000).

## Development Workflow

### 1. Create a branch

Create a focused branch from the latest default branch:

```bash
git checkout main
git pull upstream main
git checkout -b feat/short-description
```

Use a descriptive branch prefix:

- `feat/` for a new feature
- `fix/` for a bug fix
- `docs/` for documentation-only updates
- `refactor/` for code restructuring without behavior changes
- `chore/` for maintenance work

Examples:

```bash
git checkout -b fix/pointer-color-after-spin
git checkout -b feat/wheel-entry-images
git checkout -b docs/improve-contributing-guide
git checkout -b refactor/extract-history-panel
```

### 2. Make focused changes

While working on the project:

- Follow the existing TypeScript, React, and Tailwind CSS conventions.
- Keep components small and give files clear, descriptive names.
- Preserve existing behavior unless the pull request explicitly changes it.
- Avoid mixing unrelated changes in one pull request.
- Update documentation when you change user-facing behavior.
- Include screenshots in the pull request for visible UI changes.

### 3. Validate your changes

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

Both commands must complete successfully without errors.

For UI-related changes, also test the relevant flows manually in the browser. For example:

- Standard wheel spins and produces a result.
- Quiz mode starts, reveals answers, and progresses correctly.
- Import and export work as expected.
- Wheel data persists after refreshing the page.
- Responsive layouts remain usable at different screen sizes.

## Commit Messages

Use short, descriptive commit messages with a conventional prefix:

```text
feat: add entry image support
fix: update pointer color after wheel transition
docs: improve installation instructions
refactor: extract history panel component
chore: update development dependencies
```

Prefer small, logical commits over one large commit containing unrelated work.

## Pull Requests

When opening a pull request:

- Use a clear title that describes the result.
- Explain what changed and why.
- Include the validation commands you ran.
- Add screenshots or a screen recording for UI changes.
- Link any related issue using `Fixes #123`, when applicable.
- Clearly call out breaking changes, changes to saved data, or migration requirements.
- Keep the pull request focused and reasonably sized.

Use this structure in your pull request description:

```md
## Summary

- Briefly describe the change
- Explain the user-facing or technical impact

## Validation

- [x] `npm run lint`
- [x] `npm run build`
- [x] Manually tested the relevant application flow

## Screenshots

Add screenshots or a recording here for UI changes.

## Related Issue

Fixes #123
```

## Reporting Bugs

When opening a bug report, include:

- A clear and specific title.
- Steps to reproduce the issue.
- Expected behavior.
- Actual behavior.
- Screenshots or recordings, if relevant.
- Browser and operating system details.
- Any console errors or build output that may help diagnose the problem.

## Feature Requests

Feature requests should explain:

- The problem or use case.
- The proposed solution.
- Any alternative approaches considered.
- Screenshots, sketches, or examples when the change affects the interface.

## Code Style

This project uses TypeScript, React, Next.js, and Tailwind CSS.

Please:

- Prefer TypeScript types over `any`.
- Use named, reusable types for shared domain models.
- Keep React state and side effects easy to follow.
- Keep rendering components focused on presentation where practical.
- Reuse existing components and utilities before adding duplicates.
- Do not bypass linting with broad disable comments unless there is a documented reason.

## License

By contributing to Spin the Wheel, you agree that your contributions will be licensed under the [MIT License](./LICENSE).