import type chalk from "chalk";

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
