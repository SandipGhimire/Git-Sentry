import type chalk from "chalk";

/**
 * Options that modify how a Git hook runner is executed.
 */
export interface HookOptions {
  parallel?: boolean;
  failFast?: boolean;
  timeout?: number;
  ignoreErrors?: boolean;
  branches?: string[];
  skipIfMessageContains?: string;
  cwd?: string;
  verbose?: boolean;
}

/**
 * Configuration for a single Git hook runner.
 */
export interface HookConfig {
  commands: string[];
  options?: HookOptions;
}

/**
 * Root configuration structure for Git Sentry File.
 */
export interface GitSentryConfig {
  hooks: Record<string, HookConfig>;
}

/**
 * Interface for segment colors logger
 */
export interface ColoredSegment {
  text: string;
  color?: keyof typeof chalk;
  bgColor?: keyof typeof chalk;
  bold?: boolean;
  underline?: boolean;
}

/**
 * Interface for init hook results
 */
export interface HookResult {
  hook: string;
  status: "created" | "appended" | "exists" | "failed";
  message: string;
}

/**
 * Interface for command results
 */
export interface CommandResult {
  command: string;
  status: "success" | "failed" | "skipped";
  duration: number;
  error?: string;
}
