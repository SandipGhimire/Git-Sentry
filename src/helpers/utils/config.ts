import type { GitSentryConfig } from "../../types";
import fs from "node:fs";
import path from "node:path";
import logger from "../logger";
import { GIT_SENTRY_FILE_NAME } from "../constants";

/**
 * Retrieves the Git-Sentry configuration from a file in the given directory.
 *
 * @param {string} [crrPath=process.cwd()] - The directory to look for the config file. Defaults to the current working directory.
 * @returns {GitSentryConfig} The parsed configuration object, or exits the process if the file is not found.
 */
const getConfigValue = (crrPath: string = process.cwd()): GitSentryConfig => {
  const fullPath = path.join(crrPath, GIT_SENTRY_FILE_NAME);
  if (fs.existsSync(fullPath)) {
    const raw = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(raw) as GitSentryConfig;
  }

  logger.color("cyan", "");
  logger.error(
    `Configuration Error: '${GIT_SENTRY_FILE_NAME}' not found in the current directory. Please ensure the project is initialized with a valid configuration file.`
  );
  logger.color("cyan", "");
  process.exit(1);
};

export { getConfigValue };
