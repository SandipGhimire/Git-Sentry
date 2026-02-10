# GitSentry

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](file:///media/sandipghimire/ClydeSan/SandipGhimire/GitSentry/GitSentry/LICENSE)
[![Docs](https://img.shields.io/badge/Docs-Official%20Wiki-blue)](https://gitsentry.sandip-ghimire.com.np)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black)](https://github.com/SandipGhimire/Git-Sentry)

## Overview

**GitSentry** is a lightweight, configuration-driven Git hooks manager for modern development workflows. It allows you to define, manage, and execute commands across any Git hook using a simple JSON configuration file.

## Features

- 🚀 **Zero Dependency Hooks**: Automatically installs and delegates hooks without manual script editing.
- ⚙️ **Config Driven**: Manage all your hooks in a single `.gitsentryrc` file.
- ⚡ **Parallel Execution**: Run multiple linting/testing commands concurrently for speed.
- 🛡️ **Fail Fast**: Stop execution immediately if a critical command fails.
- 🌿 **Branch & Commit Filters**: Run hooks only on specific branches or skip them based on commit messages.
- ⏱️ **Timeouts**: Prevent long-running or hung processes from blocking your workflow.

## Installation

```sh
npm install git-sentry --save-dev
# or
pnpm add git-sentry -D
```

## Quick Start

1. **Initialize GitSentry** in your project:

   ```sh
   npx git-sentry init
   ```

   This creates a default `.gitsentryrc` and sets up the necessary Git hook delegations.

2. **Configure your hooks** in `.gitsentryrc`:

   ```json
   {
     "hooks": {
       "pre-commit": {
         "commands": ["npm run lint", "npm run test"],
         "options": {
           "parallel": true,
           "failFast": true
         }
       }
     }
   }
   ```

3. **Automate Setup**: Add GitSentry to your `package.json` scripts to ensure hooks are automatically initialized for all contributors:

   ```json
   {
     "scripts": {
       "prepare": "git-sentry init"
     }
   }
   ```

   _Note: Use `postinstall` if you are using a package manager that doesn't support `prepare` hooks._

4. **Profit!** Your hooks will now trigger automatically on Git actions.

## 📚 Documentation

For a deep dive into all available options and advanced configurations, visit our **[Official Wiki](https://gitsentry.sandip-ghimire.com.np)**.

## License

[MIT](file:///media/sandipghimire/ClydeSan/SandipGhimire/GitSentry/GitSentry/LICENSE) © [Sandip Ghimire](https://github.com/SandipGhimire)
