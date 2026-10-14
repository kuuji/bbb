import { describe, expect, it, vi } from "vitest";
import plugin from "../../plugin/server";
import {
  createFakePluginHost,
  type CreateFakePluginHostOptions,
} from "./fixtures/fake-plugin-host";

type PluginHostCommandResult = Awaited<ReturnType<NonNullable<CreateFakePluginHostOptions["hostCommandExecutor"]>>>;

vi.mock("@bb/plugin-sdk", () => ({
  defineRpcContract: (contract: unknown) => contract,
}));

const issue = {
  id: "bb-harness-1",
  title: "Harness issue",
  status: "open",
  priority: 2,
  issue_type: "task",
  labels: [],
  dependencies: [],
  dependents: [],
};

function successResult(value: unknown = issue): PluginHostCommandResult {
  return {
    status: "exited",
    exitCode: 0,
    signal: null,
    stdout: JSON.stringify(value),
    stderr: "",
    errorCode: null,
    error: null,
  };
}

describe("Beads server harness", () => {
  it("registers the public RPC methods and routes project commands", async () => {
    const requests: Array<{ hostId?: string; cwd: string; args: readonly string[] }> = [];
    const host = createFakePluginHost({
      projectSources: [
        {
          type: "local_path",
          path: "/remote/repository",
          hostId: "host-remote",
          isDefault: true,
        },
      ],
      hostCommandExecutor: async (request) => {
        requests.push(request);
        return successResult([issue]);
      },
    });
    await plugin(host.bb);

    expect(host.harness.registrations.rpcMethods).toEqual([
      "listProjects",
      "initializeProject",
      "listIssues",
      "showIssue",
      "createIssue",
      "updateIssue",
    ]);
    await expect(host.harness.callRpc("listIssues", { projectId: "proj-1" })).resolves.toEqual({
      issues: [expect.objectContaining({ id: issue.id })],
    });
    expect(requests[0]).toMatchObject({
      hostId: "host-remote",
      cwd: "/remote/repository",
    });
    expect(requests[0]?.args.slice(0, 2)).toEqual(["--json", "--sandbox"]);
  });

  it("routes an explicit workspace path through the primary host", async () => {
    const requests: Array<{ hostId?: string; cwd: string }> = [];
    const host = createFakePluginHost({
      workspacePath: "/primary/override",
      projectSources: [],
      hostCommandExecutor: async (request) => {
        requests.push(request);
        return successResult([issue]);
      },
    });
    await plugin(host.bb);

    await host.harness.callRpc("listIssues", {});
    expect(requests[0]).toMatchObject({ cwd: "/primary/override" });
    expect(requests[0]).toMatchObject({ hostId: "host-primary" });
  });

  it("uses the HTTP client and connection workspace on their explicit host", async () => {
    const execute = vi.fn(async () => successResult([issue]));
    const host = createFakePluginHost({
      settings: {
        workspacePath: "/home/alex/beads/central",
        workspaceHostId: "host-central-client",
        bdExecutable: "/home/alex/beads-http/bin/bd",
      },
      primaryHostId: "host-server",
      hostCommandExecutor: execute,
    });
    await plugin(host.bb);
    await host.harness.callRpc("listIssues", { projectId: "ignored-project" });
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      cwd: "/home/alex/beads/central",
      hostId: "host-central-client",
      command: "/home/alex/beads-http/bin/bd",
    }));
    await host.harness.callRpc("createIssue", { title: "Remote issue" });
    await host.harness.callRpc("updateIssue", { id: issue.id, title: "Changed" });
    expect(execute.mock.calls).toHaveLength(3);
    for (const [request] of execute.mock.calls as unknown as Array<[Record<string, unknown>]>) {
      expect(request).toMatchObject({
        cwd: "/home/alex/beads/central", hostId: "host-central-client",
        command: "/home/alex/beads-http/bin/bd",
      });
    }
  });

  it("does not initialize the repository when a remote connection workspace is active", async () => {
    const execute = vi.fn(async () => successResult([issue]));
    const host = createFakePluginHost({
      settings: { workspacePath: "/remote/connection", workspaceHostId: "host-client" },
      hostCommandExecutor: execute,
    });
    await plugin(host.bb);
    await expect(host.harness.callRpc("initializeProject", { projectId: "local-project" }))
      .rejects.toThrow("Clear the workspace path override");
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects a configured shell before routing any command", async () => {
    const execute = vi.fn(async () => successResult([issue]));
    const host = createFakePluginHost({
      settings: { workspacePath: "/remote/connection", bdExecutable: "/bin/sh" },
      hostCommandExecutor: execute,
    });
    await plugin(host.bb);
    await expect(host.harness.callRpc("listIssues", {})).rejects.toThrow("absolute path to bd");
    expect(execute).not.toHaveBeenCalled();
  });

  it("maps bd failures to actionable RPC errors", async () => {
    const host = createFakePluginHost({
      projectSources: [{ type: "local_path", path: "/workspace", isDefault: true }],
      hostCommandExecutor: async () => ({
        ...successResult(),
        status: "exited",
        exitCode: 1,
        stdout: "",
        stderr: "query parse failed",
      }),
    });
    await plugin(host.bb);

    await expect(
      host.harness.callRpc("listIssues", { projectId: "proj-1" }),
    ).rejects.toThrow("query parse failed");
  });
});
