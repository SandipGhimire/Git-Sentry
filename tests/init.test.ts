import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { addHooks, createDefaultConfig } from "../src/helpers/utils/commands";
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
    it("should add hooks to .gitsentry directory", () => {
      mockedGitUtils.checkGit.mockImplementation(() => {});
      mockedFs.existsSync.mockImplementation((p: any) => {
        if (typeof p === "string" && p.endsWith(".gitsentry")) return true;
        return false;
      });
      mockedFs.lstatSync.mockReturnValue({ isDirectory: () => true } as any);
      mockedFs.readFileSync.mockReturnValue("");

      addHooks();

      expect(mockedFs.writeFileSync).toHaveBeenCalled();
      expect(mockedLogger.info).toHaveBeenCalledWith(expect.stringContaining("Git Hooks Update Summary"));
    });
  });
});
