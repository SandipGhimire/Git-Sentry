import fs from "node:fs";
import path from "node:path";
import logger from "../logger";
import { HOOKS } from "../constants";

/**
 * Validates that the current working directory is a Git repository.
 */
const checkGit = () => {
  const gitDir = path.join(process.cwd(), ".git");
  if (!fs.existsSync(gitDir) || !fs.lstatSync(gitDir).isDirectory()) {
    logger.color("cyan", "");
    logger.error(
      "Repository Error: No '.git' directory found. Please make sure you are inside a valid Git repository."
    );
    process.exit(0);
  }
};

/**
 * Validates that the specified hook exists in the list of supported hooks.
 *
 * @param {string} hook - The Git hook file to check for (e.g., 'pre-commit', 'post-commit').
 */
const checkHook = (hook: string) => {
  if (!HOOKS.includes(hook)) {
    logger.color("cyan", "");
    logger.error(
      `Hook Error: The specified Git hook '${hook}' is missing. Ensure the hook runner is installed in the repository.`
    );
    process.exit(0);
  }

  if (hook) {
    const hooksDir = path.join(process.cwd(), ".gitsentry");
    const hookFile = path.join(hooksDir, hook);

    if (!fs.existsSync(hookFile)) {
      logger.color("cyan", "");
      logger.error(
        `Hook Error: The specified Git hook '${hook}' is missing. Ensure the hook runner is installed in the repository.`
      );
      process.exit(0);
    }
  }
};

/**
 * Retrieves the current Git branch name from the repository's HEAD.
 *
 * @returns {string} The name of the current Git branch.
 */
const getCurrentBranch = (): string => {
  return fs.readFileSync(".git/HEAD", "utf8").replace("ref: refs/heads/", "").trim();
};

/**
 * Reads the current commit message from Git's COMMIT_EDITMSG file.
 *
 * @returns {string | null} The commit message, or null if it cannot be read.
 */
const getCommitMessage = (): string | null => {
  try {
    return fs.readFileSync(".git/COMMIT_EDITMSG", "utf8");
  } catch {
    logger.color("cyan", "");
    logger.warn(
      "Commit Message Warning: Unable to read the current commit message. Hooks relying on commit messages may not execute as expected."
    );
    logger.color("cyan", "");
    return null;
  }
};

export { checkGit, checkHook, getCurrentBranch, getCommitMessage };
