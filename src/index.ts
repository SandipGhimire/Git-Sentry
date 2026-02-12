#!/usr/bin/env node

import { Command } from "commander";
import executeCommand from "./commands/execute";
import initPlugin from "./commands/init";
import { checkGit, checkHook } from "./helpers/utils/git";
import logger from "./helpers/logger";

const program = new Command();

program.name("git-sentry").description("Config-driven git hook runner");

program
  .command("run")
  .description("Run the configured hooks")
  .argument("<hook>", "git hook name")
  .action(async (hook: string) => {
    checkGit();
    checkHook(hook);
    const ci = process.env.CI;
    if (ci !== undefined && (ci === "1" || ci.toLowerCase() === "true")) {
      logger.warn(`Skipping hooks because CI=${ci}`);
      process.exit(0);
    }
    await executeCommand(hook);
    process.exit(0);
  });

program
  .command("init")
  .description("Initialize Git Sentry")
  .action(() => {
    checkGit();
    initPlugin();
    process.exit(0);
  });

program.parse();
