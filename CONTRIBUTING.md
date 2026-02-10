# Contributing to GitSentry

First off, thank you for considering contributing to GitSentry! It's people like you that make GitSentry such a great tool.

## How Can I Contribute?

### Reporting Bugs

Bugs are tracked as GitHub issues. When creating a bug report, please include:

- A clear and concise description of the bug.
- Steps to reproduce the behavior.
- Expected vs. actual behavior.
- Environment details (OS, Node, Git, GitSentry version).

### Suggesting Enhancements

Feature requests are also tracked as GitHub issues. Please provide:

- A clear description of the problem your feature solves.
- A detailed description of the proposed solution.
- Any alternative solutions you've considered.

### Pull Requests

1. Fork the repository and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes (`pnpm run test`).
4. Make sure your code lints (`pnpm run lint`).
5. Follow the formatting rules (`pnpm run format`).
6. Issue that Pull Request!

## Development Setup

### Prerequisites

- Node.js >= 24
- pnpm

### Setup

```bash
git clone https://github.com/SandipGhimire/Git-Sentry.git
cd Git-Sentry
pnpm install
```

### Building

```bash
pnpm run build
```

### Testing

```bash
pnpm run test
```

### Linting & Formatting

```bash
pnpm run lint
pnpm run format
```

## Code of Conduct

Please be respectful and professional in all your interactions with the project and other contributors.
