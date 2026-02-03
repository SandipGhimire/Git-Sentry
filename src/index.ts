#!/usr/bin/env node
import { Command } from "commander";
import { checkGit, checkHook, startSpinner, stopSpinner } from "./helpers/utils";

const program = new Command();

program.name("git-sentry").description("Config-driven git hook runner");

program
  .command("run")
  .description("Run the configured hooks")
  .argument("<hook>", "git hook name")
  .action(async (hook: string) => {
    checkGit();
    checkHook(hook);

    startSpinner();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    stopSpinner();

    process.exit(1);
  });

program.parse();
