import type { GitSentryConfig } from "@/types";
import fs from "node:fs";
import path from "node:path";
import logger from "../logger";

/**
 * Retrieves the GitSentry configuration from a '.gitsentryrc' file in the given directory.
 *
 * @param {string} [crrPath=process.cwd()] - The directory to look for '.gitsentryrc'. Defaults to the current working directory.
 * @returns {GitSentryConfig | null} The parsed configuration object, or exits the process if the file is not found.
 */
const getConfigValue = (crrPath: string = process.cwd()): GitSentryConfig | null => {
  const fullPath = path.join(crrPath, ".gitsentryrc");
  if (fs.existsSync(fullPath)) {
    const raw = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(raw) as GitSentryConfig;
  }

  logger.color("cyan", "");
  logger.error(
    "Configuration Error: '.gitsentryrc' not found in the current directory. Please ensure the project is initialized with a valid configuration file."
  );
  logger.color("cyan", "");
  process.exit(1);
};

export { getConfigValue };
