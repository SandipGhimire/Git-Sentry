#!/usr/bin/env node

import { Command } from "commander";
import executeCommand from "./commands/execute";
import initPlugin from "./commands/init";
import { checkGit, checkHook } from "./helpers/utils/git";

const program = new Command();

program.name("git-sentry").description("Config-driven git hook runner");

program
  .command("run")
  .description("Run the configured hooks")
  .argument("<hook>", "git hook name")
  .action(async (hook: string) => {
    checkGit();
    checkHook(hook);
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
