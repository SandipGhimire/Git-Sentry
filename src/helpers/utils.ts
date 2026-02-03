import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger";

const checkGit = () => {
  const gitDir = path.join(process.cwd(), ".git");
  if (!fs.existsSync(gitDir) || !fs.lstatSync(gitDir).isDirectory()) {
    logger.color("cyan", "");
    logger.error("Not .git folder.\n");
    process.exit(0);
  }
};

export { checkGit };
