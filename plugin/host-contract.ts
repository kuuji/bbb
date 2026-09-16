import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

export const bdHostContract = defineRpcContract({
  execute: {
    input: z.object({
      command: z.string().min(1),
      args: z.array(z.string()).max(256),
      cwd: z.string().min(1),
      timeoutMs: z.number().int().positive().max(30_000).optional(),
    }).strict(),
    output: z.object({
      status: z.enum(["exited", "spawn_error", "timed_out", "output_limit"]),
      exitCode: z.number().int().nullable(),
      stdout: z.string(),
      stderr: z.string(),
      errorCode: z.string().nullable(),
      error: z.string().nullable(),
    }).strict(),
  },
});
