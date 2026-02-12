import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { addHooks, createDefaultConfig } from "../src/helpers/utils/commands";
import { GIT_SENTRY_CONFIG_VERSION } from "../src/helpers/constants";
import logger from "../src/helpers/logger";
import * as gitUtils from "../src/helpers/utils/git";

vi.mock("node:fs");
vi.mock("../src/helpers/logger");
vi.mock("../src/helpers/utils/git");

const mockedFs = fs as any;
const mockedLogger = logger as any;
const mockedGitUtils = gitUtils as any;

describe("Init Commands", () => {
  const mockCwd = "/mock/project";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "cwd").mockReturnValue(mockCwd);
    vi.spyOn(process, "exit").mockImplementation((_code: any) => undefined as never);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  // ─── createDefaultConfig ─────────────────────────────────────────────

  describe("createDefaultConfig", () => {
    it("should create a default config if it does not exist", () => {
      mockedFs.existsSync.mockReturnValue(false);

      createDefaultConfig();

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        path.join(mockCwd, ".gitsentryrc"),
        expect.stringContaining('"hooks":'),
        "utf8"
      );
      expect(mockedLogger.info).toHaveBeenCalledWith(expect.stringContaining("Created default"));
    });

    it("should skip creation if config already exists", () => {
      mockedFs.existsSync.mockReturnValue(true);

      createDefaultConfig();

      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
      expect(mockedLogger.info).toHaveBeenCalledWith(expect.stringContaining("already exists"));
    });
  });

  describe("addHooks", () => {
    const setupFsMocksForHooks = (hookFileHandler: (p: string) => boolean) => {
      mockedGitUtils.checkGit.mockImplementation(() => {});
      mockedFs.existsSync.mockImplementation((p: any) => {
        if (typeof p === "string" && p.endsWith(".git")) return true;
        if (typeof p === "string" && p.includes(".git/hooks") && !p.includes("hooks/")) return true;
        return hookFileHandler(p);
      });
      mockedFs.lstatSync.mockReturnValue({ isDirectory: () => true } as any);
    };

    it("should add hooks to .git/hooks directory", () => {
      setupFsMocksForHooks(() => false);

      addHooks();

      expect(mockedFs.writeFileSync).toHaveBeenCalled();
      expect(mockedLogger.info).toHaveBeenCalledWith(expect.stringContaining("Git Hooks Update Summary"));
    });

    it("should fail if no .git directory found", () => {
      mockedGitUtils.checkGit.mockImplementation(() => {});
      mockedFs.existsSync.mockReturnValue(false);

      addHooks();

      expect(mockedLogger.segmentColor).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining("No .git directory found") })])
      );
    });

    it("should create new hook files with versioned git-sentry block", () => {
      setupFsMocksForHooks(() => false);

      addHooks();

      const calls = mockedFs.writeFileSync.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      for (const [, content] of calls) {
        expect(content).toContain(`# >>> git-sentry start v${GIT_SENTRY_CONFIG_VERSION} >>>`);
        expect(content).toContain("# <<< git-sentry end <<<");
      }
    });

    it("should include CI environment check in generated hook block", () => {
      setupFsMocksForHooks(() => false);

      addHooks();

      const calls = mockedFs.writeFileSync.mock.calls;
      for (const [, content] of calls) {
        expect(content).toContain('[ -z "$CI" ]');
      }
    });

    it("should include node and npx availability checks in generated hook block", () => {
      setupFsMocksForHooks(() => false);

      addHooks();

      const calls = mockedFs.writeFileSync.mock.calls;
      for (const [, content] of calls) {
        expect(content).toContain("command -v node");
        expect(content).toContain("command -v npx");
      }
    });

    it("should include .gitsentryrc existence check in generated hook block", () => {
      setupFsMocksForHooks(() => false);

      addHooks();

      const calls = mockedFs.writeFileSync.mock.calls;
      for (const [, content] of calls) {
        expect(content).toContain('[ -f ".gitsentryrc" ]');
      }
    });

    it("should include node_modules/.bin/git-sentry existence check in generated hook block", () => {
      setupFsMocksForHooks(() => false);

      addHooks();

      const calls = mockedFs.writeFileSync.mock.calls;
      for (const [, content] of calls) {
        expect(content).toContain('[ -f "node_modules/.bin/git-sentry" ]');
      }
    });

    it("should include auto-managed header comment in new hook files", () => {
      setupFsMocksForHooks(() => false);

      addHooks();

      const calls = mockedFs.writeFileSync.mock.calls;
      for (const [, content] of calls) {
        expect(content).toContain("Auto-managed by Git-Sentry");
      }
    });

    it("should return 'exists' status when hook has same GIT_SENTRY_CONFIG_VERSION", () => {
      const currentVersionBlock = [
        `# >>> git-sentry start v${GIT_SENTRY_CONFIG_VERSION} >>>`,
        'if [ -z "$CI" ] \\',
        "&& command -v node >/dev/null 2>&1 \\",
        "&& command -v npx >/dev/null 2>&1 \\",
        '&& [ -f ".gitsentryrc" ] \\',
        '&& [ -f "node_modules/.bin/git-sentry" ]; then',
        '  npx git-sentry run pre-commit || echo "npx git-sentry run pre-commit failed to execute."',
        "else",
        '  echo "[git-sentry] Skipping hook"',
        "  exit 0",
        "fi",
        "# <<< git-sentry end <<<",
      ].join("\n");

      const hookContent = `#!/bin/sh\n# ⚠ Auto-managed by Git-Sentry\n${currentVersionBlock}\n`;

      mockedGitUtils.checkGit.mockImplementation(() => {});
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.lstatSync.mockReturnValue({ isDirectory: () => true } as any);
      mockedFs.readFileSync.mockReturnValue(hookContent);

      addHooks();

      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();

      expect(mockedLogger.segmentColor).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining("up-to-date") })])
      );
    });

    it("should return 'updated' status and replace block when version differs", () => {
      const oldVersionBlock = [
        "# >>> git-sentry start v0.9.0 >>>",
        'if [ -z "$CI" ]; then',
        "  npx git-sentry run pre-commit",
        "fi",
        "# <<< git-sentry end <<<",
      ].join("\n");

      const hookContent = `#!/bin/sh\n${oldVersionBlock}\n`;

      mockedGitUtils.checkGit.mockImplementation(() => {});
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.lstatSync.mockReturnValue({ isDirectory: () => true } as any);
      mockedFs.readFileSync.mockReturnValue(hookContent);

      addHooks();

      expect(mockedFs.writeFileSync).toHaveBeenCalled();

      const calls = mockedFs.writeFileSync.mock.calls;
      for (const [, content] of calls) {
        expect(content).toContain(`# >>> git-sentry start v${GIT_SENTRY_CONFIG_VERSION} >>>`);
        expect(content).not.toContain("v0.9.0");
      }
    });

    it("should append versioned block when hook file exists but has no git-sentry block", () => {
      const hookContent = `#!/bin/sh\necho "custom user hook"\n`;

      mockedGitUtils.checkGit.mockImplementation(() => {});
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.lstatSync.mockReturnValue({ isDirectory: () => true } as any);
      mockedFs.readFileSync.mockReturnValue(hookContent);

      addHooks();

      expect(mockedFs.writeFileSync).toHaveBeenCalled();

      const calls = mockedFs.writeFileSync.mock.calls;
      for (const [, content] of calls) {
        expect(content).toContain("custom user hook");
        expect(content).toContain(`# >>> git-sentry start v${GIT_SENTRY_CONFIG_VERSION} >>>`);
        expect(content).toContain("# <<< git-sentry end <<<");
      }

      expect(mockedLogger.segmentColor).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining("Appended") })])
      );
    });

    it("should remove old unversioned '# Auto-generated by git-sentry tool' blocks", () => {
      const legacyContent = `#!/bin/sh\n# Auto-generated by git-sentry tool\nnpx git-sentry run pre-commit`;

      mockedGitUtils.checkGit.mockImplementation(() => {});
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.lstatSync.mockReturnValue({ isDirectory: () => true } as any);
      mockedFs.readFileSync.mockReturnValue(legacyContent);

      addHooks();

      expect(mockedFs.writeFileSync).toHaveBeenCalled();

      const calls = mockedFs.writeFileSync.mock.calls;
      for (const [, content] of calls) {
        expect(content).toContain(`# >>> git-sentry start v${GIT_SENTRY_CONFIG_VERSION} >>>`);
      }
    });

    it("should display [✎] icon for 'updated' status in summary", () => {
      const oldVersionBlock = [
        "# >>> git-sentry start v0.1.0 >>>",
        'if [ -z "$CI" ]; then',
        "  npx git-sentry run pre-commit",
        "fi",
        "# <<< git-sentry end <<<",
      ].join("\n");

      const hookContent = `#!/bin/sh\n${oldVersionBlock}\n`;

      mockedGitUtils.checkGit.mockImplementation(() => {});
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.lstatSync.mockReturnValue({ isDirectory: () => true } as any);
      mockedFs.readFileSync.mockReturnValue(hookContent);

      addHooks();

      expect(mockedLogger.segmentColor).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining("[✎]"), color: "blue" })])
      );
    });

    it("should propagate Error.message when addHookCommand catches an Error", () => {
      mockedGitUtils.checkGit.mockImplementation(() => {});
      mockedFs.existsSync.mockImplementation((p: any) => {
        if (typeof p === "string" && p.endsWith(".git")) return true;
        return false;
      });
      mockedFs.lstatSync.mockImplementation(() => {
        throw new Error("permission denied");
      });

      addHooks();

      expect(mockedLogger.segmentColor).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining("permission denied") })])
      );
    });

    it("should stringify non-Error thrown values in addHookCommand", () => {
      mockedGitUtils.checkGit.mockImplementation(() => {});
      mockedFs.existsSync.mockImplementation((p: any) => {
        if (typeof p === "string" && p.endsWith(".git")) return true;
        return false;
      });
      mockedFs.lstatSync.mockImplementation(() => {
        throw "raw string error";
      });

      addHooks();

      expect(mockedLogger.segmentColor).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining("raw string error") })])
      );
    });
  });
});
