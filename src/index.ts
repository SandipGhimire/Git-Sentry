#!/usr/bin/env node
import { Command } from "commander";
import { logger } from "./helpers/logger";

const program = new Command();

program.name("git-sentry").description("Config-driven git hook runner");

program
  .command("run")
  .description("Run the configured hooks")
  .argument("<hook>", "git hook name")
  .action((hook: string) => {
    logger.info("test", hook);
    process.exit(1);
  });

program.parse();
