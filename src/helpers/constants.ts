/**
 * Git-Sentry File Name
 */
export const GIT_SENTRY_FILE_NAME = ".gitsentryrc";

/**
 * Git-Sentry Config Version
 */
export const GIT_SENTRY_CONFIG_VERSION = "1.0.0";

/**
 * List of git hooks supported by the plugins
 */
export const HOOKS: string[] = [
  "pre-commit",
  "prepare-commit-msg",
  "commit-msg",
  "post-commit",
  "post-rewrite",
  "pre-rebase",
  "post-checkout",
  "post-merge",
  "pre-push",
  "pre-applypatch",
  "post-applypatch",
  "applypatch-msg",
  "pre-auto-gc",
];
