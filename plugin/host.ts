import { experimental_defineHostEntry } from "@get-bb/plugin-sdk";
import { runBd } from "../beads/bd-client";
import { bdHostContract } from "./host-contract";

export default experimental_defineHostEntry({
  contract: bdHostContract,
  handlers: {
    async execute({ command, args, cwd, timeoutMs }) {
      const expectedCommand = process.env.BEADS_BIN ?? "bd";
      if (command !== expectedCommand && command !== "bd") {
        return {
          status: "spawn_error" as const,
          exitCode: null,
          stdout: "",
          stderr: "",
          errorCode: "COMMAND_NOT_ALLOWED",
          error: "The Beads host worker only executes bd.",
        };
      }

      const result = await runBd(args, { cwd, timeoutMs });
      if (result.ok) {
        return {
          status: "exited" as const,
          exitCode: 0,
          stdout: result.stdout,
          stderr: result.stderr,
          errorCode: null,
          error: null,
        };
      }
      if (result.kind === "spawn") {
        return {
          status: "spawn_error" as const,
          exitCode: null,
          stdout: "",
          stderr: "",
          errorCode: result.code,
          error: result.message,
        };
      }
      if (result.kind === "transport") {
        return {
          status: result.status,
          exitCode: null,
          stdout: result.stdout,
          stderr: result.stderr,
          errorCode: result.code,
          error: result.message,
        };
      }
      return {
        status: "exited" as const,
        exitCode: result.kind === "exit" ? result.code : 1,
        stdout: result.kind === "exit" ? result.stdout : "",
        stderr: result.kind === "exit" ? result.stderr : result.error,
        errorCode: null,
        error: null,
      };
    },
  },
});
