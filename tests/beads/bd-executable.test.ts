import { describe, expect, it } from "vitest";
import { isBdExecutable } from "../../beads/bd-executable";

describe("Beads executable boundary", () => {
  it("accepts PATH tools and absolute Unix/Windows bd paths", () => {
    for (const command of ["bd", "bd.exe", "/home/alex/beads-http/bin/bd", "C:\\Tools\\bd.exe"]) {
      expect(isBdExecutable(command)).toBe(true);
    }
  });
  it("rejects shells, other tools, relative paths and command strings", () => {
    for (const command of ["sh", "/bin/sh", "./bd", "../bd", "bd --json", "/usr/bin/bd --json"]) {
      expect(isBdExecutable(command)).toBe(false);
    }
  });
});
