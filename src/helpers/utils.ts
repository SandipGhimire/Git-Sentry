import fs from "node:fs";
import path from "node:path";
import logger from "./logger";
import { HOOKS } from "./constants";

/**
 * Validates that the current working directory is a Git repository.
 */
const checkGit = () => {
  const gitDir = path.join(process.cwd(), ".git");
  if (!fs.existsSync(gitDir) || !fs.lstatSync(gitDir).isDirectory()) {
    logger.color("cyan", "");
    logger.error("Not .git folder.\n");
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
    logger.error(`${hook} is not a valid hook\n`);
    process.exit(1);
  }
};

/**
 * Spinner frames for loading
 */
const spinnerFrames = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
/**
 * Spinner index
 */
let spinnerIndex = 0;
/**
 * Spinner interval
 */
let spinnerInterval: NodeJS.Timeout | undefined;

/**
 * Starts the spinner
 * @param {string} text - The text to display with the spinner
 */
const startSpinner = (text = "Executing commands…") => {
  stopSpinner();
  spinnerInterval = setInterval(() => {
    const frame = spinnerFrames[spinnerIndex % spinnerFrames.length];
    spinnerIndex++;
    process.stdout.write(`\r\x1b[2K${frame} ${text}`);
  }, 100);
};

/**
 * Stops the running spinner
 */
const stopSpinner = () => {
  if (spinnerInterval != null) {
    clearInterval(spinnerInterval);
    spinnerInterval = undefined;
  }
  process.stdout.write("\r\x1b[2K");
};

export { checkGit, checkHook, startSpinner, stopSpinner };
