/**
 * GitSentry File Name
 */
export const GIT_SENTRY_FILE_NAME = ".gitsentryrc";

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
