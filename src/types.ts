import type chalk from "chalk";

/**
 * Options that modify how a Git hook runner is executed.
 */
export interface HookOptions {
  parallel?: boolean;
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
