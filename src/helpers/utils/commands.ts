import type { CommandResult, HookOptions, HookResult } from "../../types";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import logger from "../logger";
import { checkGit, getCommitMessage, getCurrentBranch } from "./git";
import { GIT_SENTRY_FILE_NAME, GIT_SENTRY_CONFIG_VERSION, HOOKS } from "../constants";
import { startSpinner, stopSpinner } from "./spinner";

/**
 * Formats a duration in milliseconds into a human-readable string.
 *
 * @param {number} ms - Time in milliseconds.
 * @returns {string} Formatted time string in milliseconds or seconds.
 */
const formatTime = (ms: number): string => {
  return ms < 1000 ? `${String(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Executes a single shell command.
 *
 * @param {string} command - The command to execute.
 * @param {string} [cwd] - Optional working directory to run the command in. Defaults to the current working directory.
 * @param {number} [timeout] - Optional timeout in milliseconds. If exceeded, the command is killed and rejected.
 * @returns {Promise<void>} Resolves if the command exits with code 0, rejects otherwise.
 */
const runCommand = async (command: string, cwd?: string, timeout?: number, verbose = false) => {
  return new Promise<void>((resolve, reject) => {
    const runner = spawn(command, {
      shell: true,
      stdio: "pipe",
      cwd: cwd ?? process.cwd(),
    });

    let timer: NodeJS.Timeout | undefined;

    if (verbose) {
      logger.color("cyan", "");
      let buffer = "";
      runner.stdout.on("data", (chunk: string) => {
        buffer += chunk;

        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          logger.segmentColor([
            {
              color: "yellow",
              text: `${command} │ `,
            },
            {
              color: "green",
              text: line,
            },
          ]);
        }
      });

      runner.stderr.on("data", (chunk: string) => {
        buffer += chunk;

        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          logger.segmentColor([
            {
              color: "yellow",
              text: `${command} │ `,
            },
            {
              color: "red",
              text: line,
            },
          ]);
        }
      });
    }

    if (Number(timeout)) {
      timer = setTimeout(() => {
        runner.kill("SIGTERM");
        reject(new Error(`Command timed out after ${String(timeout)}ms: ${command}`));
      }, timeout);
    }

    runner.on("exit", (code) => {
      if (timer) clearTimeout(timer);
      if (code == 0) resolve();
      else reject(new Error(`Command Failed (${String(code)}): ${command}`));
    });
  });
};

/**
 * Executes multiple shell commands sequentially or in parallel based on options.
 *
 * @param {string[]} commands - Array of commands to run.
 * @param {HookOptions} [options] - Optional execution options.
 * @param {boolean} [options.parallel=false] - Run commands in parallel if true; otherwise, run sequentially.
 * @param {boolean} [options.failFast=false] - Stop execution on the first failure if true.
 * @param {boolean} [options.ignoreErrors=false] - Treat failed commands as success if true.
 * @param {string[]} [options.branches] - Only run commands if the current branch is included.
 * @param {string} [options.skipIfMessageContains] - Skip commands if commit message contains this string.
 * @param {string} [options.cwd] - Directory in which to execute commands.
 * @param {number} [options.timeout] - Timeout in milliseconds for each command.
 * @returns {Promise<void>} Resolves when all commands have been executed or fails according to options.
 */
const runCommands = async (commands: string[], options?: HookOptions) => {
  const isParallel = options?.parallel === true;
  const failFast = options?.failFast === true;
  const ignoreErrors = options?.ignoreErrors === true;
  const results: CommandResult[] = [];

  if (options !== undefined) {
    if (options.branches !== undefined && options.branches.length > 0) {
      const branch = getCurrentBranch();
      if (!options.branches.includes(branch)) {
        logger.info(`Skipping all commands on branch: ${branch}`);
        return;
      }
    }

    if (options.skipIfMessageContains !== undefined) {
      const msg = getCommitMessage();
      if (msg?.includes(options.skipIfMessageContains ?? "") === true) {
        logger.info("Skipping all commands due to commit message");
        return;
      }
    }
  }

  const executeCommand = async (cmd: string): Promise<CommandResult> => {
    const start = Date.now();
    try {
      await runCommand(cmd, options?.cwd, options?.timeout, options?.verbose);
      const duration = Date.now() - start;
      return { command: cmd, status: "success", duration };
    } catch (err) {
      const duration = Date.now() - start;
      return {
        command: cmd,
        status: ignoreErrors ? "success" : "failed",
        duration,
        error: String(err),
      };
    }
  };

  try {
    if (options?.verbose !== true) {
      startSpinner();
    }

    if (isParallel) {
      if (failFast) {
        logger.warn("failFast is ignored in parallel mode; all commands will run");
      }
      const parallelResults = await Promise.all(commands.map(executeCommand));
      results.push(...parallelResults);
    } else {
      for (const cmd of commands) {
        const res = await executeCommand(cmd);
        results.push(res);

        if (res.status === "failed" && failFast && !ignoreErrors) {
          break;
        }
      }
    }
  } catch (err) {
    if (!ignoreErrors) {
      logger.error("Hook execution failed:", err);
      process.exit(1);
    }
  } finally {
    stopSpinner();
  }
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  const successCount = results.filter((r) => r.status === "success").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  logger.color("cyan", "");
  logger.color("cyan", "═══════ Hook Execution Summary ═══════");
  results.forEach((res) => {
    const statusIcon = res.status === "success" ? "[✔]" : res.status === "skipped" ? "[⚠︎]" : "[✗]";
    const color = res.status === "success" ? "green" : res.status === "skipped" ? "yellow" : "red";

    logger.segmentColor([
      {
        color: color,
        text: statusIcon,
      },
      {
        color: "cyan",
        text: ` ${res.command} — ${formatTime(res.duration)}`,
      },
    ]);
    if (res.error !== undefined) logger.color("red", `⤷ Error: ${res.error}`);
  });
  logger.segmentColor([
    {
      color: "cyan",
      text: `\nTotal: ${String(results.length)} commands executed`,
    },
    {
      color: "cyan",
      text: "\n⤷ ",
    },
    {
      color: "green",
      text: `${String(successCount)} succeeded`,
    },
    {
      color: "cyan",
      text: ` / `,
    },
    {
      color: "red",
      text: `${String(failedCount)} failed`,
    },
    {
      color: "cyan",
      text: `\n⤷ Time: ${formatTime(totalTime)}`,
    },
  ]);
  logger.color("cyan", "══════════════════════════════════════\n");

  if (results.some((r) => r.status === "failed") && !ignoreErrors) {
    process.exit(1);
  }
};

/**
 * Adds or updates a Git-Sentry command block in a Git hook script.
 *
 * - Creates the hooks directory if it does not exist.
 * - Creates the hook file if missing.
 * - Appends a new versioned Git-Sentry block if none exists.
 * - Replaces the block if an older version exists.
 * - Removes old unversioned git-sentry commands.
 * - Trims extra blank lines.
 * - Ensures the hook file is executable.
 * - Includes proper checks: skips hook if Node, npx, or config is missing.
 *
 * @param {string} command - The shell command to run in the Git hook.
 * @param {string} file - The Git hook filename (e.g., "pre-commit").
 * @returns {HookResult} Result object describing the action taken or error encountered.
 */
const addHookCommand = (command: string, file: string): HookResult => {
  try {
    const gitDir = path.join(process.cwd(), ".git");
    if (!fs.existsSync(gitDir) || !fs.lstatSync(gitDir).isDirectory()) {
      return { hook: file, status: "failed", message: "No .git directory found" };
    }

    const hooksDir = path.join(gitDir, "hooks");
    if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir);

    const hookFile = path.join(hooksDir, file);
    let content = "";

    const newBlock = `
# >>> git-sentry start v${GIT_SENTRY_CONFIG_VERSION} >>>
if [ -z "$CI" ] \
&& command -v node >/dev/null 2>&1 \
&& command -v npx >/dev/null 2>&1 \
&& [ -f ".gitsentryrc" ] \
&& [ -f "node_modules/.bin/git-sentry" ]; then
  ${command} || echo "${command} failed to execute."
else
  echo "[git-sentry] Skipping hook: CI=$CI, Node=$(command -v node), npx=$(command -v npx), .gitsentryrc=$( [ -f .gitsentryrc ] && echo yes || echo no )"
  exit 0
fi
# <<< git-sentry end <<<`;

    const oldBlockRegex = /^#!\/bin\/sh\n# Auto-generated by git-sentry tool\n.+$/m;
    const versionedBlockRegex = /# >>> git-sentry start v(\d+\.\d+\.\d+) >>>[\s\S]*?# <<< git-sentry end <<</m;

    if (fs.existsSync(hookFile)) {
      content = fs.readFileSync(hookFile, "utf8");
      if (oldBlockRegex.test(content)) content = content.replace(oldBlockRegex, "");
      content = content.replace(/^\s*\n/gm, "");

      if (versionedBlockRegex.test(content)) {
        const sentryCurrConRegex = /# >>> git-sentry start v(.*) >>>/;
        const existingVersionMatch = sentryCurrConRegex.exec(content);
        const existingVersion = existingVersionMatch?.[1];

        if (existingVersion !== GIT_SENTRY_CONFIG_VERSION) {
          content = content.replace(versionedBlockRegex, newBlock);
          fs.writeFileSync(hookFile, content, { mode: 0o755 });
          return {
            hook: file,
            status: "updated",
            message: `Replaced Git-Sentry hook with version ${GIT_SENTRY_CONFIG_VERSION}.`,
          };
        } else {
          return { hook: file, status: "exists", message: `Git-Sentry hook already up-to-date.` };
        }
      } else {
        content += `\n#!/bin/sh\n# ⚠ Auto-managed by Git-Sentry, do not edit inside the start/end block\n${newBlock}\n`;
        fs.writeFileSync(hookFile, content, { mode: 0o755 });
        return {
          hook: file,
          status: "appended",
          message: `Appended Git-Sentry hook with version ${GIT_SENTRY_CONFIG_VERSION}.`,
        };
      }
    } else {
      content = `#!/bin/sh
# ⚠ Auto-managed by Git-Sentry, do not edit inside the start/end block
${newBlock}
`;
      fs.writeFileSync(hookFile, content, { mode: 0o755 });
      return {
        hook: file,
        status: "created",
        message: `Created new Git-Sentry hook with version ${GIT_SENTRY_CONFIG_VERSION}.`,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { hook: file, status: "failed", message };
  }
};

/**
 * Installs Git Sentry commands into all supported Git hooks.
 *
 * - Verifies the current directory is a Git repository.
 * - Iterates over all predefined Git hooks.
 * - Adds the git-sentry execution command to each hook file.
 * - Displays a formatted summary of actions performed.
 *
 * @returns {void}
 */
const addHooks = () => {
  const results: HookResult[] = [];

  checkGit();

  for (const hook of HOOKS) {
    const result = addHookCommand(`npx git-sentry run ${hook}`, hook);
    results.push(result);
  }

  logger.info("=== Git Hooks Update Summary ===");
  results.forEach((res) => {
    const icon =
      res.status === "created"
        ? "[✔]"
        : res.status === "appended"
          ? "[✎]"
          : res.status === "updated"
            ? "[✎]"
            : res.status === "exists"
              ? "[⚠]"
              : "[✗]";
    const color =
      res.status === "created"
        ? "green"
        : res.status === "appended"
          ? "blue"
          : res.status === "updated"
            ? "blue"
            : res.status === "exists"
              ? "yellow"
              : "red";
    logger.segmentColor([
      {
        text: `               ${icon}`,
        color: color,
      },
      {
        text: ` ${res.hook} — ${res.message}`,
        color: "cyan",
      },
    ]);
  });
  logger.info("================================");
};

/**
 * Creates a default configuration file in the current project.
 *
 * - Checks if the configuration file already exists and skips creation if so.
 * - Generates a sample configuration with common Git hooks and options.
 * - Writes the configuration file in JSON format.
 *
 * @returns {void}
 */
const createDefaultConfig = () => {
  const configPath = path.join(process.cwd(), GIT_SENTRY_FILE_NAME);

  if (fs.existsSync(configPath)) {
    logger.info(`'${GIT_SENTRY_FILE_NAME}' already exists, skipping creation.`);
    return;
  }

  const defaultConfig = {
    hooks: {
      "pre-commit": {
        commands: ["npm run test", "npm run lint"],
        options: {
          parallel: true,
          failFast: false,
          timeout: 60000,
          branches: ["master"],
          verbose: true,
        },
      },
      "pre-push": {
        commands: ["npm run lint"],
        options: {
          parallel: false,
          failFast: false,
          timeout: 60000,
          branches: ["master"],
          verbose: true,
        },
      },
      "commit-msg": {
        commands: [],
        options: {},
      },
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf8");
  logger.info(`Created default '${GIT_SENTRY_FILE_NAME}' with sample hooks.`);
};

export { addHooks, runCommands, createDefaultConfig };
