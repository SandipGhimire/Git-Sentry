import { addHooks, createDefaultConfig } from "@/helpers/utils/commands";

/**
 * Initializes the Git Sentry plugin in the current project.
 *
 * - Registers Git hooks with git-sentry commands.
 * - Creates a default `.gitsentryrc` configuration file if missing.
 *
 * @returns {void}
 */

const initPlugin = () => {
  addHooks();
  createDefaultConfig();
};

export default initPlugin;
