import { describe, it, expect, beforeEach, vi } from "vitest";
import { runCommands } from "../src/helpers/utils/commands";
import logger from "../src/helpers/logger";
import * as gitUtils from "../src/helpers/utils/git";
import { EventEmitter } from "node:events";

const mockSpawn = vi.fn();
vi.mock("node:child_process", () => ({
  spawn: (...args: any[]) => mockSpawn(...args),
}));

vi.mock("../src/helpers/logger");
vi.mock("../src/helpers/utils/git");

const mockedLogger = logger as any;
const mockedGitUtils = gitUtils as any;

describe("Execute Commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "exit").mockImplementation((_code: any) => undefined as never);
    vi.spyOn(process, "cwd").mockReturnValue("/mock/project");
    mockSpawn.mockImplementation(() => {
      const runner = new EventEmitter() as any;
      runner.stdout = new EventEmitter();
      runner.stderr = new EventEmitter();
      runner.kill = vi.fn();

      setTimeout(() => runner.emit("exit", 0), 10);

      return runner;
    });
  });

  describe("runCommands", () => {
    it("should run multiple commands sequentially", async () => {
      const commands = ["echo 1", "echo 2"];
      await runCommands(commands);

      expect(mockSpawn).toHaveBeenCalledTimes(2);
      expect(mockSpawn).toHaveBeenNthCalledWith(1, "echo 1", expect.anything());
      expect(mockSpawn).toHaveBeenNthCalledWith(2, "echo 2", expect.anything());
      expect(mockedLogger.segmentColor).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining("Total:") })])
      );
    });

    it("should respect failFast option", async () => {
      mockSpawn.mockImplementationOnce(() => {
        const runner = new EventEmitter() as any;
        runner.stdout = new EventEmitter();
        runner.stderr = new EventEmitter();
        setTimeout(() => runner.emit("exit", 1), 10);
        return runner;
      });

      const commands = ["fail", "echo 2"];
      await runCommands(commands, { failFast: true });

      expect(mockSpawn).toHaveBeenCalledTimes(1);
      expect(mockSpawn).toHaveBeenCalledWith("fail", expect.anything());
    });

    it("should filter by branch", async () => {
      mockedGitUtils.getCurrentBranch.mockReturnValue("feature");

      const commands = ["echo 1"];
      await runCommands(commands, { branches: ["master"] });

      expect(mockSpawn).not.toHaveBeenCalled();
      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Skipping all commands on branch: feature")
      );
    });

    it("should skip if message contains prohibited string", async () => {
      mockedGitUtils.getCommitMessage.mockReturnValue("chore: skip this [skip ci]");

      const commands = ["echo 1"];
      await runCommands(commands, { skipIfMessageContains: "[skip ci]" });

      expect(mockSpawn).not.toHaveBeenCalled();
      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Skipping all commands due to commit message")
      );
    });

    it("should run in parallel when requested", async () => {
      const commands = ["sleep 1", "sleep 1"];
      await runCommands(commands, { parallel: true });

      expect(mockSpawn).toHaveBeenCalledTimes(2);
    });
  });
});
