import { runCommands } from "@/helpers/utils/commands";
import { getConfigValue } from "@/helpers/utils/config";
import { type HookConfig } from "@/types";

/**
 * Executes configured commands for a specific Git hook.
 *
 * - Loads the Git Sentry configuration.
 * - Retrieves commands for the given hook.
 * - Runs the commands if any are defined.
 *
 * @param {string} hook - Name of the Git hook to execute.
 * @returns {Promise<void>}
 */
const executeCommand = async (hook: string) => {
  const config = getConfigValue();
  if (!config) return;
  const hookDetail = config.hooks[hook] as HookConfig | null;
  if (!hookDetail) return;
  if (hookDetail.commands.length === 0) return;

  await runCommands(hookDetail.commands, hookDetail.options);
};

export default executeCommand;
