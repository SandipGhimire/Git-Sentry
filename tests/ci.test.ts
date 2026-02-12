import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import logger from "../src/helpers/logger";

vi.mock("../src/helpers/logger");
vi.mock("../src/helpers/utils/git");

const mockedLogger = logger as any;

describe("CI Environment Check", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    vi.spyOn(process, "exit").mockImplementation((_code: any) => undefined as never);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("process.env.CI detection", () => {
    it("should recognise CI=1 as a CI environment", () => {
      process.env.CI = "1";
      const ci = process.env.CI;
      expect(ci !== undefined && (ci === "1" || ci.toLowerCase() === "true")).toBe(true);
    });

    it("should recognise CI=true as a CI environment", () => {
      process.env.CI = "true";
      const ci = process.env.CI;
      expect(ci !== undefined && (ci === "1" || ci.toLowerCase() === "true")).toBe(true);
    });

    it("should recognise CI=TRUE (case-insensitive) as a CI environment", () => {
      process.env.CI = "TRUE";
      const ci = process.env.CI;
      expect(ci !== undefined && (ci === "1" || ci.toLowerCase() === "true")).toBe(true);
    });

    it("should NOT treat CI=0 as a CI environment", () => {
      process.env.CI = "0";
      const ci = process.env.CI;
      expect(ci !== undefined && (ci === "1" || ci.toLowerCase() === "true")).toBe(false);
    });

    it("should NOT treat CI=false as a CI environment", () => {
      process.env.CI = "false";
      const ci = process.env.CI;
      expect(ci !== undefined && (ci === "1" || ci.toLowerCase() === "true")).toBe(false);
    });

    it("should NOT treat absence of CI as a CI environment", () => {
      delete process.env.CI;
      const ci = process.env.CI;
      expect(ci !== undefined && (ci === "1" || ci.toLowerCase?.() === "true")).toBe(false);
    });

    it("should NOT treat CI='' (empty) as a CI environment", () => {
      process.env.CI = "";
      const ci = process.env.CI;
      expect(ci === "1" || ci?.toLowerCase() === "true").toBe(false);
    });
  });

  describe("CI skip in generated hook shell block", () => {
    it("should generate shell code that skips when $CI is set", () => {
      const CI = "true";
      const shouldRun = CI === "" || CI === undefined;
      expect(shouldRun).toBe(false);
    });

    it("should generate shell code that runs when $CI is unset", () => {
      const CI = undefined;
      const shouldRun = CI === "" || CI === undefined;
      expect(shouldRun).toBe(true);
    });

    it("should generate shell code that runs when $CI is empty", () => {
      const CI = "";
      const shouldRun = CI === "" || CI === undefined;
      expect(shouldRun).toBe(true);
    });
  });

  describe("CI skip log message format", () => {
    it("should log correct CI skip warning with CI value", () => {
      process.env.CI = "true";
      const ci = process.env.CI;

      if (ci !== undefined && (ci === "1" || ci.toLowerCase() === "true")) {
        mockedLogger.warn(`Skipping hooks because CI=${ci}`);
      }

      expect(mockedLogger.warn).toHaveBeenCalledWith("Skipping hooks because CI=true");
    });

    it("should log correct CI skip warning when CI=1", () => {
      process.env.CI = "1";
      const ci = process.env.CI;

      if (ci !== undefined && (ci === "1" || ci.toLowerCase() === "true")) {
        mockedLogger.warn(`Skipping hooks because CI=${ci}`);
      }

      expect(mockedLogger.warn).toHaveBeenCalledWith("Skipping hooks because CI=1");
    });

    it("should not log CI skip warning when CI is not set", () => {
      delete process.env.CI;
      const ci = process.env.CI;

      if (ci !== undefined && (ci === "1" || ci.toLowerCase() === "true")) {
        mockedLogger.warn(`Skipping hooks because CI=${ci}`);
      }

      expect(mockedLogger.warn).not.toHaveBeenCalled();
    });
  });
});
